import type { AirBundle, HouseholdProfile } from "@/engine/schema";
import { SHARMA_DEMO_AIR, SHARMA_PROFILE } from "./sharma-fixture";

export type DemoKind = "sharma" | "ahmedabad";

export const AHMEDABAD_PROFILE: HouseholdProfile = {
  id: "ahmedabad",
  cityName: "Navrangpura, Ahmedabad",
  lat: 23.03,
  lon: 72.59,
  locale: "en",
  members: [
    {
      id: "kavya",
      name: "Kavya",
      avatarEmoji: "👧",
      ageBand: "child_6_12",
      conditions: ["none"],
      outdoorWorker: false,
      persona: "school_child",
      commuteMode: "auto",
      commuteDistanceKm: 5,
      commuteDepartHour: 8,
    },
    {
      id: "dada",
      name: "Dada",
      avatarEmoji: "👴",
      ageBand: "elder_65_plus",
      conditions: ["asthma"],
      outdoorWorker: false,
      persona: "elder",
      commuteMode: "wfh",
      commuteDistanceKm: 0,
      commuteDepartHour: 9,
    },
    {
      id: "meera",
      name: "Meera",
      avatarEmoji: "👩",
      ageBand: "adult_18_64",
      conditions: ["none"],
      outdoorWorker: false,
      persona: "homemaker",
      commuteMode: "wfh",
      commuteDistanceKm: 0,
      commuteDepartHour: 9,
    },
    {
      id: "rohan",
      name: "Rohan",
      avatarEmoji: "👨",
      ageBand: "adult_18_64",
      conditions: ["none"],
      outdoorWorker: false,
      persona: "office_worker",
      commuteMode: "two_wheeler",
      commuteDistanceKm: 12,
      commuteDepartHour: 9,
    },
  ],
  home: {
    areaSqm: 85,
    ceilingHeightM: 3,
    leakiness: "average",
    cookingFuel: "lpg",
    hasExhaustHood: false,
    sealDoorGaps: false,
    indoorSources: {
      incenseDailyMin: 10,
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
  },
};

const AHMEDABAD_PM25 = [
  104, 108, 112, 116, 122, 128, 134, 138, 132, 118, 96, 78, 66, 60, 58, 64, 76, 94, 114, 126, 130,
  124, 116, 108,
];

function ahmedabadHour(pm25: number, h: number) {
  const morningPeak = h >= 7 && h <= 10;
  const afternoonDip = h >= 12 && h <= 16;
  return {
    isoTime: `2026-11-24T${String(h).padStart(2, "0")}:00`,
    hourLocal: h,
    pm25,
    pm10: Math.round(pm25 * 1.85),
    no2: morningPeak ? 68 : 44,
    o3: afternoonDip ? 64 : 26,
    co_ugm3: morningPeak ? 1420 : 880,
    usAqi: Math.round(pm25 * 1.48),
    tempC: afternoonDip ? 29 : 17,
    rhPct: afternoonDip ? 34 : 58,
    windMs: afternoonDip ? 3.8 : 1.3,
    blhM: afternoonDip ? 980 : 210,
    precipMm: 0,
  };
}

export const AHMEDABAD_DEMO_AIR: AirBundle = {
  source: "demo-ahmedabad",
  fetchedAt: "2026-11-24T07:05:00+05:30",
  stale: false,
  gridResolutionKm: 25,
  calibrationScale: 1,
  cityName: "Navrangpura, Ahmedabad",
  lat2dp: 23.03,
  lon2dp: 72.59,
  hours: AHMEDABAD_PM25.map(ahmedabadHour),
};

export function resolveDemoInputs(
  demo?: DemoKind,
  fallbackProfile?: HouseholdProfile,
  fallbackAir?: AirBundle,
): { profile: HouseholdProfile; air: AirBundle } {
  if (demo === "ahmedabad") return { profile: AHMEDABAD_PROFILE, air: AHMEDABAD_DEMO_AIR };
  if (demo === "sharma") return { profile: SHARMA_PROFILE, air: SHARMA_DEMO_AIR };
  return {
    profile: fallbackProfile ?? SHARMA_PROFILE,
    air: fallbackAir ?? SHARMA_DEMO_AIR,
  };
}
