import { describe, expect, it, vi } from "vitest";

import {
  TelegramAlertNotifier,
  formatAvailabilityAlertMessage
} from "../src/adapters/telegramNotifier.js";
import type { AvailabilityAlert } from "../src/core/state.js";

const sampleAlert: AvailabilityAlert = {
  type: "availability_found",
  key: "reservationts::2026-04-13::2026-04-14",
  reason: "newly_available",
  record: {
    key: "reservationts::2026-04-13::2026-04-14",
    roomId: "reservationts",
    roomName: "Tenti S",
    checkIn: "2026-04-13",
    checkOut: "2026-04-14",
    nights: 1,
    bookingUrl: "https://example.com/book",
    source: "room_page",
    currentStatus: "available",
    firstSeenAt: "2026-03-31T12:00:00.000Z",
    lastCheckedAt: "2026-03-31T12:00:00.000Z",
    lastChangedAt: "2026-03-31T12:00:00.000Z",
    lastAvailableAt: "2026-03-31T12:00:00.000Z",
    lastAlertedAt: "2026-03-31T12:00:00.000Z",
    message: "start=פנוי; end=פנוי"
  }
};

describe("formatAvailabilityAlertMessage", () => {
  it("formats a clear telegram message", () => {
    expect(formatAvailabilityAlertMessage(sampleAlert, "Metzoke")).toContain(
      "Room: Tenti S"
    );
    expect(formatAvailabilityAlertMessage(sampleAlert, "Metzoke")).toContain(
      "Booking: https://example.com/book"
    );
  });
});

describe("TelegramAlertNotifier", () => {
  it("sends one telegram message per alert", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      })
    );

    const notifier = new TelegramAlertNotifier(
      {
        botToken: "token",
        chatId: "chat",
        apiBaseUrl: "https://api.example.test",
        messagePrefix: "Metzoke"
      },
      fetchImpl
    );

    await notifier.notifyAlerts([sampleAlert]);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.example.test/bottoken/sendMessage"
    );
    expect(String(fetchImpl.mock.calls[0]?.[1]?.body)).toContain("Availability found");
  });
});
