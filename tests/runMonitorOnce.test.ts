import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { runMonitorOnce } from "../src/runtime/runMonitorOnce.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.TEST_TELEGRAM_BOT_TOKEN;
  delete process.env.TEST_TELEGRAM_CHAT_ID;
});

describe("runMonitorOnce", () => {
  it("loads config, runs one cycle, and persists the next state", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "availability-monitor-"));
    const configPath = path.join(workspace, "monitor.config.json");
    const statePath = path.join(workspace, "state.json");

    await writeFile(
      configPath,
      JSON.stringify(
        {
          stateFilePath: "./state.json",
          checker: {
            kind: "fake",
            rules: [
              {
                roomId: "mul-yam",
                checkIn: "2026-04-11",
                checkOut: "2026-04-13",
                status: "available",
                message: "room reopened"
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
        },
        null,
        2
      )
    );

    const result = await runMonitorOnce({
      configPath,
      checkedAt: "2026-03-31T12:00:00.000Z"
    });

    expect(result.observations).toHaveLength(1);
    expect(result.alerts).toHaveLength(1);
    expect(result.notifiedAlertCount).toBe(1);
    expect(result.alerts[0]?.record.currentStatus).toBe("available");
    expect(result.statePath).toBe(statePath);

    const storedState = JSON.parse(await readFile(statePath, "utf8"));
    expect(storedState.records["mul-yam::2026-04-11::2026-04-13"]?.currentStatus).toBe(
      "available"
    );
  });

  it("reuses persisted state so unchanged availability does not re-alert inside cooldown", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "availability-monitor-"));
    const configPath = path.join(workspace, "monitor.config.json");

    await writeFile(
      configPath,
      JSON.stringify(
        {
          stateFilePath: "./state.json",
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
        },
        null,
        2
      )
    );

    const first = await runMonitorOnce({
      configPath,
      checkedAt: "2026-03-31T12:00:00.000Z"
    });
    const second = await runMonitorOnce({
      configPath,
      checkedAt: "2026-03-31T12:30:00.000Z"
    });

    expect(first.alerts).toHaveLength(1);
    expect(second.alerts).toEqual([]);
  });

  it("loads notifier secrets from a local .env file before parsing config", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "availability-monitor-"));
    const configPath = path.join(workspace, "monitor.config.json");

    await writeFile(
      path.join(workspace, ".env"),
      "TEST_TELEGRAM_BOT_TOKEN=env-token\nTEST_TELEGRAM_CHAT_ID=env-chat\n"
    );

    await writeFile(
      configPath,
      JSON.stringify(
        {
          stateFilePath: "./state.json",
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
        },
        null,
        2
      )
    );

    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      })
    );

    const result = await runMonitorOnce({
      configPath,
      checkedAt: "2026-03-31T12:00:00.000Z"
    });

    expect(result.notifiedAlertCount).toBe(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
