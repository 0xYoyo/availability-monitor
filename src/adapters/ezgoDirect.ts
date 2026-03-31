import type { AvailabilityObservation } from "../core/availability.js";
import type { AvailabilityChecker, CheckRequest } from "../core/checker.js";

type FetchLike = typeof fetch;

const MONTH_NAME_TO_NUMBER: Record<string, number> = {
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

interface EzgoHtmlState {
  html: string;
  pageUrl: string;
  viewState?: string;
  viewStateGenerator?: string;
}

interface ParsedMonth {
  month: number;
  year: number;
}

interface CalendarCell {
  day: number;
  title: string;
  isCurrentMonth: boolean;
}

export class EzgoDirectChecker implements AvailabilityChecker {
  constructor(private readonly fetchImpl: FetchLike = fetch) {}

  async checkAvailability(request: CheckRequest): Promise<AvailabilityObservation> {
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
          message:
            "Direct HTTP general-page parsing is not implemented yet; room-specific SI pages are the supported Stage 4 path."
        };
      }

      const engineUrl = await resolveEngineUrl(this.fetchImpl, request.room.bookingUrl);
      const seededUrl = buildSeededUrl(
        engineUrl,
        request.dateWindow.checkIn,
        request.dateWindow.checkOut
      );

      let state = await fetchHtmlState(this.fetchImpl, seededUrl);

      state = await ensureCalendarMonth(
        this.fetchImpl,
        state,
        "start",
        request.dateWindow.checkIn
      );

      state = await ensureCalendarMonth(
        this.fetchImpl,
        state,
        "end",
        request.dateWindow.checkOut
      );

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
    } catch (error) {
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

export function buildSeededUrl(engineUrl: string, checkIn: string, checkOut: string): string {
  const url = new URL(engineUrl);

  url.searchParams.set("sDate", checkIn);
  url.searchParams.set("eDate", checkOut);

  return url.toString();
}

export function classifyAvailability(
  startTitle: string | undefined,
  endTitle: string | undefined
): AvailabilityObservation["status"] {
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

export function parseSelectedDayTitle(
  html: string,
  calendarType: "start" | "end",
  isoDate: string
): string | undefined {
  const targetDay = Number.parseInt(isoDate.slice(8, 10), 10);
  const tableId = calendarType === "start" ? "CalStart_Top" : "CalChekOut_Top";
  const tableHtml = extractElementHtml(html, tableId, "table");

  if (!tableHtml) {
    return undefined;
  }

  const cells = parseCalendarCells(tableHtml);
  const matchingCell = cells.find(
    (cell) => cell.day === targetDay && cell.isCurrentMonth
  );

  return matchingCell?.title;
}

export function parseCalendarMonth(
  html: string,
  calendarType: "start" | "end"
): ParsedMonth | undefined {
  const monthId =
    calendarType === "start" ? "lblCalStartMonth_Top" : "lblCalCheckOutMonth_Top";
  const yearId =
    calendarType === "start" ? "lblCalStartYear_Top" : "lblCalCheckOutYear_Top";

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

export function extractEmbeddedEngineUrl(marketingHtml: string): string | undefined {
  const iframeMatch = marketingHtml.match(
    /<iframe[^>]+src="(https:\/\/engine\.ezgo\.co\.il\/[^"]+)"/i
  );

  return iframeMatch?.[1].replaceAll("&amp;", "&");
}

async function resolveEngineUrl(fetchImpl: FetchLike, bookingUrl: string): Promise<string> {
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

async function fetchHtmlState(fetchImpl: FetchLike, url: string): Promise<EzgoHtmlState> {
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

async function ensureCalendarMonth(
  fetchImpl: FetchLike,
  initialState: EzgoHtmlState,
  calendarType: "start" | "end",
  isoDate: string
): Promise<EzgoHtmlState> {
  const targetMonth = Number.parseInt(isoDate.slice(5, 7), 10);
  const targetYear = Number.parseInt(isoDate.slice(0, 4), 10);
  const eventTarget =
    calendarType === "start" ? "btNext_CalStart_Top" : "btNext_CheckOut_Top";

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

async function postBack(
  fetchImpl: FetchLike,
  state: EzgoHtmlState,
  eventTarget: string
): Promise<EzgoHtmlState> {
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

function extractInputValue(html: string, id: string): string | undefined {
  const escapedId = escapeRegExp(id);
  const pattern = new RegExp(`id="${escapedId}" value="([^"]*)"`, "i");
  return html.match(pattern)?.[1];
}

function extractSpanTextById(html: string, id: string): string | undefined {
  const escapedId = escapeRegExp(id);
  const pattern = new RegExp(`<span id="${escapedId}"[^>]*>([^<]+)</span>`, "i");
  return html.match(pattern)?.[1];
}

function extractElementHtml(
  html: string,
  id: string,
  tagName: string
): string | undefined {
  const escapedId = escapeRegExp(id);
  const escapedTag = escapeRegExp(tagName);
  const pattern = new RegExp(
    `<${escapedTag}[^>]*id="${escapedId}"[^>]*>([\\s\\S]*?)</${escapedTag}>`,
    "i"
  );

  return html.match(pattern)?.[1];
}

function parseCalendarCells(tableHtml: string): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const cellPattern = /<td([^>]*)title="([^"]+)"([^>]*)>([\s\S]*?)<\/td>/gi;
  let match: RegExpExecArray | null;

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

function isBlockedTitle(title: string | undefined): boolean {
  const normalized = normalizeTitle(title);
  return normalized === "מלא" || normalized.includes("מינימום");
}

function mapBlockedTitleToStatus(title: string): AvailabilityObservation["status"] {
  const normalized = normalizeTitle(title);
  return normalized.includes("מינימום") ? "minimum_stay_blocked" : "unavailable";
}

function normalizeTitle(title: string | undefined): string {
  return (title ?? "").trim();
}

function buildStatusMessage(
  startTitle: string | undefined,
  endTitle: string | undefined
): string {
  return `start=${startTitle ?? "missing"}; end=${endTitle ?? "missing"}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
