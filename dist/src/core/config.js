import { generateDateWindows } from "./dateWindows.js";
export const ALERT_MODES = [
    "newly_available",
    "all_currently_available"
];
export function parseMonitorConfig(input) {
    if (!isRecord(input)) {
        throw new Error("config must be an object");
    }
    const dateRangeStart = readRequiredString(input, "dateRangeStart");
    const dateRangeEnd = readRequiredString(input, "dateRangeEnd");
    const nightCount = readPositiveInteger(input, "nightCount");
    const guestCount = readPositiveInteger(input, "guestCount");
    const pollIntervalMinutes = readPositiveInteger(input, "pollIntervalMinutes");
    const cooldownMinutes = readNonNegativeInteger(input, "cooldownMinutes");
    const alertMode = readAlertMode(input, "alertMode");
    const generalSearchUrl = readOptionalString(input, "generalSearchUrl");
    const rooms = parseRooms(input.rooms);
    const dateWindows = generateDateWindows(dateRangeStart, dateRangeEnd, nightCount);
    if (dateWindows.length === 0) {
        throw new Error("config date range does not produce any valid stay windows");
    }
    return {
        dateRangeStart,
        dateRangeEnd,
        nightCount,
        guestCount,
        pollIntervalMinutes,
        cooldownMinutes,
        alertMode,
        rooms,
        generalSearchUrl,
        dateWindows
    };
}
function parseRooms(input) {
    if (!Array.isArray(input) || input.length === 0) {
        throw new Error("config.rooms must be a non-empty array");
    }
    const ids = new Set();
    const rooms = input.map((value, index) => {
        if (!isRecord(value)) {
            throw new Error(`config.rooms[${index}] must be an object`);
        }
        const room = {
            id: readRequiredString(value, "id", `config.rooms[${index}]`),
            name: readRequiredString(value, "name", `config.rooms[${index}]`),
            bookingUrl: readRequiredString(value, "bookingUrl", `config.rooms[${index}]`),
            priority: readPositiveInteger(value, "priority", `config.rooms[${index}]`)
        };
        if (ids.has(room.id)) {
            throw new Error(`config.rooms contains duplicate room id: ${room.id}`);
        }
        ids.add(room.id);
        return room;
    });
    return rooms.sort((left, right) => left.priority - right.priority);
}
function readRequiredString(record, key, path = "config") {
    const value = record[key];
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`${path}.${key} must be a non-empty string`);
    }
    return value.trim();
}
function readOptionalString(record, key, path = "config") {
    const value = record[key];
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`${path}.${key} must be a non-empty string when provided`);
    }
    return value.trim();
}
function readPositiveInteger(record, key, path = "config") {
    const value = record[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        throw new Error(`${path}.${key} must be a positive integer`);
    }
    return value;
}
function readNonNegativeInteger(record, key, path = "config") {
    const value = record[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new Error(`${path}.${key} must be a non-negative integer`);
    }
    return value;
}
function readAlertMode(record, key, path = "config") {
    const value = record[key];
    if (value === undefined) {
        return "newly_available";
    }
    if (typeof value !== "string" || !ALERT_MODES.includes(value)) {
        throw new Error(`${path}.${key} must be one of: ${ALERT_MODES.join(", ")}`);
    }
    return value;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
