import type { AirHour, CpcbAqiResult, CpcbBand } from "./schema";
import { ugm3ToMgm3 } from "./units";

export type PollutantKey = "PM2.5" | "PM10" | "NO2" | "O3" | "CO";

interface Breakpoint {
  bLo: number;
  bHi: number;
  iLo: number;
  iHi: number;
}

const BREAKPOINTS: Record<PollutantKey, Breakpoint[]> = {
  "PM2.5": [
    { bLo: 0, bHi: 30, iLo: 0, iHi: 50 },
    { bLo: 31, bHi: 60, iLo: 51, iHi: 100 },
    { bLo: 61, bHi: 90, iLo: 101, iHi: 200 },
    { bLo: 91, bHi: 120, iLo: 201, iHi: 300 },
    { bLo: 121, bHi: 250, iLo: 301, iHi: 400 },
    { bLo: 251, bHi: 380, iLo: 401, iHi: 500 },
  ],
  PM10: [
    { bLo: 0, bHi: 50, iLo: 0, iHi: 50 },
    { bLo: 51, bHi: 100, iLo: 51, iHi: 100 },
    { bLo: 101, bHi: 250, iLo: 101, iHi: 200 },
    { bLo: 251, bHi: 350, iLo: 201, iHi: 300 },
    { bLo: 351, bHi: 430, iLo: 301, iHi: 400 },
    { bLo: 431, bHi: 510, iLo: 401, iHi: 500 },
  ],
  NO2: [
    { bLo: 0, bHi: 40, iLo: 0, iHi: 50 },
    { bLo: 41, bHi: 80, iLo: 51, iHi: 100 },
    { bLo: 81, bHi: 180, iLo: 101, iHi: 200 },
    { bLo: 181, bHi: 280, iLo: 201, iHi: 300 },
    { bLo: 281, bHi: 400, iLo: 301, iHi: 400 },
    { bLo: 401, bHi: 520, iLo: 401, iHi: 500 },
  ],
  O3: [
    { bLo: 0, bHi: 50, iLo: 0, iHi: 50 },
    { bLo: 51, bHi: 100, iLo: 51, iHi: 100 },
    { bLo: 101, bHi: 168, iLo: 101, iHi: 200 },
    { bLo: 169, bHi: 208, iLo: 201, iHi: 300 },
    { bLo: 209, bHi: 748, iLo: 301, iHi: 400 },
    { bLo: 749, bHi: 950, iLo: 401, iHi: 500 },
  ],
  CO: [
    { bLo: 0, bHi: 1.0, iLo: 0, iHi: 50 },
    { bLo: 1.1, bHi: 2.0, iLo: 51, iHi: 100 },
    { bLo: 2.1, bHi: 10.0, iLo: 101, iHi: 200 },
    { bLo: 10.1, bHi: 17.0, iLo: 201, iHi: 300 },
    { bLo: 17.1, bHi: 34.0, iLo: 301, iHi: 400 },
    { bLo: 34.1, bHi: 50.0, iLo: 401, iHi: 500 },
  ],
};

const BAND_SHAPES: Record<CpcbBand, CpcbAqiResult["shape"]> = {
  good: "circle",
  sat: "diamond",
  mod: "triangle",
  poor: "square",
  vpoor: "pentagon",
  severe: "octagon",
};

export function aqiToBand(aqi: number): CpcbBand {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "sat";
  if (aqi <= 200) return "mod";
  if (aqi <= 300) return "poor";
  if (aqi <= 400) return "vpoor";
  return "severe";
}

export function subIndexForPollutant(pollutant: PollutantKey, rawValue: number): number {
  if (!Number.isFinite(rawValue) || rawValue <= 0) return 0;
  const value = pollutant === "CO" ? Math.round(rawValue * 10) / 10 : Math.round(rawValue);
  const table = BREAKPOINTS[pollutant];
  for (const bp of table) {
    if (value <= bp.bHi) {
      const span = bp.bHi - bp.bLo;
      if (span <= 0) return bp.iLo;
      const clampedVal = Math.max(value, bp.bLo);
      const idx = ((bp.iHi - bp.iLo) / span) * (clampedVal - bp.bLo) + bp.iLo;
      return Math.min(500, Math.round(idx));
    }
  }
  return 500;
}

export interface PollutantConcentrations {
  pm25?: number;
  pm10?: number;
  no2?: number;
  o3?: number;
  co_ugm3?: number;
}

export function computeCpcbAqi(
  inputs: PollutantConcentrations,
  is24hOfficial = false,
): CpcbAqiResult {
  const candidates: Array<[PollutantKey, number | undefined]> = [
    ["PM2.5", inputs.pm25],
    ["PM10", inputs.pm10],
    ["NO2", inputs.no2],
    ["O3", inputs.o3],
    ["CO", inputs.co_ugm3 !== undefined ? ugm3ToMgm3(inputs.co_ugm3) : undefined],
  ];

  const subIndices: Partial<Record<PollutantKey, number>> = {};
  let maxAqi = 0;
  let dominant: PollutantKey = "PM2.5";

  for (const [key, val] of candidates) {
    if (val === undefined || !Number.isFinite(val)) continue;
    const sub = subIndexForPollutant(key, val);
    subIndices[key] = sub;
    if (sub >= maxAqi) {
      maxAqi = sub;
      dominant = key;
    }
  }

  const band = aqiToBand(maxAqi);
  return {
    aqi: maxAqi,
    band,
    shape: BAND_SHAPES[band],
    dominantPollutant: dominant,
    subIndices,
    is24hOfficial,
  };
}

function meanDefined(values: Array<number | undefined>): number | undefined {
  const valid = values.filter((v): v is number => v !== undefined && Number.isFinite(v));
  if (valid.length === 0) return undefined;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

export function computeAqi24h(hourly: AirHour[]): CpcbAqiResult {
  const last24 = hourly.slice(-24);
  const last8 = hourly.slice(-8);
  const pm25 = meanDefined(last24.map((h) => h.pm25));
  const pm10 = meanDefined(last24.map((h) => h.pm10));
  const no2 = meanDefined(last24.map((h) => h.no2));
  const o3 = meanDefined(last8.map((h) => h.o3));
  const co_ugm3 = meanDefined(last8.map((h) => h.co_ugm3));

  const count = [pm25, pm10, no2, o3, co_ugm3].filter((v) => v !== undefined).length;
  const hasPm = pm25 !== undefined || pm10 !== undefined;
  const isOfficial = last24.length >= 24 && count >= 3 && hasPm;
  return computeCpcbAqi({ pm25, pm10, no2, o3, co_ugm3 }, isOfficial);
}

export function computeAqiNowEquivalent(hour: AirHour): CpcbAqiResult {
  return computeCpcbAqi(
    {
      pm25: hour.pm25,
      pm10: hour.pm10,
      no2: hour.no2,
      o3: hour.o3,
      co_ugm3: hour.co_ugm3,
    },
    false,
  );
}
