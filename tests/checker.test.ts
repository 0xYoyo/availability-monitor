import { describe, expect, it } from "vitest";

import { FakeAvailabilityChecker } from "../src/core/checker.js";

describe("FakeAvailabilityChecker", () => {
  it("returns a matching configured observation", async () => {
    const checker = new FakeAvailabilityChecker([
      {
        roomId: "mul-yam",
        checkIn: "2026-04-11",
        checkOut: "2026-04-13",
        status: "available",
        message: "configured hit"
      }
    ]);

    const observation = await checker.checkAvailability({
      room: {
        id: "mul-yam",
        name: "Mul Yam",
        bookingUrl: "https://example.com/mul-yam",
        priority: 1
      },
      dateWindow: {
        checkIn: "2026-04-11",
        checkOut: "2026-04-13",
        nights: 2
      },
      guestCount: 2,
      checkedAt: "2026-03-31T12:00:00.000Z",
      source: "room_page"
    });

    expect(observation.status).toBe("available");
    expect(observation.message).toBe("configured hit");
  });

  it("defaults to unavailable when no rule matches", async () => {
    const checker = new FakeAvailabilityChecker([]);

    const observation = await checker.checkAvailability({
      room: {
        id: "mul-yam",
        name: "Mul Yam",
        bookingUrl: "https://example.com/mul-yam",
        priority: 1
      },
      dateWindow: {
        checkIn: "2026-04-11",
        checkOut: "2026-04-13",
        nights: 2
      },
      guestCount: 2,
      checkedAt: "2026-03-31T12:00:00.000Z",
      source: "room_page"
    });

    expect(observation.status).toBe("unavailable");
    expect(observation.source).toBe("room_page");
  });
});
