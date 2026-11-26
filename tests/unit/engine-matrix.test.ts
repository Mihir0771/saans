import { describe, expect, it } from "vitest";
import { subIndexForPollutant, computeCpcbAqi } from "@/engine/aqi";
import { simulateIndoor24h } from "@/engine/indoor";
import { computeFullPlan } from "@/engine/plan";
import { compareCommutes } from "@/engine/commute";
import { computeCommunityKit } from "@/engine/community";
import { computeGrapStatus } from "@/engine/grap";
import type {
  AgeBand,
  AirBundle,
  CommuteMode,
  CookingFuel,
  HouseholdProfile,
  PersonaPreset,
} from "@/engine/schema";

const hours = Array.from({ length: 24 }, (_, h) => ({
  isoTime: `2026-11-24T${String(h).padStart(2, "0")}:00`,
  hourLocal: h,
  pm25: h >= 13 && h <= 15 ? 65 : 175,
  pm10: 245,
  no2: 65,
  o3: 45,
  co_ugm3: 1500,
  windMs: h === 14 ? 3.2 : 1.0,
  blhM: h === 14 ? 800 : 180,
  tempC: h === 14 ? 22 : 10,
}));

const bundle: AirBundle = {
  source: "demo-sharma",
  fetchedAt: "2026-11-24T07:02:00Z",
  stale: false,
  gridResolutionKm: 25,
  calibrationScale: 1,
  cityName: "Dwarka, Delhi",
  lat2dp: 28.59,
  lon2dp: 77.05,
  hours,
};

const baseProfile: HouseholdProfile = {
  id: "sharma",
  cityName: "Dwarka, Delhi",
  lat: 28.59,
  lon: 77.05,
  locale: "en",
  members: [
    {
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
    },
    {
      id: "dadi",
      name: "Dadi",
      avatarEmoji: "👵",
      ageBand: "elder_65_plus",
      conditions: ["heart"],
      outdoorWorker: false,
      persona: "elder",
      commuteMode: "wfh",
      commuteDistanceKm: 0,
      commuteDepartHour: 9,
    },
    {
      id: "papa",
      name: "Papa",
      avatarEmoji: "👨",
      ageBand: "adult_18_64",
      conditions: ["none"],
      outdoorWorker: true,
      persona: "outdoor_worker",
      commuteMode: "two_wheeler",
      commuteDistanceKm: 12,
      commuteDepartHour: 8,
    },
  ],
  home: {
    areaSqm: 70,
    ceilingHeightM: 3,
    leakiness: "average",
    cookingFuel: "lpg",
    hasExhaustHood: false,
    sealDoorGaps: false,
    indoorSources: {
      incenseDailyMin: 20,
      mosquitoCoilNight: true,
      smokingIndoors: false,
      unventedCombustion: false,
    },
    purifier: {
      enabled: true,
      cadrM3h: 350,
      filterAgeMonths: 6,
      hoursPerDay: 12,
      isCrBox: true,
      hasIonizerOrOzone: false,
    },
  },
};

describe("engine exhaustive matrix coverage", () => {
  const no2Points: Array<[number, number]> = [
    [0, 0],
    [40, 50],
    [80, 100],
    [180, 200],
    [280, 300],
    [400, 400],
    [600, 500],
  ];
  it.each(no2Points)("computes NO2 sub-index for %s ug/m3", (val, expected) => {
    expect(subIndexForPollutant("NO2", val)).toBe(expected);
  });

  const o3Points: Array<[number, number]> = [
    [0, 0],
    [50, 50],
    [100, 100],
    [168, 200],
    [208, 300],
    [748, 400],
    [1000, 500],
  ];
  it.each(o3Points)("computes O3 sub-index for %s ug/m3", (val, expected) => {
    expect(subIndexForPollutant("O3", val)).toBe(expected);
  });

  const coPoints: Array<[number, number]> = [
    [0, 0],
    [1.0, 50],
    [2.0, 100],
    [10.0, 200],
    [17.0, 300],
    [34.0, 400],
    [60.0, 500],
  ];
  it.each(coPoints)("computes CO sub-index for %s mg/m3", (val, expected) => {
    expect(subIndexForPollutant("CO", val)).toBe(expected);
  });

  const fuels: CookingFuel[] = ["lpg", "induction", "biomass_chulha", "mixed"];
  it.each(fuels)("simulates indoor trajectory for cooking fuel %s", (cookingFuel) => {
    const sim = simulateIndoor24h({
      home: {
        ...baseProfile.home,
        cookingFuel,
        indoorSources: { ...baseProfile.home.indoorSources, smokingIndoors: true },
      },
      outdoorPm25: hours.map((h) => h.pm25),
      windowStates: hours.map((h) =>
        h.hourLocal === 14 ? "open" : h.hourLocal === 15 ? "ajar" : "closed",
      ),
      cookingHours: [8, 20],
    });
    expect(sim.central).toHaveLength(24);
    expect(sim.low.every((v, i) => v <= sim.high[i]!)).toBe(true);
  });

  const bands: AgeBand[] = [
    "toddler_0_1",
    "child_2_5",
    "child_6_12",
    "teen_13_17",
    "adult_18_64",
    "elder_65_plus",
  ];
  const modes: CommuteMode[] = [
    "walk",
    "cycle",
    "two_wheeler",
    "auto",
    "bus",
    "metro",
    "car_open",
    "car_ac",
    "carpool",
    "wfh",
  ];
  it.each(bands)("compares commutes across all modes for ageBand %s", (ageBand) => {
    const res = compareCommutes({ ageBand, distanceKm: 6, departHour: 8, hours });
    expect(res.map((r) => r.mode).sort()).toEqual([...modes].sort());
  });

  const personas: PersonaPreset[] = [
    "school_child",
    "office_worker",
    "homemaker",
    "elder",
    "outdoor_worker",
    "wfh",
  ];
  it.each(personas)("computes full plan cleanly for persona %s", (persona) => {
    const p: HouseholdProfile = {
      ...baseProfile,
      locale: "hi",
      members: [{ ...baseProfile.members[0]!, persona }],
    };
    const full = computeFullPlan(p, bundle, p.members[0]!.id, ["cr_box", "n95_commute"]);
    expect(full.factSheet.facts.dose_plan?.value).toBeTypeOf("number");
    expect(full.memberPlans[p.members[0]!.id]?.waterfall.steps).toHaveLength(2);
  });

  it("handles edge cases for GRAP stages I/IV, Hindi community kit, and invalid CPCB inputs", () => {
    expect(computeGrapStatus(28.6, 77.2, 220)?.stage).toBe("I");
    expect(computeGrapStatus(28.6, 77.2, 470)?.stage).toBe("IV");
    expect(computeCpcbAqi({ pm25: -5 }).aqi).toBe(0);
    const hiKit = computeCommunityKit(
      { orgType: "rwa", orgName: "सेक्टर 10", headcount: 150, hours },
      "hi",
    );
    expect(hiKit.whatsappText).toContain("सेक्टर 10");
  });
});
