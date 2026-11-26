import { describe, expect, it } from "vitest";
import { computeFullPlan } from "@/engine/plan";
import { AirBundleSchema, HouseholdProfileSchema } from "@/engine/schema";
import { AHMEDABAD_DEMO_AIR, AHMEDABAD_PROFILE, resolveDemoInputs } from "@/lib/ahmedabad-fixture";
import { applyCalibrationAndSim } from "@/server/openmeteo";

describe("Ahmedabad demo & simulation", () => {
  it("validates Ahmedabad profile and 24-hour winter air bundle against Zod schemas", () => {
    const profile = HouseholdProfileSchema.parse(AHMEDABAD_PROFILE);
    const air = AirBundleSchema.parse(AHMEDABAD_DEMO_AIR);
    expect(profile.cityName).toContain("Ahmedabad");
    expect(profile.lat).toBeCloseTo(23.03, 2);
    expect(profile.lon).toBeCloseTo(72.59, 2);
    expect(air.source).toBe("demo-ahmedabad");
    expect(air.hours).toHaveLength(24);
  });

  it("resolves demo inputs for both ahmedabad and sharma", () => {
    const ahm = resolveDemoInputs("ahmedabad");
    expect(ahm.profile.id).toBe("ahmedabad");
    expect(ahm.air.source).toBe("demo-ahmedabad");

    const sha = resolveDemoInputs("sharma");
    expect(sha.profile.id).toBe("sharma");
    expect(sha.air.source).toBe("demo-sharma");
  });

  it("computes full plan and Shapley waterfall for every Patel family member in Ahmedabad", () => {
    const full = computeFullPlan(AHMEDABAD_PROFILE, AHMEDABAD_DEMO_AIR, "kavya");
    expect(full.factSheet.isDemo).toBe(true);
    expect(full.factSheet.cityName).toBe("Navrangpura, Ahmedabad");
    expect(full.windows.bestStartHour).toBeGreaterThanOrEqual(11);
    expect(full.windows.bestStartHour).toBeLessThanOrEqual(16);

    for (const member of AHMEDABAD_PROFILE.members) {
      const mPlan = full.memberPlans[member.id];
      expect(mPlan).toBeDefined();
      const wf = mPlan!.waterfall;
      const stepSum = wf.steps.reduce((acc, s) => acc + s.deltaRatio, 0);
      expect(wf.baselineRatio - wf.planRatio).toBeCloseTo(stepSum, 2);
      expect(wf.planRatio).toBeLessThan(wf.baselineRatio);
    }
  });

  it("scales Ahmedabad forecast cleanly in simulation mode", () => {
    const sim = applyCalibrationAndSim(AHMEDABAD_DEMO_AIR, undefined, 250);
    expect(sim.simulationTargetMean).toBe(250);
    const mean = sim.hours.reduce((s, h) => s + h.pm25, 0) / sim.hours.length;
    expect(mean).toBeCloseTo(250, 0);
  });
});
