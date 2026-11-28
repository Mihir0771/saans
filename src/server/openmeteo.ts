import { z } from "zod";
import type { AirBundle, AirHour } from "@/engine/schema";
import { clamp, roundTo2Dp } from "@/engine/units";
import { SHARMA_DEMO_AIR } from "@/lib/sharma-fixture";

const NullableNumArray = z.array(z.number().nullable()).min(24);

export const OpenMeteoAqSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().optional(),
  hourly: z.object({
    time: z.array(z.string()).min(24),
    pm2_5: NullableNumArray,
    pm10: NullableNumArray,
    nitrogen_dioxide: NullableNumArray.optional(),
    ozone: NullableNumArray.optional(),
    carbon_monoxide: NullableNumArray.optional(),
    us_aqi: NullableNumArray.optional(),
  }),
});

export const OpenMeteoWeatherSchema = z.object({
  hourly: z.object({
    time: z.array(z.string()).min(24),
    temperature_2m: NullableNumArray.optional(),
    relative_humidity_2m: NullableNumArray.optional(),
    wind_speed_10m: NullableNumArray.optional(),
    boundary_layer_height: NullableNumArray.optional(),
    precipitation: NullableNumArray.optional(),
  }),
});

export const GeocodeResultSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string().optional(),
        admin1: z.string().optional(),
      }),
    )
    .optional(),
});

function numAt(arr: Array<number | null> | undefined, idx: number): number | undefined {
  const v = arr?.[idx];
  return v === null || v === undefined ? undefined : v;
}

function parseHourLocal(iso: string, fallback: number): number {
  const m = /T(\d{2}):/.exec(iso);
  if (!m || !m[1]) return fallback % 24;
  return Number.parseInt(m[1], 10) % 24;
}

function buildAirHour(
  aq: z.infer<typeof OpenMeteoAqSchema>,
  weather: z.infer<typeof OpenMeteoWeatherSchema> | undefined,
  idx: number,
  i: number,
): AirHour {
  const iso = aq.hourly.time[idx] ?? "";
  return {
    isoTime: iso,
    hourLocal: parseHourLocal(iso, i),
    pm25: Math.max(0, numAt(aq.hourly.pm2_5, idx) ?? 0),
    pm10: Math.max(0, numAt(aq.hourly.pm10, idx) ?? 0),
    no2: numAt(aq.hourly.nitrogen_dioxide, idx),
    o3: numAt(aq.hourly.ozone, idx),
    co_ugm3: numAt(aq.hourly.carbon_monoxide, idx),
    usAqi: numAt(aq.hourly.us_aqi, idx),
    tempC: numAt(weather?.hourly.temperature_2m, idx),
    rhPct: numAt(weather?.hourly.relative_humidity_2m, idx),
    windMs: numAt(weather?.hourly.wind_speed_10m, idx),
    blhM: numAt(weather?.hourly.boundary_layer_height, idx),
    precipMm: numAt(weather?.hourly.precipitation, idx),
  };
}

export function mapOpenMeteoToHours(
  aq: z.infer<typeof OpenMeteoAqSchema>,
  weather?: z.infer<typeof OpenMeteoWeatherSchema>,
): AirHour[] {
  const start = aq.hourly.time.length >= 48 ? 24 : 0;
  const sliceLen = Math.min(24, aq.hourly.time.length - start);
  const hours: AirHour[] = [];
  for (let i = 0; i < sliceLen; i += 1) {
    hours.push(buildAirHour(aq, weather, start + i, i));
  }
  return hours;
}

async function fetchJsonWithRetry(url: string, timeoutMs = 4000): Promise<unknown> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < 2) {
        const jitter = 120 + Math.floor(Math.random() * 180);
        await new Promise((r) => setTimeout(r, jitter * (attempt + 1)));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

export async function fetchOpenMeteoBundle(
  lat: number,
  lon: number,
  cityName: string,
): Promise<AirBundle> {
  const lat2dp = roundTo2Dp(lat);
  const lon2dp = roundTo2Dp(lon);
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat2dp}&longitude=${lon2dp}&hourly=pm2_5,pm10,nitrogen_dioxide,ozone,carbon_monoxide,us_aqi&past_days=1&forecast_days=2&timezone=auto`;
  const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat2dp}&longitude=${lon2dp}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,boundary_layer_height,precipitation&past_days=1&forecast_days=2&timezone=auto`;

  const timeoutMs = Number(process.env.OPENMETEO_TIMEOUT_MS ?? 4000);
  const aqRaw = await fetchJsonWithRetry(aqUrl, timeoutMs);
  const aq = OpenMeteoAqSchema.parse(aqRaw);

  let wx: z.infer<typeof OpenMeteoWeatherSchema> | undefined;
  try {
    const wxRaw = await fetchJsonWithRetry(wxUrl, timeoutMs);
    wx = OpenMeteoWeatherSchema.parse(wxRaw);
  } catch {
    wx = undefined;
  }

  const allHours = mapOpenMeteoToHours(aq, wx);
  const today24 = allHours.slice(0, 24);
  return {
    source: "open-meteo",
    fetchedAt: new Date().toISOString(),
    stale: false,
    gridResolutionKm: 25,
    calibrationScale: 1,
    cityName,
    lat2dp,
    lon2dp,
    hours: today24.length >= 24 ? today24 : SHARMA_DEMO_AIR.hours,
  };
}

export async function geocodeCity(query: string) {
  const clean = query.trim().slice(0, 80);
  if (clean.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=5&language=en&format=json`;
  const raw = await fetchJsonWithRetry(url, 3500);
  const parsed = GeocodeResultSchema.parse(raw);
  return (parsed.results ?? []).map((r) => ({
    name: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
    lat: roundTo2Dp(r.latitude),
    lon: roundTo2Dp(r.longitude),
  }));
}

export function applyCalibrationAndSim(
  bundle: AirBundle,
  calibratePm25?: number,
  simTargetMean?: number,
): AirBundle {
  let scale = 1;
  if (calibratePm25 !== undefined && Number.isFinite(calibratePm25) && calibratePm25 > 0) {
    const modelNow = Math.max(bundle.hours[0]?.pm25 ?? 1, 1);
    scale = Number(clamp(calibratePm25 / modelNow, 0.5, 4).toFixed(2));
  }

  let simScale = 1;
  if (simTargetMean !== undefined && Number.isFinite(simTargetMean)) {
    const target = clamp(simTargetMean, 50, 450);
    const mean = bundle.hours.reduce((s, h) => s + h.pm25, 0) / Math.max(bundle.hours.length, 1);
    simScale = target / Math.max(mean, 1);
  }

  const totalMult = scale * simScale;
  return {
    ...bundle,
    calibrationScale: scale,
    simulationTargetMean: simTargetMean !== undefined ? clamp(simTargetMean, 50, 450) : undefined,
    hours: bundle.hours.map((h) => ({
      ...h,
      pm25: Number((h.pm25 * totalMult).toFixed(1)),
      pm10: Number((h.pm10 * totalMult).toFixed(1)),
    })),
  };
}
