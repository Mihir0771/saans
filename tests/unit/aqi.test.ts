import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  computeAqi24h,
  computeAqiNowEquivalent,
  computeCpcbAqi,
  subIndexForPollutant,
} from "@/engine/aqi";
import type { AirHour } from "@/engine/schema";

describe("engine/aqi (CPCB National AQI)", () => {
  it("computes PM2.5 sub-index accurately at every CPCB breakpoint boundary", () => {
    const cases: Array<[number, number]> = [
      [0, 0],
      [30, 50],
      [31, 51],
      [60, 100],
      [61, 101],
      [90, 200],
      [91, 201],
      [120, 300],
      [121, 301],
      [250, 400],
      [251, 401],
      [350, 477],
      [500, 500],
    ];
    for (const [pm25, expected] of cases) {
      expect(subIndexForPollutant("PM2.5", pm25)).toBe(expected);
    }
  });

  it("computes PM10 sub-index accurately at key boundaries", () => {
    expect(subIndexForPollutant("PM10", 0)).toBe(0);
    expect(subIndexForPollutant("PM10", 50)).toBe(50);
    expect(subIndexForPollutant("PM10", 100)).toBe(100);
    expect(subIndexForPollutant("PM10", 250)).toBe(200);
    expect(subIndexForPollutant("PM10", 350)).toBe(300);
    expect(subIndexForPollutant("PM10", 430)).toBe(400);
    expect(subIndexForPollutant("PM10", 500)).toBe(487);
  });

  it("maps overall AQI category bands, shapes, and dominant pollutant", () => {
    expect(computeCpcbAqi({ pm25: 25, pm10: 40 })).toMatchObject({
      aqi: 42,
      band: "good",
      shape: "circle",
      dominantPollutant: "PM2.5",
    });
    expect(computeCpcbAqi({ pm25: 45, pm10: 50 })).toMatchObject({
      band: "sat",
      shape: "diamond",
    });
    expect(computeCpcbAqi({ pm25: 75, pm10: 100 })).toMatchObject({
      band: "mod",
      shape: "triangle",
    });
    expect(computeCpcbAqi({ pm25: 105, pm10: 150 })).toMatchObject({
      band: "poor",
      shape: "square",
    });
    expect(computeCpcbAqi({ pm25: 174, pm10: 260 })).toMatchObject({
      aqi: 342,
      band: "vpoor",
      shape: "pentagon",
      dominantPollutant: "PM2.5",
    });
    expect(computeCpcbAqi({ pm25: 280, pm10: 460 })).toMatchObject({
      band: "severe",
      shape: "octagon",
      dominantPollutant: "PM10",
    });
  });

  it("converts CO ug/m3 to mg/m3 properly before CPCB lookup", () => {
    // 2000 ug/m3 = 2.0 mg/m3 -> CPCB Satisfactory ceiling = 100
    expect(subIndexForPollutant("CO", 2.0)).toBe(100);
    const res = computeCpcbAqi({ pm25: 10, pm10: 20, co_ugm3: 2000 });
    expect(res.subIndices.CO).toBe(100);
    expect(res.dominantPollutant).toBe("CO");
  });

  it("distinguishes 24h rolling official AQI from instant AQI-equivalent", () => {
    const hours: AirHour[] = Array.from({ length: 24 }, (_, h) => ({
      isoTime: `2026-11-24T${String(h).padStart(2, "0")}:00`,
      hourLocal: h,
      pm25: 174,
      pm10: 240,
      no2: 60,
    }));
    const official = computeAqi24h(hours);
    expect(official.is24hOfficial).toBe(true);
    expect(official.aqi).toBe(342);

    const instant = computeAqiNowEquivalent(hours[0]!); // test fixture non-null
    expect(instant.is24hOfficial).toBe(false);
    expect(instant.aqi).toBe(342);
  });

  it("satisfies monotonicity: higher PM2.5 never decreases PM2.5 sub-index", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 600, noNaN: true }),
        fc.double({ min: 0, max: 200, noNaN: true }),
        (a, delta) => {
          expect(subIndexForPollutant("PM2.5", a + delta)).toBeGreaterThanOrEqual(
            subIndexForPollutant("PM2.5", a),
          );
        },
      ),
    );
  });
});
