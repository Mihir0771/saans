import { buildDefaultSchedule, computeMemberExposure, type MemberDoseResult } from "./exposure";
import type { AirHour, FamilyMember, HomeProfile } from "./schema";

export interface WaterfallStep {
  actionId: string;
  deltaRatio: number;
  deltaUg: number;
}

export interface WaterfallAttribution {
  baselineRatio: number;
  planRatio: number;
  baselineUg: number;
  planUg: number;
  totalSavedPct: number;
  steps: WaterfallStep[];
}

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i += 1) r *= i;
  return r;
}

function countBits(mask: number, n: number): number {
  let count = 0;
  for (let b = 0; b < n; b += 1) {
    if ((mask & (1 << b)) !== 0) count += 1;
  }
  return count;
}

function marginalShapleyStep(
  actionId: string,
  index: number,
  n: number,
  nFact: number,
  getVal: (mask: number) => MemberDoseResult,
): WaterfallStep {
  let shapleyRatio = 0;
  let shapleyUg = 0;
  for (let mask = 0; mask < 1 << n; mask += 1) {
    if ((mask & (1 << index)) !== 0) continue;
    const sSize = countBits(mask, n);
    const weight = (factorial(sSize) * factorial(n - sSize - 1)) / nFact;
    const withoutI = getVal(mask);
    const withI = getVal(mask | (1 << index));
    shapleyRatio += weight * (withoutI.ratio - withI.ratio);
    shapleyUg += weight * (withoutI.doseUg - withI.doseUg);
  }
  return {
    actionId,
    deltaRatio: Number(shapleyRatio.toFixed(6)),
    deltaUg: Number(shapleyUg.toFixed(2)),
  };
}

/**
 * Computes exact Shapley marginal attributions across up to 6 active interventions
 * so per-action dose savings sum strictly to `(baselineRatio - planRatio)`.
 */
export function computeShapleyWaterfall(input: {
  member: FamilyMember;
  home: HomeProfile;
  hours: AirHour[];
  activeActionIds: string[];
}): WaterfallAttribution {
  const unique = Array.from(new Set(input.activeActionIds)).slice(0, 6);
  const schedule = buildDefaultSchedule(input.member);
  const cache = new Map<number, MemberDoseResult>();
  const getVal = (mask: number): MemberDoseResult => {
    const hit = cache.get(mask);
    if (hit) return hit;
    const picked = unique.filter((_, idx) => (mask & (1 << idx)) !== 0);
    const res = computeMemberExposure({
      member: input.member,
      home: input.home,
      hours: input.hours,
      schedule,
      activeActionIds: picked,
    });
    cache.set(mask, res);
    return res;
  };

  const n = unique.length;
  const base = getVal(0);
  const full = getVal((1 << n) - 1);
  const nFact = factorial(n);
  const steps = unique.map((id, i) => marginalShapleyStep(id, i, n, nFact, getVal));
  const savedPct = base.ratio > 0 ? Math.round(((base.ratio - full.ratio) / base.ratio) * 100) : 0;

  return {
    baselineRatio: base.ratio,
    planRatio: full.ratio,
    baselineUg: base.doseUg,
    planUg: full.doseUg,
    totalSavedPct: savedPct,
    steps,
  };
}
