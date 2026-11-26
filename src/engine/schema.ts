import { z } from "zod";

export const LocaleSchema = z.enum(["en", "hi"]);
export type Locale = z.infer<typeof LocaleSchema>;

export const AgeBandSchema = z.enum([
  "toddler_0_1",
  "child_2_5",
  "child_6_12",
  "teen_13_17",
  "adult_18_64",
  "elder_65_plus",
]);
export type AgeBand = z.infer<typeof AgeBandSchema>;

export const HealthConditionSchema = z.enum(["asthma", "copd", "heart", "pregnancy", "none"]);
export type HealthCondition = z.infer<typeof HealthConditionSchema>;

export const ActivityLevelSchema = z.enum(["sleep", "rest", "light", "moderate", "vigorous"]);
export type ActivityLevel = z.infer<typeof ActivityLevelSchema>;

export const PersonaPresetSchema = z.enum([
  "school_child",
  "office_worker",
  "homemaker",
  "elder",
  "outdoor_worker",
  "wfh",
]);
export type PersonaPreset = z.infer<typeof PersonaPresetSchema>;

export const CommuteModeSchema = z.enum([
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
]);
export type CommuteMode = z.infer<typeof CommuteModeSchema>;

export const CookingFuelSchema = z.enum(["lpg", "induction", "biomass_chulha", "mixed"]);
export type CookingFuel = z.infer<typeof CookingFuelSchema>;

export const LeakinessClassSchema = z.enum(["tight", "average", "leaky"]);
export type LeakinessClass = z.infer<typeof LeakinessClassSchema>;

export const WindowStateSchema = z.enum(["closed", "ajar", "open"]);
export type WindowState = z.infer<typeof WindowStateSchema>;

export const ConfidenceSchema = z.enum(["A", "B", "C"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const CpcbBandSchema = z.enum(["good", "sat", "mod", "poor", "vpoor", "severe"]);
export type CpcbBand = z.infer<typeof CpcbBandSchema>;

export const FamilyMemberSchema = z.object({
  id: z.string().min(1).max(32),
  name: z.string().min(1).max(40),
  avatarEmoji: z.string().min(1).max(8),
  ageBand: AgeBandSchema,
  conditions: z.array(HealthConditionSchema).min(1).max(5),
  outdoorWorker: z.boolean(),
  persona: PersonaPresetSchema,
  commuteMode: CommuteModeSchema,
  commuteDistanceKm: z.number().min(0).max(120),
  commuteDepartHour: z.number().int().min(0).max(23),
});
export type FamilyMember = z.infer<typeof FamilyMemberSchema>;

export const HomeProfileSchema = z.object({
  areaSqm: z.number().min(8).max(500),
  ceilingHeightM: z.number().min(2).max(5),
  leakiness: LeakinessClassSchema,
  cookingFuel: CookingFuelSchema,
  hasExhaustHood: z.boolean(),
  sealDoorGaps: z.boolean(),
  indoorSources: z.object({
    incenseDailyMin: z.number().min(0).max(240),
    mosquitoCoilNight: z.boolean(),
    smokingIndoors: z.boolean(),
    unventedCombustion: z.boolean(),
  }),
  purifier: z.object({
    enabled: z.boolean(),
    cadrM3h: z.number().min(0).max(1500),
    filterAgeMonths: z.number().min(0).max(60),
    hoursPerDay: z.number().min(0).max(24),
    isCrBox: z.boolean(),
    hasIonizerOrOzone: z.boolean(),
  }),
});
export type HomeProfile = z.infer<typeof HomeProfileSchema>;

export const HouseholdProfileSchema = z.object({
  id: z.string().min(1).max(40),
  cityName: z.string().min(1).max(80),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  locale: LocaleSchema,
  members: z.array(FamilyMemberSchema).min(1).max(8),
  home: HomeProfileSchema,
});
export type HouseholdProfile = z.infer<typeof HouseholdProfileSchema>;

export const AirHourSchema = z.object({
  isoTime: z.string(),
  hourLocal: z.number().int().min(0).max(23),
  pm25: z.number().min(0).max(2000),
  pm10: z.number().min(0).max(3000),
  no2: z.number().min(0).max(2000).optional(),
  o3: z.number().min(0).max(2000).optional(),
  co_ugm3: z.number().min(0).max(200000).optional(),
  usAqi: z.number().min(0).max(1000).optional(),
  tempC: z.number().min(-40).max(60).optional(),
  rhPct: z.number().min(0).max(100).optional(),
  windMs: z.number().min(0).max(100).optional(),
  blhM: z.number().min(0).max(10000).optional(),
  precipMm: z.number().min(0).max(500).optional(),
});
export type AirHour = z.infer<typeof AirHourSchema>;

export const AirBundleSchema = z.object({
  source: z.enum(["open-meteo", "demo-sharma", "demo-ahmedabad", "offline-sample"]),
  fetchedAt: z.string(),
  stale: z.boolean(),
  gridResolutionKm: z.number().positive(),
  calibrationScale: z.number().min(0.5).max(4),
  simulationTargetMean: z.number().min(50).max(450).optional(),
  cityName: z.string(),
  lat2dp: z.number(),
  lon2dp: z.number(),
  hours: z.array(AirHourSchema).min(24),
});
export type AirBundle = z.infer<typeof AirBundleSchema>;

export interface CpcbAqiResult {
  aqi: number;
  band: CpcbBand;
  shape: "circle" | "diamond" | "triangle" | "square" | "pentagon" | "octagon";
  dominantPollutant: "PM2.5" | "PM10" | "NO2" | "O3" | "CO";
  subIndices: Partial<Record<"PM2.5" | "PM10" | "NO2" | "O3" | "CO", number>>;
  is24hOfficial: boolean;
}

export interface FactItem {
  id: string;
  value: number | string;
  unit: string;
  display: string;
  low?: number;
  high?: number;
  confidence: Confidence;
  formula?: string;
}

export interface FactSheet {
  generatedAt: string;
  locale: Locale;
  cityName: string;
  isDemo: boolean;
  isSimulation: boolean;
  calibrationScale: number;
  aqiNow: CpcbAqiResult;
  trappedAirRisk: "low" | "moderate" | "high";
  safetyFlags: string[];
  facts: Record<string, FactItem>;
}
