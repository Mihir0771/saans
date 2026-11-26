import { describe, expect, it } from "vitest";
import {
  sceneAtTime,
  sceneCaption,
  sceneStartTime,
  sceneTitle,
  TOTAL_WALKTHROUGH_SEC,
  WALKTHROUGH_SCENES,
} from "@/lib/walkthrough-scenes";

describe("60 FPS walkthrough scenes", () => {
  it("covers all 6 core chapters and computes exact chapter timings", () => {
    expect(WALKTHROUGH_SCENES).toHaveLength(6);
    expect(TOTAL_WALKTHROUGH_SEC).toBe(48);
    expect(sceneStartTime(0)).toBe(0);
    expect(sceneStartTime(2)).toBe(16);

    const mid = sceneAtTime(10);
    expect(mid.index).toBe(1);
    expect(mid.scene.id).toBe("plan");
    expect(sceneTitle(mid.scene, "en")).toContain("Plan");
    expect(sceneCaption(mid.scene, "hi").length).toBeGreaterThan(20);
  });
});
