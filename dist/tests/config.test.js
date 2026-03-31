import { describe, expect, it } from "vitest";
import { parseMonitorConfig } from "../src/core/config.js";
describe("parseMonitorConfig", () => {
    it("parses and enriches a valid monitoring config", () => {
        const config = parseMonitorConfig({
            dateRangeStart: "2026-04-08",
            dateRangeEnd: "2026-04-12",
            nightCount: 2,
            guestCount: 2,
            pollIntervalMinutes: 7,
            cooldownMinutes: 90,
            generalSearchUrl: "https://example.com/general",
            rooms: [
                {
                    id: "mul-yam",
                    name: "Mul Yam",
                    bookingUrl: "https://example.com/mul-yam",
                    priority: 2
                },
                {
                    id: "tenti",
                    name: "Tenti",
                    bookingUrl: "https://example.com/tenti",
                    priority: 1
                }
            ]
        });
        expect(config.rooms.map((room) => room.id)).toEqual(["tenti", "mul-yam"]);
        expect(config.alertMode).toBe("newly_available");
        expect(config.dateWindows).toEqual([
            { checkIn: "2026-04-08", checkOut: "2026-04-10", nights: 2 },
            { checkIn: "2026-04-09", checkOut: "2026-04-11", nights: 2 },
            { checkIn: "2026-04-10", checkOut: "2026-04-12", nights: 2 }
        ]);
    });
    it("rejects configs that are not objects", () => {
        expect(() => parseMonitorConfig(null)).toThrow("config must be an object");
    });
    it("rejects empty room lists", () => {
        expect(() => parseMonitorConfig({
            dateRangeStart: "2026-04-08",
            dateRangeEnd: "2026-04-12",
            nightCount: 2,
            guestCount: 2,
            pollIntervalMinutes: 7,
            cooldownMinutes: 90,
            rooms: []
        })).toThrow("config.rooms must be a non-empty array");
    });
    it("rejects duplicate room ids", () => {
        expect(() => parseMonitorConfig({
            dateRangeStart: "2026-04-08",
            dateRangeEnd: "2026-04-12",
            nightCount: 2,
            guestCount: 2,
            pollIntervalMinutes: 7,
            cooldownMinutes: 90,
            rooms: [
                {
                    id: "mul-yam",
                    name: "Mul Yam",
                    bookingUrl: "https://example.com/1",
                    priority: 1
                },
                {
                    id: "mul-yam",
                    name: "Mul Yam 2",
                    bookingUrl: "https://example.com/2",
                    priority: 2
                }
            ]
        })).toThrow("config.rooms contains duplicate room id: mul-yam");
    });
    it("rejects date ranges that produce no valid windows", () => {
        expect(() => parseMonitorConfig({
            dateRangeStart: "2026-04-08",
            dateRangeEnd: "2026-04-09",
            nightCount: 2,
            guestCount: 2,
            pollIntervalMinutes: 7,
            cooldownMinutes: 90,
            rooms: [
                {
                    id: "mul-yam",
                    name: "Mul Yam",
                    bookingUrl: "https://example.com/1",
                    priority: 1
                }
            ]
        })).toThrow("config date range does not produce any valid stay windows");
    });
    it("rejects invalid integer fields", () => {
        expect(() => parseMonitorConfig({
            dateRangeStart: "2026-04-08",
            dateRangeEnd: "2026-04-12",
            nightCount: 2,
            guestCount: 2,
            pollIntervalMinutes: 0,
            cooldownMinutes: 90,
            rooms: [
                {
                    id: "mul-yam",
                    name: "Mul Yam",
                    bookingUrl: "https://example.com/1",
                    priority: 1
                }
            ]
        })).toThrow("config.pollIntervalMinutes must be a positive integer");
    });
    it("parses the all-currently-available alert mode", () => {
        const config = parseMonitorConfig({
            dateRangeStart: "2026-04-08",
            dateRangeEnd: "2026-04-12",
            nightCount: 2,
            guestCount: 2,
            pollIntervalMinutes: 7,
            cooldownMinutes: 90,
            alertMode: "all_currently_available",
            rooms: [
                {
                    id: "mul-yam",
                    name: "Mul Yam",
                    bookingUrl: "https://example.com/1",
                    priority: 1
                }
            ]
        });
        expect(config.alertMode).toBe("all_currently_available");
    });
});
