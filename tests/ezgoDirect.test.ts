import { describe, expect, it, vi } from "vitest";

import {
  EzgoDirectChecker,
  buildSeededUrl,
  classifyAvailability,
  extractEmbeddedEngineUrl,
  parseCalendarMonth,
  parseSelectedDayTitle
} from "../src/adapters/ezgoDirect.js";

describe("ezgo direct helpers", () => {
  it("extracts the embedded engine iframe url from a marketing page", () => {
    expect(
      extractEmbeddedEngineUrl(`
        <html>
          <body>
            <iframe src="https://engine.ezgo.co.il/Main/Engine?iItemId=11403&amp;SI=11385"></iframe>
          </body>
        </html>
      `)
    ).toBe("https://engine.ezgo.co.il/Main/Engine?iItemId=11403&SI=11385");
  });

  it("adds sDate and eDate query params to the engine url", () => {
    expect(
      buildSeededUrl(
        "https://engine.ezgo.co.il/main/Engine?iItemId=11403&SI=11385",
        "2026-04-11",
        "2026-04-13"
      )
    ).toContain("sDate=2026-04-11");
  });

  it("parses hebrew calendar month labels", () => {
    expect(
      parseCalendarMonth(
        `
          <span id="lblCalStartMonth_Top" class="CalMonthText">אפריל</span>
          <span id="lblCalStartYear_Top" class="CalYearText">2026</span>
        `,
        "start"
      )
    ).toEqual({ month: 4, year: 2026 });
  });

  it("parses a selected start-day title from the start calendar table", () => {
    expect(
      parseSelectedDayTitle(
        `
          <table id="CalStart_Top">
            <tr>
              <td title="מלא"><div class="strip full"><span class="date curr-date">11</span></div></td>
              <td title="מלא"><div class="strip full"><span class="date curr-date">12</span></div></td>
            </tr>
          </table>
        `,
        "start",
        "2026-04-11"
      )
    ).toBe("מלא");
  });

  it("parses a selected checkout-day title from the checkout calendar table", () => {
    expect(
      parseSelectedDayTitle(
        `
          <table id="CalChekOut_Top">
            <tr>
              <td title="ת. התחלה"><div class="strip"><span class="date curr-date">11</span></div></td>
              <td title="פנוי"><div class="strip"><span class="date curr-date">12</span></div></td>
              <td title="פנוי"><div class="strip"><span class="date curr-date">13</span></div></td>
            </tr>
          </table>
        `,
        "end",
        "2026-04-13"
      )
    ).toBe("פנוי");
  });

  it("ignores not-current-month cells when matching day titles", () => {
    expect(
      parseSelectedDayTitle(
        `
          <table id="CalChekOut_Top">
            <tr>
              <td title="עבר"><div class="strip not-curr-month"><span class="date">13</span></div></td>
              <td title="פנוי"><div class="strip"><span class="date curr-date">13</span></div></td>
            </tr>
          </table>
        `,
        "end",
        "2026-04-13"
      )
    ).toBe("פנוי");
  });

  it("classifies blocked starts as unavailable even when checkout looks free", () => {
    expect(classifyAvailability("מלא", "פנוי")).toBe("unavailable");
  });

  it("classifies minimum-night blocks distinctly", () => {
    expect(classifyAvailability("מינימום לילות", "פנוי")).toBe(
      "minimum_stay_blocked"
    );
  });

  it("classifies free start and checkout titles as available", () => {
    expect(classifyAvailability("פנוי", "פנוי")).toBe("available");
  });

  it("returns unknown when the signal is incomplete", () => {
    expect(classifyAvailability(undefined, "ת. התחלה")).toBe("unknown");
  });
});

describe("EzgoDirectChecker", () => {
  it("retries transient fetch failures and eventually returns an observation", async () => {
    const marketingHtml = `
      <html>
        <body>
          <iframe src="https://engine.ezgo.co.il/Main/Engine?iItemId=11403&amp;SI=11385"></iframe>
        </body>
      </html>
    `;
    const engineHtml = `
      <input id="__VIEWSTATE" value="state" />
      <input id="__VIEWSTATEGENERATOR" value="gen" />
      <span id="lblCalStartMonth_Top">אפריל</span>
      <span id="lblCalStartYear_Top">2026</span>
      <span id="lblCalCheckOutMonth_Top">אפריל</span>
      <span id="lblCalCheckOutYear_Top">2026</span>
      <table id="CalStart_Top">
        <tr><td title="פנוי"><span class="date curr-date">11</span></td></tr>
      </table>
      <table id="CalChekOut_Top">
        <tr><td title="פנוי"><span class="date curr-date">12</span></td></tr>
      </table>
    `;

    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce(new Response(marketingHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(engineHtml, { status: 200 }));

    const checker = new EzgoDirectChecker(fetchImpl, {
      maxRetries: 1,
      retryDelayMs: 0
    });

    const observation = await checker.checkAvailability({
      room: {
        id: "mul-yam",
        name: "Mul Yam",
        bookingUrl: "https://example.com/mul-yam",
        priority: 1
      },
      dateWindow: {
        checkIn: "2026-04-11",
        checkOut: "2026-04-12",
        nights: 1
      },
      guestCount: 2,
      checkedAt: "2026-03-31T12:00:00.000Z",
      source: "room_page"
    });

    expect(observation.status).toBe("available");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("caches resolved engine urls for repeated checks on the same room", async () => {
    const marketingHtml = `
      <html>
        <body>
          <iframe src="https://engine.ezgo.co.il/Main/Engine?iItemId=11403&amp;SI=11385"></iframe>
        </body>
      </html>
    `;
    const engineHtml = `
      <input id="__VIEWSTATE" value="state" />
      <input id="__VIEWSTATEGENERATOR" value="gen" />
      <span id="lblCalStartMonth_Top">אפריל</span>
      <span id="lblCalStartYear_Top">2026</span>
      <span id="lblCalCheckOutMonth_Top">אפריל</span>
      <span id="lblCalCheckOutYear_Top">2026</span>
      <table id="CalStart_Top">
        <tr><td title="פנוי"><span class="date curr-date">11</span></td></tr>
      </table>
      <table id="CalChekOut_Top">
        <tr><td title="פנוי"><span class="date curr-date">12</span></td></tr>
      </table>
    `;

    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(marketingHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(engineHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(engineHtml, { status: 200 }));

    const checker = new EzgoDirectChecker(fetchImpl, {
      maxRetries: 0
    });

    const room = {
      id: "mul-yam",
      name: "Mul Yam",
      bookingUrl: "https://example.com/mul-yam",
      priority: 1
    };

    await checker.checkAvailability({
      room,
      dateWindow: {
        checkIn: "2026-04-11",
        checkOut: "2026-04-12",
        nights: 1
      },
      guestCount: 2,
      checkedAt: "2026-03-31T12:00:00.000Z",
      source: "room_page"
    });

    await checker.checkAvailability({
      room,
      dateWindow: {
        checkIn: "2026-04-12",
        checkOut: "2026-04-13",
        nights: 1
      },
      guestCount: 2,
      checkedAt: "2026-03-31T12:05:00.000Z",
      source: "room_page"
    });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://example.com/mul-yam");
  });
});
