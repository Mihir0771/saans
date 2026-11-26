import { describe, expect, it } from "vitest";
import { computeAqi24h, computeCpcbAqi, subIndexForPollutant } from "@/engine/aqi";
import { compareCommutes, findBestDepartureShift } from "@/engine/commute";
import { computeCommunityKit } from "@/engine/community";
import {
  buildDefaultSchedule,
  computeMemberExposure,
  roughCigaretteEquivalent,
} from "@/engine/exposure";
import { buildFactSheet } from "@/engine/factsheet";
import { computeGrapStatus, isDelhiNcr } from "@/engine/grap";
import { simulateIndoor24h, steadyStateIndoorPm } from "@/engine/indoor";
import { rankHouseholdActions } from "@/engine/actions/rank";
import { computeFullPlan, computeMemberPlan } from "@/engine/plan";
import { findBestWorstWindows, findSmartVentilationWindow } from "@/engine/windows";
import { SHARMA_DEMO_AIR, SHARMA_PROFILE } from "@/lib/sharma-fixture";

describe("engine edge cases and branch coverage", () => {
  const pm25Series: Array<[number, number]> = [
    [15, 25],
    [30, 50],
    [45, 75],
    [60, 100],
    [75, 149],
    [90, 200],
    [105, 249],
    [120, 300],
    [185, 350],
    [250, 400],
    [315, 450],
    [400, 500],
  ];
  it.each(pm25Series)("computes PM2.5 CPCB sub-index at %s -> %s", (pm, expected) => {
    expect(subIndexForPollutant("PM2.5", pm)).toBe(expected);
  });

  const cities: Array<[number, number, boolean]> = [
    [28.59, 77.05, true],
    [28.45, 77.02, true],
    [28.66, 77.45, true],
    [19.08, 72.88, false],
    [12.97, 77.59, false],
    [22.57, 88.36, false],
  ];
  it.each(cities)("detects Delhi-NCR boundary (%s, %s) -> %s", (lat, lon, expected) => {
    expect(isDelhiNcr(lat, lon)).toBe(expected);
  });

  it("handles incomplete pollutant lists for 24h AQI", () => {
    const partial = SHARMA_DEMO_AIR.hours.slice(0, 10).map((h) => ({
      isoTime: h.isoTime,
      hourLocal: h.hourLocal,
      pm25: h.pm25,
      pm10: h.pm10,
    }));
    const res = computeAqi24h(partial);
    expect(res.is24hOfficial).toBe(false);
    expect(res.aqi).toBeGreaterThan(200);
  });

  it("handles empty/NaN inputs safely in AQI, indoor, and cigarette-equivalent", () => {
    expect(computeCpcbAqi({}).aqi).toBe(0);
    expect(subIndexForPollutant("PM2.5", Number.NaN)).toBe(0);
    expect(roughCigaretteEquivalent(-5)).toBe(0);
    expect(roughCigaretteEquivalent(Number.NaN)).toBe(0);
    expect(
      steadyStateIndoorPm({
        cOut: 100,
        penetration: 0.8,
        lambdaAch: 0,
        depositionK: 0,
        sourceUgH: 0,
        cadrEffM3h: 0,
        volumeM3: 50,
      }),
    ).toBe(0);
  });

  it("computes WFH commute, departure shift, and member plan overrides", () => {
    const comp = compareCommutes({
      ageBand: "elder_65_plus",
      distanceKm: 0,
      departHour: 23,
      hours: SHARMA_DEMO_AIR.hours,
    });
    const wfh = comp.find((c) => c.mode === "wfh");
    expect(wfh?.durationMin).toBe(0);
    expect(wfh?.co2g).toBe(0);

    const shift = findBestDepartureShift({
      ageBand: "adult_18_64",
      mode: "two_wheeler",
      distanceKm: 8,
      usualDepartHour: 1,
      hours: SHARMA_DEMO_AIR.hours,
    });
    expect(shift.bestDoseUg).toBeLessThanOrEqual(shift.usualDoseUg);

    const mPlan = computeMemberPlan(SHARMA_PROFILE, "nonexistent", SHARMA_DEMO_AIR, []);
    expect(mPlan.memberId).toBe("aarav");
    expect(mPlan.plan.ratio).toBeCloseTo(mPlan.baseline.ratio, 4);
  });

  it("simulates indoor trajectory with custom purifierHours schedule and full plan for all Sharma members", () => {
    const sim = simulateIndoor24h({
      home: {
        ...SHARMA_PROFILE.home,
        purifier: { ...SHARMA_PROFILE.home.purifier, enabled: true, cadrM3h: 300, isCrBox: false },
      },
      outdoorPm25: SHARMA_DEMO_AIR.hours.map((h) => h.pm25),
      windowStates: Array.from({ length: 24 }, () => "closed"),
      cookingHours: [8, 20],
      purifierHours: Array.from({ length: 24 }, (_, h) => h >= 21 || h < 7),
    });
    expect(sim.central).toHaveLength(24);

    const full = computeFullPlan(SHARMA_PROFILE, SHARMA_DEMO_AIR, "dadi");
    expect(full.grap?.stage).toBe("II");
    expect(Object.keys(full.memberPlans)).toEqual(["aarav", "dadi", "mum", "papa"]);
    expect(full.factSheet.facts.member_name?.display).toBe("Dadi");
  });

  it("formats Hindi FactSheet window hours and cleans empty community go-hours", () => {
    const fsHi = buildFactSheet({
      cityName: "Delhi",
      locale: "hi",
      isDemo: false,
      isSimulation: true,
      calibrationScale: 1.5,
      hours: SHARMA_DEMO_AIR.hours,
      memberName: "आरव",
      baselineRatio: 10,
      planRatio: 4,
      doseSavedPct: 60,
      bestWindowStartHour: 0,
      worstWindowStartHour: 12,
      oneTimeCostInr: 1800,
      topActionSavingRatio: 3.1,
      safetyFlags: [],
      trappedAirRisk: "moderate",
    });
    expect(fsHi.facts.best_window_start?.display).toBe("0 बजे");

    const severeAllDay = SHARMA_DEMO_AIR.hours.map((h) => ({ ...h, pm25: 280 }));
    const kit = computeCommunityKit(
      { orgType: "office", orgName: "TechPark", headcount: 500, hours: severeAllDay },
      "hi",
    );
    expect(kit.goHoursCount).toBe(0);
    expect(kit.whatsappText).toContain("कोई सुरक्षित खिड़की नहीं");

    const schedule = buildDefaultSchedule(SHARMA_PROFILE.members[3]!);
    const exp = computeMemberExposure({
      member: SHARMA_PROFILE.members[3]!,
      home: SHARMA_PROFILE.home,
      hours: SHARMA_DEMO_AIR.hours,
      schedule,
      activeActionIds: ["hepa_purifier", "shift_outdoor_timing"],
    });
    expect(exp.doseUg).toBeGreaterThan(0);
    expect(computeGrapStatus(28.6, 77.2, 150)).toBeNull();
  });

  it("covers fallback hour formatting, zero-budget ventilation, and action filtering branches", () => {
    const noonFs = buildFactSheet({
      cityName: "Delhi",
      locale: "en",
      isDemo: false,
      isSimulation: false,
      calibrationScale: 1,
      hours: [],
      memberName: "Aarav",
      baselineRatio: 5,
      planRatio: 3,
      doseSavedPct: 40,
      bestWindowStartHour: 0,
      worstWindowStartHour: 12,
      oneTimeCostInr: 0,
      topActionSavingRatio: 1.5,
      safetyFlags: [],
      trappedAirRisk: "low",
    });
    expect(noonFs.facts.best_window_start?.display).toBe("12 am");
    expect(noonFs.facts.worst_window_start?.display).toBe("12 pm");

    const highHours = SHARMA_DEMO_AIR.hours.map((h) => ({ ...h, pm25: 500 }));
    expect(findSmartVentilationWindow(SHARMA_PROFILE.home, highHours).hasWindow).toBe(false);
    const zeroHours = SHARMA_DEMO_AIR.hours.map((h) => ({ ...h, pm25: 0 }));
    expect(findSmartVentilationWindow(SHARMA_PROFILE.home, zeroHours).hasWindow).toBe(true);
    expect(findBestWorstWindows([]).bestMeanPm25).toBe(0);

    const toddler = {
      ...SHARMA_PROFILE.members[0]!,
      ageBand: "toddler_0_1" as const,
      commuteMode: "wfh" as const,
    };
    const cleanHome = {
      ...SHARMA_PROFILE.home,
      indoorSources: {
        ...SHARMA_PROFILE.home.indoorSources,
        incenseDailyMin: 0,
        mosquitoCoilNight: false,
      },
    };
    const toddlerRanked = rankHouseholdActions(
      { ...SHARMA_PROFILE, home: cleanHome, members: [toddler] },
      toddler,
      SHARMA_DEMO_AIR.hours,
    );
    expect(toddlerRanked.all.some((a) => a.id === "n95_commute")).toBe(false);
    expect(toddlerRanked.all.some((a) => a.id === "commute_metro")).toBe(false);
  });
});
