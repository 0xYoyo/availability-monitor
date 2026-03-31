import { describe, expect, it } from "vitest";

import { createEmptyState, applyObservations } from "../src/core/state.js";
import type { AvailabilityObservation } from "../src/core/availability.js";

describe("applyObservations", () => {
  const baseObservation: AvailabilityObservation = {
    roomId: "mul-yam",
    roomName: "Mul Yam",
    checkIn: "2026-04-11",
    checkOut: "2026-04-13",
    nights: 2,
    status: "available",
    checkedAt: "2026-03-31T12:00:00.000Z",
    bookingUrl: "https://example.com/mul-yam",
    source: "room_page"
  };

  it("alerts when a room-window combination becomes available for the first time", () => {
    const result = applyObservations(createEmptyState(), [baseObservation], {
      cooldownMinutes: 60
    });

    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]?.reason).toBe("newly_available");
    expect(result.nextState.records["mul-yam::2026-04-11::2026-04-13"]?.lastAlertedAt).toBe(
      "2026-03-31T12:00:00.000Z"
    );
  });

  it("does not re-alert unchanged availability inside the cooldown window", () => {
    const first = applyObservations(createEmptyState(), [baseObservation], {
      cooldownMinutes: 60
    });

    const second = applyObservations(
      first.nextState,
      [{ ...baseObservation, checkedAt: "2026-03-31T12:30:00.000Z" }],
      { cooldownMinutes: 60 }
    );

    expect(second.alerts).toEqual([]);
    expect(
      second.nextState.records["mul-yam::2026-04-11::2026-04-13"]?.lastAlertedAt
    ).toBe("2026-03-31T12:00:00.000Z");
  });

  it("re-alerts after cooldown elapses while availability is unchanged", () => {
    const first = applyObservations(createEmptyState(), [baseObservation], {
      cooldownMinutes: 60
    });

    const second = applyObservations(
      first.nextState,
      [{ ...baseObservation, checkedAt: "2026-03-31T13:15:00.000Z" }],
      { cooldownMinutes: 60 }
    );

    expect(second.alerts).toHaveLength(1);
    expect(second.alerts[0]?.reason).toBe("cooldown_elapsed");
    expect(
      second.nextState.records["mul-yam::2026-04-11::2026-04-13"]?.lastAlertedAt
    ).toBe("2026-03-31T13:15:00.000Z");
  });

  it("alerts again when a previously unavailable record becomes available", () => {
    const first = applyObservations(
      createEmptyState(),
      [{ ...baseObservation, status: "unavailable" }],
      { cooldownMinutes: 60 }
    );

    const second = applyObservations(
      first.nextState,
      [{ ...baseObservation, checkedAt: "2026-03-31T12:20:00.000Z" }],
      { cooldownMinutes: 60 }
    );

    expect(second.alerts).toHaveLength(1);
    expect(second.alerts[0]?.reason).toBe("newly_available");
  });

  it("tracks changed timestamps without alerting unavailable results", () => {
    const result = applyObservations(
      createEmptyState(),
      [{ ...baseObservation, status: "minimum_stay_blocked" }],
      { cooldownMinutes: 60 }
    );

    const record = result.nextState.records["mul-yam::2026-04-11::2026-04-13"];

    expect(result.alerts).toEqual([]);
    expect(record?.currentStatus).toBe("minimum_stay_blocked");
    expect(record?.lastChangedAt).toBe("2026-03-31T12:00:00.000Z");
    expect(record?.lastAvailableAt).toBeUndefined();
  });
});
