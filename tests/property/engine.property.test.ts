import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { aqiToBand, computeCpcbAqi } from "@/engine/aqi";
import { steadyStateIndoorPm } from "@/engine/indoor";
import { computeShapleyWaterfall } from "@/engine/waterfall";
import { SHARMA_DEMO_AIR, SHARMA_PROFILE } from "@/lib/sharma-fixture";

describe("property tests: engine invariants", () => {
  it("CPCB AQI band boundaries match 50/100/200/300/400", () => {
    expect(aqiToBand(50)).toBe("good");
    expect(aqiToBand(51)).toBe("sat");
    expect(aqiToBand(100)).toBe("sat");
    expect(aqiToBand(101)).toBe("mod");
    expect(aqiToBand(200)).toBe("mod");
    expect(aqiToBand(201)).toBe("poor");
    expect(aqiToBand(300)).toBe("poor");
    expect(aqiToBand(301)).toBe("vpoor");
    expect(aqiToBand(400)).toBe("vpoor");
    expect(aqiToBand(401)).toBe("severe");
  });

  it("overall AQI >= every individual pollutant sub-index", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 400, noNaN: true }),
        fc.double({ min: 0, max: 500, noNaN: true }),
        fc.double({ min: 0, max: 400, noNaN: true }),
        (pm25, pm10, no2) => {
          const res = computeCpcbAqi({ pm25, pm10, no2 });
          expect(res.aqi).toBeGreaterThanOrEqual(res.subIndices["PM2.5"] ?? 0);
          expect(res.aqi).toBeGreaterThanOrEqual(res.subIndices.PM10 ?? 0);
          expect(res.aqi).toBeGreaterThanOrEqual(res.subIndices.NO2 ?? 0);
        },
      ),
    );
  });

  it("steady-state indoor PM is non-negative and monotone with outdoor PM", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 500, noNaN: true }),
        fc.double({ min: 0, max: 200, noNaN: true }),
        (cOut, delta) => {
          const base = {
            penetration: 0.8,
            lambdaAch: 0.75,
            depositionK: 0.39,
            sourceUgH: 0,
            cadrEffM3h: 100,
            volumeM3: 60,
          };
          const y1 = steadyStateIndoorPm({ ...base, cOut });
          const y2 = steadyStateIndoorPm({ ...base, cOut: cOut + delta });
          expect(y1).toBeGreaterThanOrEqual(0);
          expect(y2).toBeGreaterThanOrEqual(y1);
        },
      ),
    );
  });

  it("Shapley waterfall steps always sum to baseline - plan for every Sharma member", () => {
    const memberIds = SHARMA_PROFILE.members.map((m) => m.id);
    for (const id of memberIds) {
      const member = SHARMA_PROFILE.members.find((m) => m.id === id)!; // test fixture lookup
      const wf = computeShapleyWaterfall({
        member,
        home: SHARMA_PROFILE.home,
        hours: SHARMA_DEMO_AIR.hours,
        activeActionIds: ["cr_box", "commute_metro", "seal_gaps", "close_peak_windows"],
      });
      const sum = wf.steps.reduce((acc, s) => acc + s.deltaRatio, 0);
      expect(sum).toBeCloseTo(wf.baselineRatio - wf.planRatio, 4);
    }
  });
});
