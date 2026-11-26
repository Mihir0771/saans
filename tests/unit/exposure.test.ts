import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  buildDefaultSchedule,
  computeMemberExposure,
  roughCigaretteEquivalent,
} from "@/engine/exposure";
import { computeShapleyWaterfall } from "@/engine/waterfall";
import type { AirHour, FamilyMember, HomeProfile } from "@/engine/schema";

const sampleHours: AirHour[] = Array.from({ length: 24 }, (_, h) => ({
  isoTime: `2026-11-24T${String(h).padStart(2, "0")}:00`,
  hourLocal: h,
  pm25: h >= 6 && h <= 9 ? 180 : h >= 13 && h <= 15 ? 75 : 140,
  pm10: 230,
  windMs: 1.2,
  blhM: 180,
  tempC: 11,
}));

const home: HomeProfile = {
  areaSqm: 70,
  ceilingHeightM: 3,
  leakiness: "leaky",
  cookingFuel: "lpg",
  hasExhaustHood: false,
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

const aarav: FamilyMember = {
  id: "aarav",
  name: "Aarav",
  avatarEmoji: "👦",
  ageBand: "child_6_12",
  conditions: ["none"],
  outdoorWorker: false,
  persona: "school_child",
  commuteMode: "auto",
  commuteDistanceKm: 5,
  commuteDepartHour: 8,
};

describe("engine/exposure & Breath Budget", () => {
  it("computes per-person dose vs WHO 24-h guideline budget", () => {
    const sched = buildDefaultSchedule(aarav);
    const base = computeMemberExposure({
      member: aarav,
      home,
      hours: sampleHours,
      schedule: sched,
      activeActionIds: [],
    });
    expect(base.budgetUg).toBeGreaterThan(100);
    expect(base.doseUg).toBeGreaterThan(base.budgetUg);
    expect(base.ratio).toBeCloseTo(base.doseUg / base.budgetUg, 3);
    expect(base.hourlyCumulative).toHaveLength(25);
    expect(base.hourlyCumulative[0]).toBe(0);
    expect(base.hourlyCumulative[24]).toBeCloseTo(base.ratio, 3);
  });

  it("computes exact Shapley waterfall attribution summing precisely to total delta", () => {
    const actions = [
      "cr_box",
      "commute_metro",
      "seal_gaps",
      "close_peak_windows",
      "cook_hood_shift",
    ];
    const wf = computeShapleyWaterfall({
      member: aarav,
      home,
      hours: sampleHours,
      activeActionIds: actions,
    });
    const sumDeltas = wf.steps.reduce((s, step) => s + step.deltaRatio, 0);
    expect(wf.planRatio).toBeLessThan(wf.baselineRatio);
    expect(sumDeltas).toBeCloseTo(wf.baselineRatio - wf.planRatio, 5);
    expect(wf.totalSavedPct).toBeGreaterThan(0);
  });

  it("never produces negative dose or plan > baseline for protective actions", () => {
    fc.assert(
      fc.property(
        fc.subarray(["cr_box", "seal_gaps", "close_peak_windows", "n95_commute"]),
        (picked) => {
          const wf = computeShapleyWaterfall({
            member: aarav,
            home,
            hours: sampleHours,
            activeActionIds: picked,
          });
          expect(wf.planRatio).toBeGreaterThanOrEqual(0);
          expect(wf.planRatio).toBeLessThanOrEqual(wf.baselineRatio + 1e-6);
        },
      ),
    );
  });

  it("computes optional cigarette-equivalent strictly as a non-zero non-negative rough metaphor", () => {
    expect(roughCigaretteEquivalent(0)).toBe(0);
    expect(roughCigaretteEquivalent(220)).toBeGreaterThan(0);
  });
});
