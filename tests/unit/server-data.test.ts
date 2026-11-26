import { afterEach, describe, expect, it } from "vitest";
import { SHARMA_DEMO_AIR } from "@/lib/sharma-fixture";
import { LruCache } from "@/server/cache";
import { applyCalibrationAndSim } from "@/server/openmeteo";
import { checkRateLimit, resetRateLimits } from "@/server/ratelimit";

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
});
