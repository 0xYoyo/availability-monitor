import type { AvailabilityObservation, AvailabilitySource, AvailabilityStatus } from "./availability.js";
import type { RoomConfig } from "./config.js";
import type { DateWindow } from "./dateWindows.js";

export interface CheckRequest {
  room: RoomConfig;
  dateWindow: DateWindow;
  guestCount: number;
  checkedAt: string;
  source: AvailabilitySource;
}

export interface AvailabilityChecker {
  checkAvailability(request: CheckRequest): Promise<AvailabilityObservation>;
}

export interface FakeCheckerRule {
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: AvailabilityStatus;
  source?: AvailabilitySource;
  message?: string;
}

export class FakeAvailabilityChecker implements AvailabilityChecker {
  constructor(private readonly rules: FakeCheckerRule[]) {}

  async checkAvailability(request: CheckRequest): Promise<AvailabilityObservation> {
    const matchingRule = this.rules.find(
      (rule) =>
        rule.roomId === request.room.id &&
        rule.checkIn === request.dateWindow.checkIn &&
        rule.checkOut === request.dateWindow.checkOut
    );

    return {
      roomId: request.room.id,
      roomName: request.room.name,
      checkIn: request.dateWindow.checkIn,
      checkOut: request.dateWindow.checkOut,
      nights: request.dateWindow.nights,
      status: matchingRule?.status ?? "unavailable",
      checkedAt: request.checkedAt,
      bookingUrl: request.room.bookingUrl,
      source: matchingRule?.source ?? request.source,
      message: matchingRule?.message
    };
  }
}
