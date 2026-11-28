import { simulateIndoor24h } from "./indoor";
import type { AirHour, HomeProfile, WindowState } from "./schema";

export type TrappedAirRisk = "low" | "moderate" | "high";

export interface BestWorstWindows {
  bestStartHour: number;
  bestEndHour: number;
  bestMeanPm25: number;
  worstStartHour: number;
  worstEndHour: number;
  worstMeanPm25: number;
}

export interface VentilationWindowResult {
  hasWindow: boolean;
  startHour?: number;
  durationMin: number;
  estimatedDropPct: number;
  reasonKey: string;
}

function scoreWind(wind: number): number {
  if (wind < 1.5) return 2;
  return wind < 2.5 ? 1 : 0;
}

function scoreBlh(blh: number): number {
  if (blh < 250) return 2;
  return blh < 450 ? 1 : 0;
}

export function computeTrappedAirRisk(hour: AirHour): TrappedAirRisk {
  const score =
    scoreWind(hour.windMs ?? 2.5) + scoreBlh(hour.blhM ?? 500) + ((hour.tempC ?? 20) < 14 ? 1 : 0);
  if (score >= 4) return "high";
  return score >= 2 ? "moderate" : "low";
}

export function findBestWorstWindows(hours: AirHour[]): BestWorstWindows {
  let bestStart = 0;
  let bestMean = Number.POSITIVE_INFINITY;
  let worstStart = 0;
  let worstMean = -1;

  for (let h = 0; h < 23; h += 1) {
    const m = ((hours[h]?.pm25 ?? 0) + (hours[h + 1]?.pm25 ?? 0)) / 2;
    if (m < bestMean) {
      bestMean = m;
      bestStart = h;
    }
    if (m > worstMean) {
      worstMean = m;
      worstStart = h;
    }
  }

  return {
    bestStartHour: bestStart,
    bestEndHour: (bestStart + 2) % 24,
    bestMeanPm25: Math.round(bestMean),
    worstStartHour: worstStart,
    worstEndHour: (worstStart + 2) % 24,
    worstMeanPm25: Math.round(worstMean),
  };
}

function sumArray(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0);
}

/**
 * Identifies the cleanest candidate 20-minute window (08:00–18:00) where opening windows
 * reduces cumulative indoor PM2.5 mass compared to staying sealed.
 */
export function findSmartVentilationWindow(
  home: HomeProfile,
  hours: AirHour[],
): VentilationWindowResult {
  const outdoorPm25 = hours.slice(0, 24).map((h) => h.pm25);
  const closed: WindowState[] = Array.from({ length: 24 }, () => "closed");
  const baseSim = simulateIndoor24h({
    home,
    outdoorPm25,
    windowStates: closed,
    cookingHours: [8, 12, 20],
  });
  const baseSum = sumArray(baseSim.central);

  let bestHour = -1;
  let bestSum = baseSum;

  for (let h = 8; h <= 18; h += 1) {
    const startIndoor = baseSim.central[Math.max(0, h - 1)] ?? 0;
    if ((outdoorPm25[h] ?? 999) >= startIndoor) continue;
    // 20-minute open-window purge ≈ ajar ACH averaged over the 1-hour step
    const candidate = closed.map((w, idx) => (idx === h ? ("ajar" as const) : w));
    const sim = simulateIndoor24h({
      home,
      outdoorPm25,
      windowStates: candidate,
      cookingHours: [8, 12, 20],
    });
    const s = sumArray(sim.central);
    if (s < bestSum - 0.5) {
      bestSum = s;
      bestHour = h;
    }
  }

  if (bestHour < 0 || baseSum <= 0) {
    return { hasWindow: false, durationMin: 0, estimatedDropPct: 0, reasonKey: "lab.vent_none" };
  }
  const dropPct = Math.max(1, Math.round(((baseSum - bestSum) / baseSum) * 100));
  return {
    hasWindow: true,
    startHour: bestHour,
    durationMin: 20,
    estimatedDropPct: dropPct,
    reasonKey: "lab.vent_found",
  };
}
