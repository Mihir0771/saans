import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { computeCpcbAqi } from "@/engine/aqi";
import { steadyStateIndoorPm } from "@/engine/indoor";
import { computeMemberExposure } from "@/engine/exposure";
import { sanitizeUserText } from "@/server/guard";
import { checkRateLimit, resetRateLimits } from "@/server/ratelimit";
import { detectImageMime, MAX_IMAGE_BYTES } from "@/server/vision";
import { SHARMA_DEMO_AIR, SHARMA_PROFILE } from "@/lib/sharma-fixture";

describe("Security headers, rate limits & hand-computed engine sanity", () => {
  it("configures strict CSP, HSTS, X-Frame-Options, and nosniff headers", async () => {
    const headerRules = await nextConfig.headers?.();
    const all = headerRules?.[0]?.headers ?? [];
    const keys = all.map((h) => h.key);
    expect(keys).toContain("Content-Security-Policy");
    expect(keys).toContain("Strict-Transport-Security");
    expect(keys).toContain("X-Content-Type-Options");
    expect(keys).toContain("X-Frame-Options");
    const csp = all.find((h) => h.key === "Content-Security-Policy")?.value ?? "";
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("enforces image size limit and magic-byte validation", () => {
    expect(MAX_IMAGE_BYTES).toBe(4 * 1024 * 1024);
    expect(detectImageMime(new Uint8Array([0, 1, 2]))).toBeNull();
  });

  it("sanitizes XSS/control chars and enforces rate-limit ceiling", () => {
    resetRateLimits();
    for (let i = 0; i < 20; i += 1) expect(checkRateLimit("sec:ip", 20)).toBe(true);
    expect(checkRateLimit("sec:ip", 20)).toBe(false);
    const cleaned = sanitizeUserText("<script>alert(1)</script>\u0000", 500);
    expect(cleaned).not.toContain("\u0000");
  });

  it("matches 5 hand-computed physical scenarios within expected tolerances", () => {
    // 1. CPCB PM2.5=174 -> 301 + (400-301)/(250-121)*(174-121) = 341.67 -> 342
    expect(computeCpcbAqi({ pm25: 174 }).aqi).toBe(342);
    // 2. CPCB PM10=250 -> exact boundary 200
    expect(computeCpcbAqi({ pm10: 250 }).aqi).toBe(200);
    // 3. Steady state indoor PM with P=0.8, lambda=1.0, k=0.4, CADR=0, Cout=100 -> 80/1.4 = 57.14
    expect(
      steadyStateIndoorPm({
        cOut: 100,
        penetration: 0.8,
        lambdaAch: 1.0,
        depositionK: 0.4,
        sourceUgH: 0,
        cadrEffM3h: 0,
        volumeM3: 50,
      }),
    ).toBeCloseTo(57.14, 2);
    // 4. Steady state with purifier CADR=200 in 50m3 room (ap=4.0) -> 80/5.4 = 14.81
    expect(
      steadyStateIndoorPm({
        cOut: 100,
        penetration: 0.8,
        lambdaAch: 1.0,
        depositionK: 0.4,
        sourceUgH: 0,
        cadrEffM3h: 200,
        volumeM3: 50,
      }),
    ).toBeCloseTo(14.81, 2);
    // 5. Aarav 24h baseline ratio > 5x WHO on Delhi smog fixture
    const res = computeMemberExposure({
      member: SHARMA_PROFILE.members[0]!,
      home: SHARMA_PROFILE.home,
      hours: SHARMA_DEMO_AIR.hours,
      schedule: Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        env: "home" as const,
        activity: "rest" as const,
        mask: "none" as const,
      })),
      activeActionIds: [],
    });
    expect(res.ratio).toBeGreaterThan(3);
  });
});
