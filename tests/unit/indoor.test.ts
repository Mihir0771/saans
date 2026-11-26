import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { simulateIndoor24h, steadyStateIndoorPm } from "@/engine/indoor";
import type { HomeProfile } from "@/engine/schema";

const baseHome: HomeProfile = {
  areaSqm: 20,
  ceilingHeightM: 3,
  leakiness: "average",
  cookingFuel: "lpg",
  hasExhaustHood: true,
  sealDoorGaps: false,
  indoorSources: {
    incenseDailyMin: 0,
    mosquitoCoilNight: false,
    smokingIndoors: false,
    unventedCombustion: false,
  },
  purifier: {
    enabled: false,
    cadrM3h: 0,
    filterAgeMonths: 0,
    hoursPerDay: 0,
    isCrBox: false,
    hasIonizerOrOzone: false,
  },
};

const flatOutdoor = Array.from({ length: 24 }, () => 200);

describe("engine/indoor (mass balance)", () => {
  it("matches closed-form steady state when outdoor PM is constant", () => {
    const ss = steadyStateIndoorPm({
      cOut: 200,
      penetration: 0.8,
      lambdaAch: 0.75,
      depositionK: 0.39,
      sourceUgH: 0,
      cadrEffM3h: 0,
      volumeM3: 60,
    });
    // C_ss = (0.8 * 0.75 * 200) / (0.75 + 0.39) = 120 / 1.14 = 105.263
    expect(ss).toBeCloseTo(105.263, 2);

    const sim = simulateIndoor24h({
      home: baseHome,
      outdoorPm25: flatOutdoor,
      windowStates: Array.from({ length: 24 }, () => "closed" as const),
      cookingHours: [],
    });
    expect(sim.central[23]).toBeCloseTo(ss, 1);
    expect(sim.low[23]).toBeLessThanOrEqual(sim.central[23]!); // 24h index exists
    expect(sim.high[23]).toBeGreaterThanOrEqual(sim.central[23]!);
  });

  it("keeps indoor PM <= P * C_out when no indoor source or purifier exists", () => {
    const sim = simulateIndoor24h({
      home: baseHome,
      outdoorPm25: flatOutdoor,
      windowStates: Array.from({ length: 24 }, () => "closed" as const),
      cookingHours: [],
    });
    for (const c of sim.central) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(0.8 * 200 + 0.1);
    }
  });

  it("satisfies CADR monotonicity: higher purifier CADR never increases indoor PM", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 400 }),
        fc.integer({ min: 0, max: 400 }),
        (cadrA, extraCadr) => {
          const homeA: HomeProfile = {
            ...baseHome,
            purifier: { ...baseHome.purifier, enabled: true, cadrM3h: cadrA, hoursPerDay: 24 },
          };
          const homeB: HomeProfile = {
            ...baseHome,
            purifier: {
              ...baseHome.purifier,
              enabled: true,
              cadrM3h: cadrA + extraCadr,
              hoursPerDay: 24,
            },
          };
          const resA = simulateIndoor24h({
            home: homeA,
            outdoorPm25: flatOutdoor,
            windowStates: Array.from({ length: 24 }, () => "closed" as const),
            cookingHours: [8, 19],
          });
          const resB = simulateIndoor24h({
            home: homeB,
            outdoorPm25: flatOutdoor,
            windowStates: Array.from({ length: 24 }, () => "closed" as const),
            cookingHours: [8, 19],
          });
          for (let h = 0; h < 24; h += 1) {
            expect(resB.central[h]!).toBeLessThanOrEqual(resA.central[h]! + 1e-6);
          }
        },
      ),
    );
  });

  it("satisfies leakiness monotonicity without purifier/sources: leakier home never has lower indoor PM", () => {
    const tightHome: HomeProfile = { ...baseHome, leakiness: "tight" };
    const leakyHome: HomeProfile = { ...baseHome, leakiness: "leaky" };
    const win = Array.from({ length: 24 }, () => "closed" as const);
    const tightRes = simulateIndoor24h({
      home: tightHome,
      outdoorPm25: flatOutdoor,
      windowStates: win,
      cookingHours: [],
    });
    const leakyRes = simulateIndoor24h({
      home: leakyHome,
      outdoorPm25: flatOutdoor,
      windowStates: win,
      cookingHours: [],
    });
    for (let h = 0; h < 24; h += 1) {
      expect(leakyRes.central[h]!).toBeGreaterThanOrEqual(tightRes.central[h]! - 1e-6);
    }
  });
});
