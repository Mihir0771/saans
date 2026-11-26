import type { AirBundle, HouseholdProfile } from "@/engine/schema";

export const SHARMA_PROFILE: HouseholdProfile = {
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
      commuteDistanceKm: 6,
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
      id: "mum",
      name: "Mum",
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
      id: "papa",
      name: "Papa",
      avatarEmoji: "👨",
      ageBand: "adult_18_64",
      conditions: ["none"],
      outdoorWorker: false,
      persona: "office_worker",
      commuteMode: "two_wheeler",
      commuteDistanceKm: 14,
      commuteDepartHour: 9,
    },
  ],
  home: {
    areaSqm: 75,
    ceilingHeightM: 3,
    leakiness: "leaky",
    cookingFuel: "lpg",
    hasExhaustHood: false,
    sealDoorGaps: false,
    indoorSources: {
      incenseDailyMin: 15,
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

const DEMO_PM25 = [
  150, 152, 155, 158, 162, 168, 172, 174, 180, 176, 150, 120, 95, 80, 72, 78, 98, 126, 154, 172,
  178, 174, 166, 158,
];

function demoHour(pm25: number, h: number) {
  const morningPeak = h >= 7 && h <= 10;
  const afternoonDip = h >= 12 && h <= 16;
  return {
    isoTime: `2026-11-24T${String(h).padStart(2, "0")}:00`,
    hourLocal: h,
    pm25,
    pm10: Math.round(pm25 * 1.48),
    no2: morningPeak ? 78 : 52,
    o3: afternoonDip ? 58 : 24,
    co_ugm3: morningPeak ? 1850 : 1200,
    usAqi: Math.round(pm25 * 1.35),
    tempC: afternoonDip ? 22 : 11,
    rhPct: afternoonDip ? 45 : 78,
    windMs: afternoonDip ? 3.1 : 0.9,
    blhM: afternoonDip ? 780 : 160,
    precipMm: 0,
  };
}

export const SHARMA_DEMO_AIR: AirBundle = {
  source: "demo-sharma",
  fetchedAt: "2026-11-24T07:02:00+05:30",
  stale: false,
  gridResolutionKm: 25,
  calibrationScale: 1,
  cityName: "Dwarka, Delhi",
  lat2dp: 28.59,
  lon2dp: 77.05,
  hours: DEMO_PM25.map(demoHour),
};
