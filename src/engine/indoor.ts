import {
  DOOR_SEAL_AER_FACTOR,
  INDOOR_DEPOSITION_H,
  INDOOR_PENETRATION,
  INDOOR_SOURCE_UG_H,
  LEAKINESS_AER_H,
  PURIFIER_MIXING_EFFICIENCY,
  WINDOW_EXTRA_ACH,
} from "./params";
import type { HomeProfile, WindowState } from "./schema";
import { clamp, roomVolumeM3 } from "./units";

export interface SteadyStateInput {
  cOut: number;
  penetration: number;
  lambdaAch: number;
  depositionK: number;
  sourceUgH: number;
  cadrEffM3h: number;
  volumeM3: number;
}

export interface IndoorSimInput {
  home: HomeProfile;
  outdoorPm25: number[];
  windowStates: WindowState[];
  cookingHours: number[];
  purifierHours?: boolean[];
}

export interface IndoorTrajectory {
  low: number[];
  central: number[];
  high: number[];
}

type BoundCase = "low" | "central" | "high";

export function steadyStateIndoorPm(input: SteadyStateInput): number {
  const aPurifier = input.cadrEffM3h / Math.max(input.volumeM3, 1);
  const denom = Math.max(input.lambdaAch + input.depositionK + aPurifier, 1e-6);
  const num =
    input.penetration * input.lambdaAch * input.cOut +
    input.sourceUgH / Math.max(input.volumeM3, 1);
  return Math.max(0, num / denom);
}

function pickBound(spec: { value: number; low: number; high: number }, mode: BoundCase): number {
  if (mode === "low") return spec.low;
  if (mode === "high") return spec.high;
  return spec.value;
}

function filterDerateFactor(ageMonths: number, isCrBox: boolean): number {
  const clampedAge = clamp(ageMonths, 0, 48);
  const decayPerMonth = isCrBox ? 0.032 : 0.015;
  return clamp(1 - clampedAge * decayPerMonth, 0.55, 1);
}

function resolveLambda(home: HomeProfile, win: WindowState, mode: BoundCase): number {
  const base = pickBound(LEAKINESS_AER_H[home.leakiness], mode);
  const sealed = home.sealDoorGaps ? base * pickBound(DOOR_SEAL_AER_FACTOR, mode) : base;
  if (win === "ajar") return sealed + pickBound(WINDOW_EXTRA_ACH.ajar, mode);
  if (win === "open") return sealed + pickBound(WINDOW_EXTRA_ACH.open, mode);
  return sealed;
}

function cookingSourceUgH(
  home: HomeProfile,
  hour: number,
  cookingHours: number[],
  mode: BoundCase,
): number {
  if (!cookingHours.includes(hour)) return 0;
  const cookRate = pickBound(INDOOR_SOURCE_UG_H[home.cookingFuel], mode);
  const hoodMult = home.hasExhaustHood
    ? 1 - pickBound(INDOOR_SOURCE_UG_H.hoodCaptureFraction, mode)
    : 1;
  return cookRate * hoodMult;
}

function extraCombustionSourceUgH(home: HomeProfile, hour: number, mode: BoundCase): number {
  let source = 0;
  if (home.indoorSources.mosquitoCoilNight && (hour >= 22 || hour < 6)) {
    source += pickBound(INDOOR_SOURCE_UG_H.mosquitoCoil, mode);
  }
  if (home.indoorSources.smokingIndoors && (hour === 9 || hour === 20)) {
    source += pickBound(INDOOR_SOURCE_UG_H.smoking, mode);
  }
  return source;
}

function resolveHourlySource(
  home: HomeProfile,
  hour: number,
  cookingHours: number[],
  mode: BoundCase,
): number {
  let source =
    cookingSourceUgH(home, hour, cookingHours, mode) + extraCombustionSourceUgH(home, hour, mode);
  if (home.indoorSources.incenseDailyMin > 0 && hour === 7) {
    source +=
      pickBound(INDOOR_SOURCE_UG_H.incense, mode) *
      clamp(home.indoorSources.incenseDailyMin / 60, 0, 2);
  }
  return source;
}

function stepRoomHour(cStart: number, input: SteadyStateInput): number {
  const subSteps = 10;
  const dt = 1 / subSteps;
  const aP = input.cadrEffM3h / Math.max(input.volumeM3, 1);
  const lossRate = Math.max(input.lambdaAch + input.depositionK + aP, 1e-6);
  const cSs = steadyStateIndoorPm(input);
  let c = cStart;
  const decay = Math.exp(-lossRate * dt);
  for (let s = 0; s < subSteps; s += 1) {
    c = cSs + (c - cSs) * decay;
  }
  return Math.max(0, c);
}

function spinUpRoom(
  sim: IndoorSimInput,
  paramCase: BoundCase,
  p: number,
  k: number,
  fullCadr: number,
  vol: number,
): number {
  const c0 = sim.outdoorPm25[0] ?? 0;
  let c = Math.max(0, c0 * p * 0.65);
  const spinLambda = resolveLambda(sim.home, sim.windowStates[0] ?? "closed", paramCase);
  for (let s = 0; s < 12; s += 1) {
    c = stepRoomHour(c, {
      cOut: c0,
      penetration: p,
      lambdaAch: spinLambda,
      depositionK: k,
      sourceUgH: 0,
      cadrEffM3h: fullCadr,
      volumeM3: vol,
    });
  }
  return c;
}

function isPurifierOnAt(sim: IndoorSimInput, hour: number): boolean {
  return sim.purifierHours
    ? Boolean(sim.purifierHours[hour])
    : hour < sim.home.purifier.hoursPerDay;
}

function runBoundTrajectory(
  sim: IndoorSimInput,
  paramCase: BoundCase,
  pmCase: BoundCase,
): number[] {
  const vol = roomVolumeM3(sim.home.areaSqm, sim.home.ceilingHeightM);
  const p = pickBound(INDOOR_PENETRATION, pmCase);
  const k = pickBound(INDOOR_DEPOSITION_H, paramCase);
  const mix = pickBound(PURIFIER_MIXING_EFFICIENCY, paramCase);
  const derate = filterDerateFactor(sim.home.purifier.filterAgeMonths, sim.home.purifier.isCrBox);
  const fullCadr = sim.home.purifier.enabled ? sim.home.purifier.cadrM3h * mix * derate : 0;
  let c = spinUpRoom(sim, paramCase, p, k, fullCadr, vol);

  const out: number[] = [];
  for (let h = 0; h < 24; h += 1) {
    c = stepRoomHour(c, {
      cOut: sim.outdoorPm25[h] ?? 0,
      penetration: p,
      lambdaAch: resolveLambda(sim.home, sim.windowStates[h] ?? "closed", paramCase),
      depositionK: k,
      sourceUgH: resolveHourlySource(sim.home, h, sim.cookingHours, pmCase),
      cadrEffM3h: isPurifierOnAt(sim, h) ? fullCadr : 0,
      volumeM3: vol,
    });
    out.push(Number(c.toFixed(2)));
  }
  return out;
}

export function simulateIndoor24h(sim: IndoorSimInput): IndoorTrajectory {
  const central = runBoundTrajectory(sim, "central", "central");
  const boundA = runBoundTrajectory(sim, "high", "low");
  const boundB = runBoundTrajectory(sim, "low", "high");
  const low = central.map((c, i) => Math.min(c, boundA[i] ?? c, boundB[i] ?? c));
  const high = central.map((c, i) => Math.max(c, boundA[i] ?? c, boundB[i] ?? c));
  return { low, central, high };
}
