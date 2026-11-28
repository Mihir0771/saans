import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { AirBundle } from "@/engine/schema";
import { roundTo2Dp } from "@/engine/units";
import { AHMEDABAD_DEMO_AIR } from "@/lib/ahmedabad-fixture";
import { SHARMA_DEMO_AIR } from "@/lib/sharma-fixture";
import { LruCache } from "@/server/cache";
import { apiError, enforceRouteRateLimit, jsonNoStore } from "@/server/http";
import { applyCalibrationAndSim, fetchOpenMeteoBundle, geocodeCity } from "@/server/openmeteo";

const airCache = new LruCache<AirBundle>(128, 15 * 60 * 1000);

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).default(28.59),
  lon: z.coerce.number().min(-180).max(180).default(77.05),
  city: z.string().max(80).default("Delhi"),
  demo: z.string().optional(),
  q: z.string().max(80).optional(),
  calibratePm25: z.coerce.number().positive().max(2000).optional(),
  simMean: z.coerce.number().min(50).max(450).optional(),
});

async function loadBaseAir(q: z.infer<typeof QuerySchema>): Promise<AirBundle> {
  const lat2dp = roundTo2Dp(q.lat);
  const lon2dp = roundTo2Dp(q.lon);
  const cacheKey = `${lat2dp},${lon2dp}`;
  const cached = airCache.get(cacheKey);
  if (cached) return cached;
  try {
    const live = await fetchOpenMeteoBundle(lat2dp, lon2dp, q.city);
    airCache.set(cacheKey, live);
    return live;
  } catch {
    const stale = airCache.getStale(cacheKey);
    if (stale) return { ...stale, stale: true };
    return {
      ...SHARMA_DEMO_AIR,
      source: "offline-sample",
      stale: true,
      cityName: q.city,
      lat2dp,
      lon2dp,
    };
  }
}

/**
 * Serves live Open-Meteo CAMS forecasts (cached 15 min per 2 d.p. cell),
 * geocoding results, demo scenarios, or user monitor calibrations.
 */
export async function GET(req: NextRequest) {
  const blocked = enforceRouteRateLimit(req, "air", 60);
  if (blocked) return blocked;

  const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!parsed.success) return apiError("Invalid query parameters", 400);

  const q = parsed.data;
  if (q.q) {
    const matches = await geocodeCity(q.q).catch(() => []);
    return jsonNoStore({ results: matches });
  }
  if (q.demo === "sharma" || q.demo === "ahmedabad") {
    const demoAir = q.demo === "ahmedabad" ? AHMEDABAD_DEMO_AIR : SHARMA_DEMO_AIR;
    return jsonNoStore(applyCalibrationAndSim(demoAir, q.calibratePm25, q.simMean));
  }
  const out = applyCalibrationAndSim(await loadBaseAir(q), q.calibratePm25, q.simMean);
  if (out.stale || out.source === "offline-sample") return jsonNoStore(out);
  return NextResponse.json(out, {
    headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=3600" },
  });
}
