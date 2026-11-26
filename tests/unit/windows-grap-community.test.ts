import { describe, expect, it } from "vitest";
import { computeGrapStatus } from "@/engine/grap";
import { computeCommunityKit } from "@/engine/community";
import {
  computeTrappedAirRisk,
  findBestWorstWindows,
  findSmartVentilationWindow,
} from "@/engine/windows";
import { buildFactSheet } from "@/engine/factsheet";
import type { AirHour, HomeProfile } from "@/engine/schema";

const hours: AirHour[] = Array.from({ length: 24 }, (_, h) => ({
  isoTime: `2026-11-24T${String(h).padStart(2, "0")}:00`,
  hourLocal: h,
  pm25: h >= 13 && h <= 15 ? 50 : 185,
  pm10: 250,
  windMs: h >= 13 && h <= 15 ? 3.5 : 0.8,
  blhM: h >= 13 && h <= 15 ? 900 : 150,
  tempC: h >= 13 && h <= 15 ? 23 : 10,
}));

const home: HomeProfile = {
  areaSqm: 25,
  ceilingHeightM: 3,
  leakiness: "average",
  cookingFuel: "lpg",
  hasExhaustHood: true,
  sealDoorGaps: true,
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

describe("engine/windows, grap, community & factsheet", () => {
  it("identifies best/worst 2h windows and trapped-air risk", () => {
    const win = findBestWorstWindows(hours);
    expect(win.bestStartHour).toBe(13);
    expect(win.worstStartHour).not.toBe(13);
    expect(computeTrappedAirRisk(hours[7]!)).toBe("high");
    expect(computeTrappedAirRisk(hours[14]!)).toBe("low");
  });

  it("finds smart ventilation window when afternoon outdoor PM dips below indoor, or says none today", () => {
    const smokyKitchenHome: HomeProfile = {
      ...home,
      cookingFuel: "mixed",
      hasExhaustHood: false,
      indoorSources: { ...home.indoorSources, incenseDailyMin: 30 },
    };
    const vent = findSmartVentilationWindow(smokyKitchenHome, hours);
    expect(vent.hasWindow).toBe(true);
    expect(vent.startHour).toBeGreaterThanOrEqual(13);

    const flatCleanPurifierHome: HomeProfile = {
      ...home,
      purifier: {
        enabled: true,
        cadrM3h: 400,
        filterAgeMonths: 0,
        hoursPerDay: 24,
        isCrBox: true,
        hasIonizerOrOzone: false,
      },
    };
    const flatSevere = hours.map((h) => ({ ...h, pm25: 250 }));
    const none = findSmartVentilationWindow(flatCleanPurifierHome, flatSevere);
    expect(none.hasWindow).toBe(false);
  });

  it("shows indicative GRAP only inside Delhi-NCR", () => {
    expect(computeGrapStatus(28.59, 77.05, 342)?.stage).toBe("II");
    expect(computeGrapStatus(28.59, 77.05, 420)?.stage).toBe("III");
    expect(computeGrapStatus(19.08, 72.88, 342)).toBeNull();
  });

  it("computes community go/no-go table and collective delta dose range", () => {
    const kit = computeCommunityKit(
      { orgType: "school", orgName: "Dwarka Public", headcount: 200, hours },
      "en",
    );
    expect(kit.hourlyDecisions).toHaveLength(24);
    expect(kit.collectiveDeltaKgLow).toBeGreaterThan(0);
    expect(kit.collectiveDeltaKgHigh).toBeGreaterThanOrEqual(kit.collectiveDeltaKgLow);
    expect(kit.whatsappText.length).toBeGreaterThan(40);
    expect(kit.actions.some((a) => a.evidenceTier === "low_short_term")).toBe(true);
  });

  it("builds flat typed FactSheet with zero NaN displays", () => {
    const fs = buildFactSheet({
      cityName: "Dwarka, Delhi",
      locale: "en",
      isDemo: true,
      isSimulation: false,
      calibrationScale: 1,
      hours,
      memberName: "Aarav",
      baselineRatio: 14.2,
      planRatio: 5.1,
      doseSavedPct: 64,
      bestWindowStartHour: 13,
      worstWindowStartHour: 8,
      oneTimeCostInr: 1800,
      topActionSavingRatio: 4.6,
      safetyFlags: [],
      trappedAirRisk: "high",
    });
    expect(fs.facts.dose_plan?.display).toBe("5.1×");
    expect(fs.facts.dose_saved_pct?.display).toBe("64%");
  });
});
