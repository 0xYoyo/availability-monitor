import { describe, expect, it } from "vitest";

import {
  parseRuntimeConfig,
  resolveRuntimeDateValue
} from "../src/runtime/runtimeConfig.js";

describe("parseRuntimeConfig", () => {
  it("parses a fake-checker runtime config", () => {
    const runtimeConfig = parseRuntimeConfig({
      stateFilePath: "tmp/state.json",
      checker: {
        kind: "fake",
        rules: [
          {
            roomId: "mul-yam",
            checkIn: "2026-04-11",
            checkOut: "2026-04-13",
            status: "available"
          }
        ]
      },
      monitor: {
        dateRangeStart: "2026-04-11",
        dateRangeEnd: "2026-04-13",
        nightCount: 2,
        guestCount: 2,
        pollIntervalMinutes: 10,
        cooldownMinutes: 60,
        rooms: [
          {
            id: "mul-yam",
            name: "Mul Yam",
            bookingUrl: "https://example.com/mul-yam",
            priority: 1
          }
        ]
      }
    });

    expect(runtimeConfig.stateFilePath).toBe("tmp/state.json");
    expect(runtimeConfig.checker.kind).toBe("fake");
    expect(runtimeConfig.notifier).toBeUndefined();
    expect(runtimeConfig.monitor.dateWindows).toEqual([
      { checkIn: "2026-04-11", checkOut: "2026-04-13", nights: 2 }
    ]);
  });

  it("parses an EZgo direct runtime config", () => {
    const runtimeConfig = parseRuntimeConfig({
      stateFilePath: "tmp/state.json",
      checker: {
        kind: "ezgo_direct",
        timeoutMs: 12000,
        maxRetries: 3,
        retryDelayMs: 250
      },
      monitor: {
        dateRangeStart: "2026-04-11",
        dateRangeEnd: "2026-04-13",
        nightCount: 2,
        guestCount: 2,
        pollIntervalMinutes: 10,
        cooldownMinutes: 60,
        rooms: [
          {
            id: "mul-yam",
            name: "Mul Yam",
            bookingUrl: "https://example.com/mul-yam",
            priority: 1
          }
        ]
      }
    });

    expect(runtimeConfig.checker).toEqual({
      kind: "ezgo_direct",
      timeoutMs: 12000,
      maxRetries: 3,
      retryDelayMs: 250
    });
  });

  it("rejects unsupported checker kinds", () => {
    expect(() =>
      parseRuntimeConfig({
        stateFilePath: "tmp/state.json",
        checker: {
          kind: "playwright"
        },
        monitor: {
          dateRangeStart: "2026-04-11",
          dateRangeEnd: "2026-04-13",
          nightCount: 2,
          guestCount: 2,
          pollIntervalMinutes: 10,
          cooldownMinutes: 60,
          rooms: [
            {
              id: "mul-yam",
              name: "Mul Yam",
              bookingUrl: "https://example.com/mul-yam",
              priority: 1
            }
          ]
        }
      })
    ).toThrow("config.checker.kind must be one of: fake, ezgo_direct");
  });

  it("parses a telegram notifier config", () => {
    const runtimeConfig = parseRuntimeConfig({
      stateFilePath: "tmp/state.json",
      checker: {
        kind: "fake",
        rules: []
      },
      notifier: {
        kind: "telegram",
        botToken: "token",
        chatId: "chat",
        messagePrefix: "Metzoke",
        silent: true
      },
      monitor: {
        dateRangeStart: "2026-04-11",
        dateRangeEnd: "2026-04-13",
        nightCount: 2,
        guestCount: 2,
        pollIntervalMinutes: 10,
        cooldownMinutes: 60,
        rooms: [
          {
            id: "mul-yam",
            name: "Mul Yam",
            bookingUrl: "https://example.com/mul-yam",
            priority: 1
          }
        ]
      }
    });

    expect(runtimeConfig.notifier).toEqual({
      kind: "telegram",
      botToken: "token",
      chatId: "chat",
      botTokenEnv: undefined,
      chatIdEnv: undefined,
      messagePrefix: "Metzoke",
      silent: true,
      apiBaseUrl: undefined
    });
  });

  it("reads telegram secrets from environment variables", () => {
    process.env.TEST_TELEGRAM_BOT_TOKEN = "env-token";
    process.env.TEST_TELEGRAM_CHAT_ID = "env-chat";

    const runtimeConfig = parseRuntimeConfig({
      stateFilePath: "tmp/state.json",
      checker: {
        kind: "fake",
        rules: []
      },
      notifier: {
        kind: "telegram",
        botTokenEnv: "TEST_TELEGRAM_BOT_TOKEN",
        chatIdEnv: "TEST_TELEGRAM_CHAT_ID"
      },
      monitor: {
        dateRangeStart: "2026-04-11",
        dateRangeEnd: "2026-04-13",
        nightCount: 2,
        guestCount: 2,
        pollIntervalMinutes: 10,
        cooldownMinutes: 60,
        rooms: [
          {
            id: "mul-yam",
            name: "Mul Yam",
            bookingUrl: "https://example.com/mul-yam",
            priority: 1
          }
        ]
      }
    });

    expect(runtimeConfig.notifier).toEqual({
      kind: "telegram",
      botToken: "env-token",
      chatId: "env-chat",
      botTokenEnv: "TEST_TELEGRAM_BOT_TOKEN",
      chatIdEnv: "TEST_TELEGRAM_CHAT_ID",
      apiBaseUrl: undefined,
      messagePrefix: undefined,
      silent: undefined
    });

    delete process.env.TEST_TELEGRAM_BOT_TOKEN;
    delete process.env.TEST_TELEGRAM_CHAT_ID;
  });

  it("rejects missing telegram secrets", () => {
    expect(() =>
      parseRuntimeConfig({
        stateFilePath: "tmp/state.json",
        checker: {
          kind: "fake",
          rules: []
        },
        notifier: {
          kind: "telegram",
          botTokenEnv: "MISSING_TELEGRAM_BOT_TOKEN",
          chatId: "chat"
        },
        monitor: {
          dateRangeStart: "2026-04-11",
          dateRangeEnd: "2026-04-13",
          nightCount: 2,
          guestCount: 2,
          pollIntervalMinutes: 10,
          cooldownMinutes: 60,
          rooms: [
            {
              id: "mul-yam",
              name: "Mul Yam",
              bookingUrl: "https://example.com/mul-yam",
              priority: 1
            }
          ]
        }
      })
    ).toThrow(
      "config.notifier.botTokenEnv points to an unset or empty environment variable: MISSING_TELEGRAM_BOT_TOKEN"
    );
  });

  it("rejects unsupported notifier kinds", () => {
    expect(() =>
      parseRuntimeConfig({
        stateFilePath: "tmp/state.json",
        checker: {
          kind: "fake",
          rules: []
        },
        notifier: {
          kind: "email"
        },
        monitor: {
          dateRangeStart: "2026-04-11",
          dateRangeEnd: "2026-04-13",
          nightCount: 2,
          guestCount: 2,
          pollIntervalMinutes: 10,
          cooldownMinutes: 60,
          rooms: [
            {
              id: "mul-yam",
              name: "Mul Yam",
              bookingUrl: "https://example.com/mul-yam",
              priority: 1
            }
          ]
        }
      })
    ).toThrow("config.notifier.kind must be one of: noop, telegram");
  });

  it("rejects invalid EZgo direct retry settings", () => {
    expect(() =>
      parseRuntimeConfig({
        stateFilePath: "tmp/state.json",
        checker: {
          kind: "ezgo_direct",
          timeoutMs: 0
        },
        monitor: {
          dateRangeStart: "2026-04-11",
          dateRangeEnd: "2026-04-13",
          nightCount: 2,
          guestCount: 2,
          pollIntervalMinutes: 10,
          cooldownMinutes: 60,
          rooms: [
            {
              id: "mul-yam",
              name: "Mul Yam",
              bookingUrl: "https://example.com/mul-yam",
              priority: 1
            }
          ]
        }
      })
    ).toThrow("config.checker.timeoutMs must be a positive integer when provided");
  });

  it("resolves rolling monitor dates such as tomorrow", () => {
    const runtimeConfig = parseRuntimeConfig(
      {
        stateFilePath: "tmp/state.json",
        checker: {
          kind: "fake",
          rules: []
        },
        monitor: {
          dateRangeStart: "tomorrow",
          dateRangeEnd: "2026-04-13",
          nightCount: 1,
          guestCount: 2,
          pollIntervalMinutes: 10,
          cooldownMinutes: 60,
          rooms: [
            {
              id: "mul-yam",
              name: "Mul Yam",
              bookingUrl: "https://example.com/mul-yam",
              priority: 1
            }
          ]
        }
      },
      {
        now: new Date("2026-03-31T10:00:00.000Z")
      }
    );

    expect(runtimeConfig.monitor.dateRangeStart).toBe("2026-04-01");
    expect(runtimeConfig.monitor.dateWindows[0]).toEqual({
      checkIn: "2026-04-01",
      checkOut: "2026-04-02",
      nights: 1
    });
  });
});

describe("resolveRuntimeDateValue", () => {
  it("supports today offsets", () => {
    expect(
      resolveRuntimeDateValue(
        "today+3",
        "config.monitor.dateRangeStart",
        new Date("2026-03-31T10:00:00.000Z")
      )
    ).toBe("2026-04-03");
  });
});
