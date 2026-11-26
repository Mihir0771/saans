import { describe, expect, it } from "vitest";
import type { FactSheet } from "@/engine/schema";
import { runNumberGuard, sanitizeUserText } from "@/server/guard";

const sampleFacts: FactSheet = {
  generatedAt: "2026-11-24T07:02:00+05:30",
  locale: "en",
  cityName: "Dwarka, Delhi",
  isDemo: true,
  isSimulation: false,
  calibrationScale: 1,
  aqiNow: {
    aqi: 342,
    band: "vpoor",
    shape: "pentagon",
    dominantPollutant: "PM2.5",
    subIndices: { "PM2.5": 342 },
    is24hOfficial: false,
  },
  trappedAirRisk: "high",
  safetyFlags: ["NO_OZONE_IONIZER"],
  facts: {
    dose_plan: { id: "dose_plan", value: 5.1, unit: "× WHO", display: "5.1×", confidence: "B" },
    dose_saved_pct: { id: "dose_saved_pct", value: 64, unit: "%", display: "64%", confidence: "B" },
    worst_window_start: {
      id: "worst_window_start",
      value: 8,
      unit: "hour",
      display: "8 am",
      confidence: "B",
    },
  },
};

describe("server/guard (number grounding + safety)", () => {
  it("substitutes valid {{fact:id}} slots and allows standard domain tokens like PM2.5 and N95", () => {
    const raw =
      "Air quality has high PM2.5 around {{fact:worst_window_start}}. Using an N95 and purifier brings dose to {{fact:dose_plan}} (saving {{fact:dose_saved_pct}}).";
    const res = runNumberGuard(raw, sampleFacts);
    expect(res.ok).toBe(true);
    expect(res.text).toContain("8 am");
    expect(res.text).toContain("5.1×");
    expect(res.text).toContain("64%");
    expect(res.slotsUsed).toEqual(["worst_window_start", "dose_plan", "dose_saved_pct"]);
  });

  it("rejects any raw invented numbers not coming from slots", () => {
    const raw = "A purifier will save 73% of your indoor PM2.5 today.";
    const res = runNumberGuard(raw, sampleFacts);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("UNSLOTTED_NUMBER");
  });

  it("rejects unknown {{fact:id}} slots", () => {
    const raw = "Your risk drops by {{fact:made_up_stat}}.";
    const res = runNumberGuard(raw, sampleFacts);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("UNKNOWN_SLOT");
  });

  it("blocks dangerous advice violating SPEC 6.5 (ozone generator, sealing with angeethi, mask <2y)", () => {
    expect(
      runNumberGuard("Buy an ozone generator purifier for your bedroom.", sampleFacts).ok,
    ).toBe(false);
    expect(
      runNumberGuard("Seal the room tightly while the angeethi is burning.", sampleFacts).ok,
    ).toBe(false);
    expect(runNumberGuard("Put an N95 mask on your 1-year-old baby.", sampleFacts).ok).toBe(false);
  });

  it("strips control characters and caps length on user text", () => {
    const cleaned = sanitizeUserText("Hello\u0000\u0007 world " + "x".repeat(600), 500);
    expect(cleaned.length).toBeLessThanOrEqual(500);
    expect(cleaned).not.toContain("\u0000");
  });
});
