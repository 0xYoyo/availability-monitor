import { describe, expect, it } from "vitest";
import { FakeAvailabilityChecker } from "../src/core/checker.js";
import { parseMonitorConfig } from "../src/core/config.js";
import { runMonitorCycle } from "../src/core/monitor.js";
describe("runMonitorCycle", () => {
    it("checks every room-window combination and emits alerts through state transitions", async () => {
        const config = parseMonitorConfig({
            dateRangeStart: "2026-04-11",
            dateRangeEnd: "2026-04-14",
            nightCount: 2,
            guestCount: 2,
            pollIntervalMinutes: 10,
            cooldownMinutes: 60,
            alertMode: "newly_available",
            rooms: [
                {
                    id: "mul-yam",
                    name: "Mul Yam",
                    bookingUrl: "https://example.com/mul-yam",
                    priority: 1
                },
                {
                    id: "tenti",
                    name: "Tenti",
                    bookingUrl: "https://example.com/tenti",
                    priority: 2
                }
            ]
        });
        const checker = new FakeAvailabilityChecker([
            {
                roomId: "mul-yam",
                checkIn: "2026-04-11",
                checkOut: "2026-04-13",
                status: "available"
            },
            {
                roomId: "tenti",
                checkIn: "2026-04-12",
                checkOut: "2026-04-14",
                status: "minimum_stay_blocked"
            }
        ]);
        const result = await runMonitorCycle(config, checker, {
            checkedAt: "2026-03-31T12:00:00.000Z"
        });
        expect(result.observations).toHaveLength(4);
        expect(result.alerts).toHaveLength(1);
        expect(result.alerts[0]?.record.roomId).toBe("mul-yam");
        expect(result.nextState.records["mul-yam::2026-04-11::2026-04-13"]?.currentStatus).toBe("available");
        expect(result.nextState.records["tenti::2026-04-12::2026-04-14"]?.currentStatus).toBe("minimum_stay_blocked");
    });
    it("includes general search checks when a general URL is configured", async () => {
        const config = parseMonitorConfig({
            dateRangeStart: "2026-04-11",
            dateRangeEnd: "2026-04-13",
            nightCount: 2,
            guestCount: 2,
            pollIntervalMinutes: 10,
            cooldownMinutes: 60,
            alertMode: "newly_available",
            generalSearchUrl: "https://example.com/general",
            rooms: [
                {
                    id: "mul-yam",
                    name: "Mul Yam",
                    bookingUrl: "https://example.com/mul-yam",
                    priority: 1
                }
            ]
        });
        const checker = new FakeAvailabilityChecker([
            {
                roomId: "__general_search__",
                checkIn: "2026-04-11",
                checkOut: "2026-04-13",
                status: "available",
                source: "general_page"
            }
        ]);
        const result = await runMonitorCycle(config, checker, {
            checkedAt: "2026-03-31T12:00:00.000Z"
        });
        expect(result.observations).toHaveLength(2);
        expect(result.observations.map((observation) => observation.source)).toEqual([
            "room_page",
            "general_page"
        ]);
        expect(result.alerts).toHaveLength(1);
        expect(result.alerts[0]?.record.roomId).toBe("__general_search__");
    });
    it("respects previous state and cooldown when rerunning a cycle", async () => {
        const config = parseMonitorConfig({
            dateRangeStart: "2026-04-11",
            dateRangeEnd: "2026-04-13",
            nightCount: 2,
            guestCount: 2,
            pollIntervalMinutes: 10,
            cooldownMinutes: 60,
            alertMode: "newly_available",
            rooms: [
                {
                    id: "mul-yam",
                    name: "Mul Yam",
                    bookingUrl: "https://example.com/mul-yam",
                    priority: 1
                }
            ]
        });
        const checker = new FakeAvailabilityChecker([
            {
                roomId: "mul-yam",
                checkIn: "2026-04-11",
                checkOut: "2026-04-13",
                status: "available"
            }
        ]);
        const first = await runMonitorCycle(config, checker, {
            checkedAt: "2026-03-31T12:00:00.000Z"
        });
        const second = await runMonitorCycle(config, checker, {
            checkedAt: "2026-03-31T12:20:00.000Z",
            previousState: first.nextState
        });
        expect(first.alerts).toHaveLength(1);
        expect(second.alerts).toEqual([]);
    });
    it("emits all currently available matches every run when configured", async () => {
        const config = parseMonitorConfig({
            dateRangeStart: "2026-04-11",
            dateRangeEnd: "2026-04-13",
            nightCount: 2,
            guestCount: 2,
            pollIntervalMinutes: 10,
            cooldownMinutes: 60,
            alertMode: "all_currently_available",
            rooms: [
                {
                    id: "mul-yam",
                    name: "Mul Yam",
                    bookingUrl: "https://example.com/mul-yam",
                    priority: 1
                }
            ]
        });
        const checker = new FakeAvailabilityChecker([
            {
                roomId: "mul-yam",
                checkIn: "2026-04-11",
                checkOut: "2026-04-13",
                status: "available"
            }
        ]);
        const first = await runMonitorCycle(config, checker, {
            checkedAt: "2026-03-31T12:00:00.000Z"
        });
        const second = await runMonitorCycle(config, checker, {
            checkedAt: "2026-03-31T12:20:00.000Z",
            previousState: first.nextState
        });
        expect(first.alerts).toHaveLength(1);
        expect(first.alerts[0]?.reason).toBe("currently_available");
        expect(second.alerts).toHaveLength(1);
        expect(second.alerts[0]?.reason).toBe("currently_available");
    });
});
