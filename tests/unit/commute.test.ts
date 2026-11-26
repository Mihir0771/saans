import { describe, expect, it } from "vitest";
import { compareCommutes, findBestDepartureShift } from "@/engine/commute";
import type { AirHour } from "@/engine/schema";

const hours: AirHour[] = Array.from({ length: 24 }, (_, h) => ({
  isoTime: `2026-11-24T${String(h).padStart(2, "0")}:00`,
  hourLocal: h,
  pm25: h === 8 ? 220 : h === 10 ? 110 : 160,
  pm10: 250,
}));

describe("engine/commute", () => {
  it("compares commute modes across exposure, CO2e, cost, and duration", () => {
    const rows = compareCommutes({
      ageBand: "adult_18_64",
      distanceKm: 10,
      departHour: 8,
      hours,
    });
    const metro = rows.find((r) => r.mode === "metro");
    const auto = rows.find((r) => r.mode === "auto");
    const car = rows.find((r) => r.mode === "car_ac");
    expect(metro && auto && car).toBeTruthy();
    expect(metro!.doseUg).toBeLessThan(auto!.doseUg);
    expect(metro!.co2g).toBeLessThan(car!.co2g);
  });

  it("finds lowest-dose departure shift within +/- 2 hours", () => {
    const best = findBestDepartureShift({
      ageBand: "child_6_12",
      mode: "auto",
      distanceKm: 6,
      usualDepartHour: 8,
      hours,
    });
    expect(best.bestHour).toBe(10);
    expect(best.bestDoseUg).toBeLessThan(best.usualDoseUg);
  });
});
