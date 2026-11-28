import { describe, expect, it } from "vitest";
import { computeFullPlan } from "@/engine/plan";
import { buildPlanIcs } from "@/lib/ics";
import { SHARMA_DEMO_AIR, SHARMA_PROFILE } from "@/lib/sharma-fixture";

describe("calendar .ics export", () => {
  it("rolls DTEND to the next calendar day when an event crosses midnight", () => {
    const plan = computeFullPlan(SHARMA_PROFILE, SHARMA_DEMO_AIR, "aarav");
    const mPlan = plan.memberPlans.aarav;
    expect(mPlan).toBeDefined();
    if (!mPlan) return;

    const ics = buildPlanIcs({
      memberName: "Aarav",
      cityName: "Delhi",
      plan: mPlan,
      windows: {
        bestStartHour: 23,
        bestEndHour: 1,
        bestMeanPm25: 90,
        worstStartHour: 22,
        worstEndHour: 0,
        worstMeanPm25: 250,
      },
      ventilation: {
        hasWindow: true,
        startHour: 14,
        durationMin: 20,
        estimatedDropPct: 18,
        reasonKey: "lab.vent_found",
      },
    });

    const starts = Array.from(ics.matchAll(/DTSTART:(\d{8}T\d{6})/g), (m) => m[1] ?? "");
    const ends = Array.from(ics.matchAll(/DTEND:(\d{8}T\d{6})/g), (m) => m[1] ?? "");
    expect(starts).toHaveLength(3);
    expect(ends).toHaveLength(3);
    for (let i = 0; i < starts.length; i += 1) {
      expect((ends[i] ?? "") > (starts[i] ?? "")).toBe(true);
    }
  });
});
