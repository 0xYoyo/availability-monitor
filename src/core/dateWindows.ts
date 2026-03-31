import { addDays, formatIsoDate, parseIsoDate, validateIsoDate } from "./dateUtils.js";

export interface DateWindow {
  checkIn: string;
  checkOut: string;
  nights: number;
}

export function generateDateWindows(
  rangeStart: string,
  rangeEnd: string,
  nights: number
): DateWindow[] {
  validateIsoDate(rangeStart, "rangeStart");
  validateIsoDate(rangeEnd, "rangeEnd");

  if (!Number.isInteger(nights) || nights <= 0) {
    throw new Error("nights must be a positive integer");
  }

  const start = parseIsoDate(rangeStart);
  const inclusiveEnd = parseIsoDate(rangeEnd);

  if (start.getTime() > inclusiveEnd.getTime()) {
    throw new Error("rangeStart must be on or before rangeEnd");
  }

  const latestCheckIn = addDays(inclusiveEnd, -nights);

  if (latestCheckIn.getTime() < start.getTime()) {
    return [];
  }

  const windows: DateWindow[] = [];
  let current = start;

  while (current.getTime() <= latestCheckIn.getTime()) {
    windows.push({
      checkIn: formatIsoDate(current),
      checkOut: formatIsoDate(addDays(current, nights)),
      nights
    });

    current = addDays(current, 1);
  }

  return windows;
}
