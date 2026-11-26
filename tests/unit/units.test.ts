import { describe, expect, it } from "vitest";
import { cfmToM3h, clamp, m3hToCfm, roomVolumeM3, roundTo2Dp, ugm3ToMgm3 } from "@/engine/units";

describe("engine/units", () => {
  it("converts CFM to m3/h and back accurately", () => {
    expect(cfmToM3h(100)).toBeCloseTo(169.9, 2);
    expect(m3hToCfm(169.9)).toBeCloseTo(100, 2);
    expect(cfmToM3h(-5)).toBe(0);
    expect(m3hToCfm(Number.NaN)).toBe(0);
  });

  it("converts CO ug/m3 to mg/m3", () => {
    expect(ugm3ToMgm3(1000)).toBe(1);
    expect(ugm3ToMgm3(2500)).toBe(2.5);
    expect(ugm3ToMgm3(-10)).toBe(0);
  });

  it("rounds coordinates to 2 decimal places", () => {
    expect(roundTo2Dp(28.6139)).toBe(28.61);
    expect(roundTo2Dp(77.209)).toBe(77.21);
  });

  it("clamps numbers and computes safe room volume", () => {
    expect(clamp(5, 0.5, 4)).toBe(4);
    expect(clamp(0.1, 0.5, 4)).toBe(0.5);
    expect(roomVolumeM3(14, 3)).toBe(42);
    expect(roomVolumeM3(0, 1)).toBe(1.5);
  });
});
