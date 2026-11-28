import { computeAqiNowEquivalent } from "./aqi";
import type { AirHour, Confidence, FactItem, FactSheet, Locale } from "./schema";
import type { TrappedAirRisk } from "./windows";

export interface FactSheetBuildInput {
  cityName: string;
  locale: Locale;
  isDemo: boolean;
  isSimulation: boolean;
  calibrationScale: number;
  hours: AirHour[];
  memberName: string;
  baselineRatio: number;
  planRatio: number;
  doseSavedPct: number;
  bestWindowStartHour: number;
  worstWindowStartHour: number;
  oneTimeCostInr: number;
  topActionSavingRatio: number;
  safetyFlags: string[];
  trappedAirRisk: TrappedAirRisk;
}

function formatHourLabel(hour: number, locale: Locale): string {
  const h = ((hour % 24) + 24) % 24;
  if (locale === "hi") return `${h} बजे`;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${suffix}`;
}

const f = (
  id: string,
  value: number | string,
  unit: string,
  display: string,
  confidence: Confidence,
): FactItem => ({
  id,
  value,
  unit,
  display,
  confidence,
});

function buildFactsMap(
  input: FactSheetBuildInput,
  aqiVal: number,
  pm25Val: number,
): Record<string, FactItem> {
  return {
    aqi_now: f("aqi_now", aqiVal, "CPCB", `${aqiVal}`, "A"),
    pm25_now: f("pm25_now", pm25Val, "µg/m³", `${pm25Val} µg/m³`, "B"),
    dose_baseline: f(
      "dose_baseline",
      input.baselineRatio,
      "× WHO",
      `${input.baselineRatio.toFixed(1)}×`,
      "B",
    ),
    dose_plan: f("dose_plan", input.planRatio, "× WHO", `${input.planRatio.toFixed(1)}×`, "B"),
    dose_saved_pct: f("dose_saved_pct", input.doseSavedPct, "%", `${input.doseSavedPct}%`, "B"),
    top_action_saving: f(
      "top_action_saving",
      input.topActionSavingRatio,
      "× WHO",
      `${input.topActionSavingRatio.toFixed(1)}×`,
      "B",
    ),
    best_window_start: f(
      "best_window_start",
      input.bestWindowStartHour,
      "hour",
      formatHourLabel(input.bestWindowStartHour, input.locale),
      "B",
    ),
    worst_window_start: f(
      "worst_window_start",
      input.worstWindowStartHour,
      "hour",
      formatHourLabel(input.worstWindowStartHour, input.locale),
      "B",
    ),
    one_time_cost_inr: f(
      "one_time_cost_inr",
      input.oneTimeCostInr,
      "₹",
      `₹${input.oneTimeCostInr.toLocaleString("en-IN")}`,
      "C",
    ),
    member_name: f("member_name", input.memberName, "", input.memberName, "A"),
  };
}

/**
 * Builds the flat, engine-verified `FactSheet` object passed to Gemini.
 * Every numeric claim rendered by `/api/explain` or `/api/chat` must trace back to a slot here.
 */
export function buildFactSheet(input: FactSheetBuildInput): FactSheet {
  const nowHour = input.hours[0] ?? { isoTime: "", hourLocal: 0, pm25: 100, pm10: 150 };
  const aqiNow = computeAqiNowEquivalent(nowHour);
  return {
    generatedAt: nowHour.isoTime || new Date(0).toISOString(),
    locale: input.locale,
    cityName: input.cityName,
    isDemo: input.isDemo,
    isSimulation: input.isSimulation,
    calibrationScale: input.calibrationScale,
    aqiNow,
    trappedAirRisk: input.trappedAirRisk,
    safetyFlags: input.safetyFlags,
    facts: buildFactsMap(input, aqiNow.aqi, Math.round(nowHour.pm25)),
  };
}
