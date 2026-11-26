import type { ParamSpec } from "./params-inhalation";
import type { ActivityLevel, CommuteMode } from "./schema";

export interface CommuteModeSpec {
  pmMultiplier: ParamSpec;
  co2gPerPkm: ParamSpec;
  costInrPerKm: number;
  speedKmh: number;
  activity: ActivityLevel;
}

const pm = (v: number, l: number, h: number, src: string, c: "A" | "B" | "C"): ParamSpec => ({
  value: v,
  low: l,
  high: h,
  unit: "× ambient",
  source: src,
  confidence: c,
});
const co = (v: number, l: number, h: number, src: string, c: "A" | "B" | "C"): ParamSpec => ({
  value: v,
  low: l,
  high: h,
  unit: "g/pkm",
  source: src,
  confidence: c,
});

export const COMMUTE_SPECS: Record<CommuteMode, CommuteModeSpec> = {
  walk: {
    pmMultiplier: pm(1.25, 1.0, 1.5, "Urban roadside walking heuristic", "C"),
    co2gPerPkm: co(0, 0, 0, "Zero tailpipe/grid emissions", "A"),
    costInrPerKm: 0,
    speedKmh: 4.5,
    activity: "moderate",
  },
  cycle: {
    pmMultiplier: pm(1.3, 1.05, 1.6, "Urban roadside cycling heuristic", "C"),
    co2gPerPkm: co(0, 0, 0, "Zero tailpipe/grid emissions", "A"),
    costInrPerKm: 0,
    speedKmh: 14,
    activity: "vigorous",
  },
  two_wheeler: {
    pmMultiplier: pm(1.55, 1.2, 1.9, "In-traffic open two-wheeler plume exposure", "C"),
    co2gPerPkm: co(85, 70, 100, "India petrol two-wheeler LCA range", "B"),
    costInrPerKm: 3.5,
    speedKmh: 24,
    activity: "rest",
  },
  auto: {
    pmMultiplier: pm(1.5, 1.15, 1.85, "Open-sided auto-rickshaw in traffic", "C"),
    co2gPerPkm: co(75, 60, 90, "India CNG/LPG auto-rickshaw range", "B"),
    costInrPerKm: 12,
    speedKmh: 20,
    activity: "rest",
  },
  bus: {
    pmMultiplier: pm(1.15, 0.9, 1.4, "Non-AC urban bus enclosure factor", "C"),
    co2gPerPkm: co(95, 60, 120, "India urban CNG/electric bus range", "B"),
    costInrPerKm: 3,
    speedKmh: 18,
    activity: "rest",
  },
  metro: {
    pmMultiplier: pm(0.6, 0.45, 0.8, "Filtered/enclosed metro coach heuristic", "C"),
    co2gPerPkm: co(25, 15, 35, "Indian metro rail grid LCA range", "A"),
    costInrPerKm: 4,
    speedKmh: 32,
    activity: "rest",
  },
  car_open: {
    pmMultiplier: pm(1.45, 1.15, 1.8, "On-road car windows open", "C"),
    co2gPerPkm: co(145, 110, 180, "India private car low-occupancy range", "B"),
    costInrPerKm: 11,
    speedKmh: 22,
    activity: "rest",
  },
  car_ac: {
    pmMultiplier: pm(0.65, 0.45, 0.85, "Cabin AC recirculation mode", "B"),
    co2gPerPkm: co(155, 120, 195, "India private car with AC load", "B"),
    costInrPerKm: 12,
    speedKmh: 22,
    activity: "rest",
  },
  carpool: {
    pmMultiplier: pm(0.65, 0.45, 0.85, "Shared AC cabin recirculation", "B"),
    co2gPerPkm: co(55, 40, 75, "Shared 3-occupant carpool", "B"),
    costInrPerKm: 4.5,
    speedKmh: 22,
    activity: "rest",
  },
  wfh: {
    pmMultiplier: pm(0, 0, 0, "Uses indoor home concentration", "A"),
    co2gPerPkm: co(0, 0, 0, "No commute travel", "A"),
    costInrPerKm: 0,
    speedKmh: 0,
    activity: "rest",
  },
};
