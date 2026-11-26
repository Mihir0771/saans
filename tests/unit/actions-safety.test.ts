import { describe, expect, it } from "vitest";
import { computeCpcbAqi } from "@/engine/aqi";
import { evaluateSafetyRules } from "@/engine/actions/rules";
import { rankHouseholdActions } from "@/engine/actions/rank";
import type { AirHour, HouseholdProfile } from "@/engine/schema";

const smogHours: AirHour[] = Array.from({ length: 24 }, (_, h) => ({
  isoTime: `2026-11-24T${String(h).padStart(2, "0")}:00`,
  hourLocal: h,
  pm25: h >= 13 && h <= 15 ? 70 : 190,
  pm10: 260,
  windMs: 1.0,
  blhM: 180,
  tempC: 10,
}));

const baseProfile: HouseholdProfile = {
  id: "sharma",
  cityName: "Dwarka, Delhi",
  lat: 28.59,
  lon: 77.05,
  locale: "en",
  members: [
    {
      id: "baby",
      name: "Vihaan",
      avatarEmoji: "👶",
      ageBand: "toddler_0_1",
      conditions: ["none"],
      outdoorWorker: false,
      persona: "school_child",
      commuteMode: "wfh",
      commuteDistanceKm: 0,
      commuteDepartHour: 8,
    },
    {
      id: "aarav",
      name: "Aarav",
      avatarEmoji: "👦",
      ageBand: "child_6_12",
      conditions: ["asthma"],
      outdoorWorker: false,
      persona: "school_child",
      commuteMode: "auto",
      commuteDistanceKm: 5,
      commuteDepartHour: 8,
    },
  ],
  home: {
    areaSqm: 70,
    ceilingHeightM: 3,
    leakiness: "leaky",
    cookingFuel: "lpg",
    hasExhaustHood: false,
    sealDoorGaps: false,
    indoorSources: {
      incenseDailyMin: 30,
      mosquitoCoilNight: false,
      smokingIndoors: false,
      unventedCombustion: true,
    },
    purifier: {
      enabled: false,
      cadrM3h: 0,
      filterAgeMonths: 0,
      hoursPerDay: 0,
      isCrBox: false,
      hasIonizerOrOzone: true,
    },
  },
};

describe("engine/actions safety rules (SPEC 6.5) & ranking", () => {
  it("enforces hard blocks for ozone, indoor combustion sealing, <2y masks, and high-AQI exercise", () => {
    const aqi = computeCpcbAqi({ pm25: 190, pm10: 260 });
    const safety = evaluateSafetyRules(baseProfile, aqi);
    expect(safety.flags).toContain("NO_OZONE_IONIZER");
    expect(safety.flags).toContain("NO_SEAL_WITH_COMBUSTION_CO_RISK");
    expect(safety.flags).toContain("NO_MASK_UNDER_2");
    expect(safety.flags).toContain("AVOID_VIGOROUS_OUTDOOR");
    expect(safety.blockedActionIds).toContain("seal_gaps");
  });

  it("ranks eligible safe actions into do-now, this-week, and budget-allows buckets", () => {
    const cleanCombustionProfile: HouseholdProfile = {
      ...baseProfile,
      home: {
        ...baseProfile.home,
        indoorSources: { ...baseProfile.home.indoorSources, unventedCombustion: false },
        purifier: { ...baseProfile.home.purifier, hasIonizerOrOzone: false },
      },
    };
    const ranked = rankHouseholdActions(
      cleanCombustionProfile,
      cleanCombustionProfile.members[1]!,
      smogHours,
    );
    expect(ranked.doNow.length).toBeGreaterThan(0);
    expect(ranked.doNow.length).toBeLessThanOrEqual(3);
    expect(ranked.all.some((a) => a.id === "cr_box")).toBe(true);
    expect(ranked.all.every((a) => a.id !== "ozone_ionizer")).toBe(true);
  });
});
