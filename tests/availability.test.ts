import { describe, expect, it } from "vitest";

import {
  createObservationKey,
  validateAvailabilityObservation
} from "../src/core/availability.js";

describe("validateAvailabilityObservation", () => {
  it("accepts a valid observation", () => {
    const observation = {
      roomId: "mul-yam",
      roomName: "Mul Yam",
      checkIn: "2026-04-11",
      checkOut: "2026-04-13",
      nights: 2,
      status: "available" as const,
      checkedAt: "2026-03-31T12:00:00.000Z",
      bookingUrl: "https://example.com/mul-yam",
      source: "room_page" as const,
      message: "Room card appeared"
    };

    expect(validateAvailabilityObservation(observation)).toEqual(observation);
    expect(createObservationKey(observation)).toBe("mul-yam::2026-04-11::2026-04-13");
  });

  it("rejects invalid statuses", () => {
    expect(() =>
      validateAvailabilityObservation({
        roomId: "mul-yam",
        roomName: "Mul Yam",
        checkIn: "2026-04-11",
        checkOut: "2026-04-13",
        nights: 2,
        status: "book-now",
        checkedAt: "2026-03-31T12:00:00.000Z",
        bookingUrl: "https://example.com/mul-yam",
        source: "room_page"
      } as never)
    ).toThrow("Unsupported availability status: book-now");
  });

  it("rejects invalid timestamps", () => {
    expect(() =>
      validateAvailabilityObservation({
        roomId: "mul-yam",
        roomName: "Mul Yam",
        checkIn: "2026-04-11",
        checkOut: "2026-04-13",
        nights: 2,
        status: "available",
        checkedAt: "soon",
        bookingUrl: "https://example.com/mul-yam",
        source: "room_page"
      })
    ).toThrow("observation.checkedAt must be a valid ISO timestamp");
  });
});
