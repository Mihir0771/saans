import { COMMUTE_SPECS, INHALATION_RATE_M3H } from "./params";
import type { AgeBand, AirHour, CommuteMode } from "./schema";

export interface CommuteComparison {
  mode: CommuteMode;
  doseUg: number;
  co2g: number;
  costInr: number;
  durationMin: number;
}

export interface CompareCommutesInput {
  ageBand: AgeBand;
  distanceKm: number;
  departHour: number;
  hours: AirHour[];
  indoorPmAtHour?: number;
}

const ALL_MODES: CommuteMode[] = [
  "metro",
  "bus",
  "carpool",
  "car_ac",
  "auto",
  "two_wheeler",
  "car_open",
  "walk",
  "cycle",
  "wfh",
];

function computeTripDose(
  mode: CommuteMode,
  ageBand: AgeBand,
  distanceKm: number,
  pm25Ambient: number,
  indoorPm: number,
): { doseUg: number; durationMin: number } {
  const spec = COMMUTE_SPECS[mode];
  if (mode === "wfh" || distanceKm <= 0) {
    const br = INHALATION_RATE_M3H[ageBand].rest.value;
    return { doseUg: Number((br * indoorPm * 0.5).toFixed(2)), durationMin: 0 };
  }
  const durationH = (distanceKm * 2) / Math.max(spec.speedKmh, 1);
  const br = INHALATION_RATE_M3H[ageBand][spec.activity].value;
  const conc = pm25Ambient * spec.pmMultiplier.value;
  return {
    doseUg: Number((durationH * br * conc).toFixed(2)),
    durationMin: Math.round(durationH * 60),
  };
}

export function compareCommutes(input: CompareCommutesInput): CommuteComparison[] {
  const departIdx = ((input.departHour % 24) + 24) % 24;
  const returnIdx = (departIdx + 8) % 24;
  const avgPm = ((input.hours[departIdx]?.pm25 ?? 100) + (input.hours[returnIdx]?.pm25 ?? 100)) / 2;
  const indoorPm = input.indoorPmAtHour ?? avgPm * 0.6;

  return ALL_MODES.map((mode) => {
    const spec = COMMUTE_SPECS[mode];
    const trip = computeTripDose(mode, input.ageBand, input.distanceKm, avgPm, indoorPm);
    const roundTripKm = mode === "wfh" ? 0 : input.distanceKm * 2;
    return {
      mode,
      doseUg: trip.doseUg,
      co2g: Math.round(roundTripKm * spec.co2gPerPkm.value),
      costInr: Math.round(roundTripKm * spec.costInrPerKm),
      durationMin: trip.durationMin,
    };
  }).sort((a, b) => a.doseUg - b.doseUg);
}

export interface DepartureShiftResult {
  usualHour: number;
  bestHour: number;
  usualDoseUg: number;
  bestDoseUg: number;
}

export function findBestDepartureShift(input: {
  ageBand: AgeBand;
  mode: CommuteMode;
  distanceKm: number;
  usualDepartHour: number;
  hours: AirHour[];
}): DepartureShiftResult {
  const spec = COMMUTE_SPECS[input.mode];
  const evalHour = (h: number): number => {
    const idx = ((h % 24) + 24) % 24;
    const pm = input.hours[idx]?.pm25 ?? 100;
    return computeTripDose(input.mode, input.ageBand, input.distanceKm, pm, pm * 0.6).doseUg;
  };
  const usualDoseUg = evalHour(input.usualDepartHour);
  let bestHour = input.usualDepartHour;
  let bestDoseUg = usualDoseUg;
  for (let offset = -2; offset <= 2; offset += 1) {
    const cand = (((input.usualDepartHour + offset) % 24) + 24) % 24;
    const d = evalHour(cand);
    if (d < bestDoseUg && spec.speedKmh >= 0) {
      bestDoseUg = d;
      bestHour = cand;
    }
  }
  return { usualHour: input.usualDepartHour, bestHour, usualDoseUg, bestDoseUg };
}
