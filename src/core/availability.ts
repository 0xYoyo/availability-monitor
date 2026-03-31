import { validateIsoDate } from "./dateUtils.js";

export const AVAILABILITY_STATUSES = [
  "available",
  "unavailable",
  "minimum_stay_blocked",
  "unknown",
  "error"
] as const;

export const AVAILABILITY_SOURCES = ["room_page", "general_page"] as const;

export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];
export type AvailabilitySource = (typeof AVAILABILITY_SOURCES)[number];

export interface AvailabilityObservation {
  roomId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: AvailabilityStatus;
  checkedAt: string;
  bookingUrl: string;
  source: AvailabilitySource;
  message?: string;
}

export function validateAvailabilityObservation(
  observation: AvailabilityObservation
): AvailabilityObservation {
  if (!observation.roomId.trim()) {
    throw new Error("observation.roomId is required");
  }

  if (!observation.roomName.trim()) {
    throw new Error("observation.roomName is required");
  }

  validateIsoDate(observation.checkIn, "observation.checkIn");
  validateIsoDate(observation.checkOut, "observation.checkOut");

  if (!Number.isInteger(observation.nights) || observation.nights <= 0) {
    throw new Error("observation.nights must be a positive integer");
  }

  if (!AVAILABILITY_STATUSES.includes(observation.status)) {
    throw new Error(`Unsupported availability status: ${observation.status}`);
  }

  if (!AVAILABILITY_SOURCES.includes(observation.source)) {
    throw new Error(`Unsupported availability source: ${observation.source}`);
  }

  if (!observation.bookingUrl.trim()) {
    throw new Error("observation.bookingUrl is required");
  }

  if (Number.isNaN(Date.parse(observation.checkedAt))) {
    throw new Error("observation.checkedAt must be a valid ISO timestamp");
  }

  return observation;
}

export function createObservationKey(
  observation: Pick<AvailabilityObservation, "roomId" | "checkIn" | "checkOut">
): string {
  return `${observation.roomId}::${observation.checkIn}::${observation.checkOut}`;
}
