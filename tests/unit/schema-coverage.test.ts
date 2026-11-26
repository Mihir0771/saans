import { describe, expect, it } from "vitest";
import { AirBundleSchema, HouseholdProfileSchema } from "@/engine/schema";
import { SHARMA_DEMO_AIR, SHARMA_PROFILE } from "@/lib/sharma-fixture";

describe("engine/schema Zod boundaries", () => {
  it("accepts valid Sharma profile and demo air bundle", () => {
    expect(HouseholdProfileSchema.parse(SHARMA_PROFILE).id).toBe("sharma");
    expect(AirBundleSchema.parse(SHARMA_DEMO_AIR).hours).toHaveLength(24);
  });

  it("rejects out-of-range latitude or invalid calibration scale", () => {
    expect(() => HouseholdProfileSchema.parse({ ...SHARMA_PROFILE, lat: 150 })).toThrow();
    expect(() => AirBundleSchema.parse({ ...SHARMA_DEMO_AIR, calibrationScale: 99 })).toThrow();
  });
});
