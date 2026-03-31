const MONTH_NAME_TO_NUMBER = {
    ינואר: 1,
    פברואר: 2,
    מרץ: 3,
    אפריל: 4,
    מאי: 5,
    יוני: 6,
    יולי: 7,
    אוגוסט: 8,
    ספטמבר: 9,
    אוקטובר: 10,
    נובמבר: 11,
    דצמבר: 12,
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12
};
export class EzgoDirectChecker {
    fetchImpl;
    constructor(fetchImpl = fetch) {
        this.fetchImpl = fetchImpl;
    }
    async checkAvailability(request) {
        try {
            if (request.source === "general_page") {
                return {
                    roomId: request.room.id,
                    roomName: request.room.name,
                    checkIn: request.dateWindow.checkIn,
                    checkOut: request.dateWindow.checkOut,
                    nights: request.dateWindow.nights,
                    status: "unknown",
                    checkedAt: request.checkedAt,
                    bookingUrl: request.room.bookingUrl,
                    source: request.source,
                    message: "Direct HTTP general-page parsing is not implemented yet; room-specific SI pages are the supported Stage 4 path."
                };
            }
            const engineUrl = await resolveEngineUrl(this.fetchImpl, request.room.bookingUrl);
            const seededUrl = buildSeededUrl(engineUrl, request.dateWindow.checkIn, request.dateWindow.checkOut);
            let state = await fetchHtmlState(this.fetchImpl, seededUrl);
            state = await ensureCalendarMonth(this.fetchImpl, state, "start", request.dateWindow.checkIn);
            state = await ensureCalendarMonth(this.fetchImpl, state, "end", request.dateWindow.checkOut);
            const startStatus = parseSelectedDayTitle(state.html, "start", request.dateWindow.checkIn);
            const endStatus = parseSelectedDayTitle(state.html, "end", request.dateWindow.checkOut);
            const status = classifyAvailability(startStatus, endStatus);
            return {
                roomId: request.room.id,
                roomName: request.room.name,
                checkIn: request.dateWindow.checkIn,
                checkOut: request.dateWindow.checkOut,
                nights: request.dateWindow.nights,
                status,
                checkedAt: request.checkedAt,
                bookingUrl: seededUrl,
                source: request.source,
                message: buildStatusMessage(startStatus, endStatus)
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                roomId: request.room.id,
                roomName: request.room.name,
                checkIn: request.dateWindow.checkIn,
                checkOut: request.dateWindow.checkOut,
                nights: request.dateWindow.nights,
                status: "error",
                checkedAt: request.checkedAt,
                bookingUrl: request.room.bookingUrl,
                source: request.source,
                message
            };
        }
    }
}
export function buildSeededUrl(engineUrl, checkIn, checkOut) {
    const url = new URL(engineUrl);
    url.searchParams.set("sDate", checkIn);
    url.searchParams.set("eDate", checkOut);
    return url.toString();
}
export function classifyAvailability(startTitle, endTitle) {
    if (!startTitle) {
        return "unknown";
    }
    if (isBlockedTitle(startTitle)) {
        return mapBlockedTitleToStatus(startTitle);
    }
    if (normalizeTitle(startTitle) !== "פנוי") {
        return "unknown";
    }
    if (isBlockedTitle(endTitle)) {
        return mapBlockedTitleToStatus(endTitle ?? "");
    }
    if (normalizeTitle(endTitle) === "פנוי") {
        return "available";
    }
    return "unknown";
}
export function parseSelectedDayTitle(html, calendarType, isoDate) {
    const targetDay = Number.parseInt(isoDate.slice(8, 10), 10);
    const tableId = calendarType === "start" ? "CalStart_Top" : "CalChekOut_Top";
    const tableHtml = extractElementHtml(html, tableId, "table");
    if (!tableHtml) {
        return undefined;
    }
    const cells = parseCalendarCells(tableHtml);
    const matchingCell = cells.find((cell) => cell.day === targetDay && cell.isCurrentMonth);
    return matchingCell?.title;
}
export function parseCalendarMonth(html, calendarType) {
    const monthId = calendarType === "start" ? "lblCalStartMonth_Top" : "lblCalCheckOutMonth_Top";
    const yearId = calendarType === "start" ? "lblCalStartYear_Top" : "lblCalCheckOutYear_Top";
    const monthName = extractSpanTextById(html, monthId);
    const yearText = extractSpanTextById(html, yearId);
    if (!monthName || !yearText) {
        return undefined;
    }
    const month = MONTH_NAME_TO_NUMBER[monthName.trim().toLowerCase()];
    const year = Number.parseInt(yearText.trim(), 10);
    if (!month || !Number.isInteger(year)) {
        return undefined;
    }
    return { month, year };
}
export function extractEmbeddedEngineUrl(marketingHtml) {
    const iframeMatch = marketingHtml.match(/<iframe[^>]+src="(https:\/\/engine\.ezgo\.co\.il\/[^"]+)"/i);
    return iframeMatch?.[1].replaceAll("&amp;", "&");
}
async function resolveEngineUrl(fetchImpl, bookingUrl) {
    if (bookingUrl.includes("engine.ezgo.co.il")) {
        return bookingUrl;
    }
    const response = await fetchImpl(bookingUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch booking page: ${response.status}`);
    }
    const html = await response.text();
    const embeddedUrl = extractEmbeddedEngineUrl(html);
    if (!embeddedUrl) {
        throw new Error("Could not find embedded EZgo engine URL in booking page");
    }
    return embeddedUrl;
}
async function fetchHtmlState(fetchImpl, url) {
    const response = await fetchImpl(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch EZgo page: ${response.status}`);
    }
    const html = await response.text();
    return {
        html,
        pageUrl: url,
        viewState: extractInputValue(html, "__VIEWSTATE"),
        viewStateGenerator: extractInputValue(html, "__VIEWSTATEGENERATOR")
    };
}
async function ensureCalendarMonth(fetchImpl, initialState, calendarType, isoDate) {
    const targetMonth = Number.parseInt(isoDate.slice(5, 7), 10);
    const targetYear = Number.parseInt(isoDate.slice(0, 4), 10);
    const eventTarget = calendarType === "start" ? "btNext_CalStart_Top" : "btNext_CheckOut_Top";
    let state = initialState;
    for (let attempts = 0; attempts < 12; attempts += 1) {
        const currentMonth = parseCalendarMonth(state.html, calendarType);
        if (!currentMonth) {
            return state;
        }
        if (currentMonth.month === targetMonth && currentMonth.year === targetYear) {
            return state;
        }
        const monthValue = currentMonth.year * 12 + currentMonth.month;
        const targetValue = targetYear * 12 + targetMonth;
        if (monthValue > targetValue) {
            return state;
        }
        state = await postBack(fetchImpl, state, eventTarget);
    }
    return state;
}
async function postBack(fetchImpl, state, eventTarget) {
    if (!state.viewState || !state.viewStateGenerator) {
        throw new Error("Missing ASP.NET view state required for postback");
    }
    const body = new URLSearchParams();
    body.set("__VIEWSTATE", state.viewState);
    body.set("__VIEWSTATEGENERATOR", state.viewStateGenerator);
    body.set("__EVENTTARGET", eventTarget);
    body.set("__EVENTARGUMENT", "");
    const response = await fetchImpl(state.pageUrl, {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded"
        },
        body
    });
    if (!response.ok) {
        throw new Error(`EZgo postback failed: ${response.status}`);
    }
    const html = await response.text();
    return {
        html,
        pageUrl: state.pageUrl,
        viewState: extractInputValue(html, "__VIEWSTATE"),
        viewStateGenerator: extractInputValue(html, "__VIEWSTATEGENERATOR")
    };
}
function extractInputValue(html, id) {
    const escapedId = escapeRegExp(id);
    const pattern = new RegExp(`id="${escapedId}" value="([^"]*)"`, "i");
    return html.match(pattern)?.[1];
}
function extractSpanTextById(html, id) {
    const escapedId = escapeRegExp(id);
    const pattern = new RegExp(`<span id="${escapedId}"[^>]*>([^<]+)</span>`, "i");
    return html.match(pattern)?.[1];
}
function extractElementHtml(html, id, tagName) {
    const escapedId = escapeRegExp(id);
    const escapedTag = escapeRegExp(tagName);
    const pattern = new RegExp(`<${escapedTag}[^>]*id="${escapedId}"[^>]*>([\\s\\S]*?)</${escapedTag}>`, "i");
    return html.match(pattern)?.[1];
}
function parseCalendarCells(tableHtml) {
    const cells = [];
    const cellPattern = /<td([^>]*)title="([^"]+)"([^>]*)>([\s\S]*?)<\/td>/gi;
    let match;
    while ((match = cellPattern.exec(tableHtml)) !== null) {
        const attrs = `${match[1]} ${match[3]}`;
        const content = match[4];
        const dayMatch = content.match(/<span class="date(?: curr-date)?">(\d+)<\/span>/i);
        if (!dayMatch) {
            continue;
        }
        cells.push({
            day: Number.parseInt(dayMatch[1], 10),
            title: match[2],
            isCurrentMonth: !/not-curr-month/i.test(content) && !/not-curr-month/i.test(attrs)
        });
    }
    return cells;
}
function isBlockedTitle(title) {
    const normalized = normalizeTitle(title);
    return normalized === "מלא" || normalized.includes("מינימום");
}
function mapBlockedTitleToStatus(title) {
    const normalized = normalizeTitle(title);
    return normalized.includes("מינימום") ? "minimum_stay_blocked" : "unavailable";
}
function normalizeTitle(title) {
    return (title ?? "").trim();
}
function buildStatusMessage(startTitle, endTitle) {
    return `start=${startTitle ?? "missing"}; end=${endTitle ?? "missing"}`;
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
