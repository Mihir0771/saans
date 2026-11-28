import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";
import { SHARMA_DEMO_AIR } from "@/lib/sharma-fixture";
import { pointerRatioInSvg } from "@/lib/svg-pointer";
import { LruCache } from "@/server/cache";
import { enforceRouteRateLimit, jsonNoStore, parseJsonRequest } from "@/server/http";
import { applyCalibrationAndSim } from "@/server/openmeteo";
import { checkRateLimit, MAX_RATE_LIMIT_BUCKETS, resetRateLimits } from "@/server/ratelimit";

describe("server/cache, ratelimit, calibration & simulation", () => {
  afterEach(() => {
    resetRateLimits();
  });

  it("evicts oldest cache entries and preserves stale fallback", () => {
    const cache = new LruCache<string>(2, 50);
    cache.set("a", "1");
    cache.set("b", "2");
    expect(cache.get("a")).toBe("1");
    cache.set("c", "3");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.getStale("b")).toBe("2");
  });

  it("enforces sliding-window per-IP rate limits", () => {
    expect(checkRateLimit("ip:1", 2)).toBe(true);
    expect(checkRateLimit("ip:1", 2)).toBe(true);
    expect(checkRateLimit("ip:1", 2)).toBe(false);
  });

  it("clamps user calibration scale between 0.5 and 4.0 and scales hourly PM", () => {
    const scaledUp = applyCalibrationAndSim(SHARMA_DEMO_AIR, 300, undefined);
    expect(scaledUp.calibrationScale).toBe(2);
    expect(scaledUp.hours[0]?.pm25).toBe(300);

    const clampedHigh = applyCalibrationAndSim(SHARMA_DEMO_AIR, 5000, undefined);
    expect(clampedHigh.calibrationScale).toBe(4);

    const clampedLow = applyCalibrationAndSim(SHARMA_DEMO_AIR, 10, undefined);
    expect(clampedLow.calibrationScale).toBe(0.5);
  });

  it("scales series shape cleanly for smog simulation slider", () => {
    const sim = applyCalibrationAndSim(SHARMA_DEMO_AIR, undefined, 300);
    const mean = sim.hours.reduce((s, h) => s + h.pm25, 0) / sim.hours.length;
    expect(mean).toBeCloseTo(300, 0);
    expect(sim.simulationTargetMean).toBe(300);
  });

  it("validates HTTP route helpers and SVG pointer normalization", async () => {
    resetRateLimits();
    const req = new NextRequest("http://localhost/api/plan", {
      method: "POST",
      headers: { "x-forwarded-for": "10.0.0.1", "content-type": "application/json" },
      body: JSON.stringify({ n: 42 }),
    });
    expect(enforceRouteRateLimit(req, "test", 1)).toBeNull();
    const limited = enforceRouteRateLimit(req, "test", 1);
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get("Retry-After")).toBe("60");

    const okParsed = await parseJsonRequest(req, z.object({ n: z.number() }), "bad");
    expect(okParsed.ok).toBe(true);
    const badReq = new NextRequest("http://localhost/api/plan", { method: "POST", body: "{" });
    const badParsed = await parseJsonRequest(badReq, z.object({ n: z.number() }), "bad");
    expect(badParsed.ok).toBe(false);
    if (!badParsed.ok) expect(badParsed.response.status).toBe(400);

    expect(jsonNoStore({ ok: true }).headers.get("Cache-Control")).toBe("no-store");
    expect(MAX_RATE_LIMIT_BUCKETS).toBeGreaterThanOrEqual(1000);

    const fakeEvt = (clientX: number, width: number) =>
      ({
        clientX,
        currentTarget: { getBoundingClientRect: () => ({ left: 0, width }) },
      }) as unknown as Parameters<typeof pointerRatioInSvg>[0];
    expect(pointerRatioInSvg(fakeEvt(100, 0), 336, 34, 326)).toBe(0);
    expect(pointerRatioInSvg(fakeEvt(34, 336), 336, 34, 326)).toBeCloseTo(0, 4);
    expect(pointerRatioInSvg(fakeEvt(326, 336), 336, 34, 326)).toBeCloseTo(1, 4);
  });
});
