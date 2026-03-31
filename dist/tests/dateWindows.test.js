import { describe, expect, it } from "vitest";
import { generateDateWindows } from "../src/core/dateWindows.js";
describe("generateDateWindows", () => {
    it("generates every valid window for a flexible 2-night range", () => {
        expect(generateDateWindows("2026-04-08", "2026-04-18", 2)).toEqual([
            { checkIn: "2026-04-08", checkOut: "2026-04-10", nights: 2 },
            { checkIn: "2026-04-09", checkOut: "2026-04-11", nights: 2 },
            { checkIn: "2026-04-10", checkOut: "2026-04-12", nights: 2 },
            { checkIn: "2026-04-11", checkOut: "2026-04-13", nights: 2 },
            { checkIn: "2026-04-12", checkOut: "2026-04-14", nights: 2 },
            { checkIn: "2026-04-13", checkOut: "2026-04-15", nights: 2 },
            { checkIn: "2026-04-14", checkOut: "2026-04-16", nights: 2 },
            { checkIn: "2026-04-15", checkOut: "2026-04-17", nights: 2 },
            { checkIn: "2026-04-16", checkOut: "2026-04-18", nights: 2 }
        ]);
    });
    it("returns a single window when the range fits exactly once", () => {
        expect(generateDateWindows("2026-04-11", "2026-04-13", 2)).toEqual([
            { checkIn: "2026-04-11", checkOut: "2026-04-13", nights: 2 }
        ]);
    });
    it("returns no windows when the range is too short", () => {
        expect(generateDateWindows("2026-04-11", "2026-04-12", 2)).toEqual([]);
    });
    it("rejects invalid date formats", () => {
        expect(() => generateDateWindows("2026/04/11", "2026-04-13", 2)).toThrow("rangeStart must be in YYYY-MM-DD format");
    });
    it("rejects impossible calendar dates", () => {
        expect(() => generateDateWindows("2026-04-31", "2026-05-03", 2)).toThrow("Invalid calendar date: 2026-04-31");
    });
    it("rejects non-positive night counts", () => {
        expect(() => generateDateWindows("2026-04-11", "2026-04-13", 0)).toThrow("nights must be a positive integer");
    });
    it("rejects inverted ranges", () => {
        expect(() => generateDateWindows("2026-04-14", "2026-04-13", 2)).toThrow("rangeStart must be on or before rangeEnd");
    });
});
