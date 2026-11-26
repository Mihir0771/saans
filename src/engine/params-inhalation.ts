import type { ActivityLevel, AgeBand, Confidence } from "./schema";

export interface ParamSpec {
  value: number;
  low: number;
  high: number;
  unit: string;
  source: string;
  confidence: Confidence;
}

export const WHO_PM25_24H_GUIDELINE: ParamSpec = {
  value: 15,
  low: 15,
  high: 15,
  unit: "µg/m³",
  source: "WHO Global Air Quality Guidelines (2021) — 24-hour mean PM2.5",
  confidence: "A",
};

const s = (
  value: number,
  low: number,
  high: number,
  source: string,
  confidence: Confidence,
): ParamSpec => ({ value, low, high, unit: "m³/h", source, confidence });

export const INHALATION_RATE_M3H: Record<AgeBand, Record<ActivityLevel, ParamSpec>> = {
  toddler_0_1: {
    sleep: s(0.15, 0.12, 0.2, "EPA EFH 2011 Ch.6 (scaled)", "B"),
    rest: s(0.2, 0.16, 0.26, "EPA EFH 2011 Ch.6 (scaled)", "B"),
    light: s(0.3, 0.24, 0.38, "EPA EFH 2011 Ch.6 (scaled)", "C"),
    moderate: s(0.45, 0.35, 0.58, "EPA EFH 2011 Ch.6 (scaled)", "C"),
    vigorous: s(0.65, 0.5, 0.85, "EPA EFH 2011 Ch.6 (scaled)", "C"),
  },
  child_2_5: {
    sleep: s(0.28, 0.22, 0.35, "EPA EFH 2011 Ch.6 (3-<6 yr)", "A"),
    rest: s(0.4, 0.32, 0.48, "EPA EFH 2011 Ch.6 (3-<6 yr)", "A"),
    light: s(0.5, 0.42, 0.62, "EPA EFH 2011 Ch.6 (3-<6 yr)", "A"),
    moderate: s(0.7, 0.58, 0.88, "EPA EFH 2011 Ch.6 (3-<6 yr)", "A"),
    vigorous: s(1.25, 0.95, 1.6, "EPA EFH 2011 Ch.6 (scaled)", "B"),
  },
  child_6_12: {
    sleep: s(0.34, 0.28, 0.42, "EPA EFH 2011 Ch.6 (6-<13 yr)", "A"),
    rest: s(0.5, 0.4, 0.6, "EPA EFH 2011 Ch.6 (6-<13 yr)", "A"),
    light: s(0.9, 0.8, 1.0, "EPA EFH 2011 Ch.6 (6-<13 yr)", "A"),
    moderate: s(1.7, 1.5, 2.0, "EPA EFH 2011 Ch.6 (6-<13 yr)", "A"),
    vigorous: s(2.6, 2.2, 3.2, "EPA EFH 2011 Ch.6 (6-<13 yr)", "A"),
  },
  teen_13_17: {
    sleep: s(0.38, 0.3, 0.46, "EPA EFH 2011 Ch.6 (11-<16 yr)", "A"),
    rest: s(0.5, 0.42, 0.6, "EPA EFH 2011 Ch.6 (11-<16 yr)", "A"),
    light: s(1.0, 0.85, 1.15, "EPA EFH 2011 Ch.6 (11-<16 yr)", "A"),
    moderate: s(1.65, 1.4, 1.95, "EPA EFH 2011 Ch.6 (11-<16 yr)", "A"),
    vigorous: s(2.75, 2.3, 3.2, "EPA EFH 2011 Ch.6 (11-<16 yr)", "A"),
  },
  adult_18_64: {
    sleep: s(0.4, 0.34, 0.48, "EPA EFH 2011 Ch.6 (adult)", "A"),
    rest: s(0.5, 0.42, 0.58, "EPA EFH 2011 Ch.6 (adult)", "A"),
    light: s(1.05, 0.9, 1.2, "EPA EFH 2011 Ch.6 (adult)", "A"),
    moderate: s(1.55, 1.35, 1.8, "EPA EFH 2011 Ch.6 (adult)", "A"),
    vigorous: s(2.8, 2.4, 3.2, "EPA EFH 2011 Ch.6 (adult)", "A"),
  },
  elder_65_plus: {
    sleep: s(0.36, 0.3, 0.44, "EPA EFH 2011 Ch.6 (65+ yr)", "A"),
    rest: s(0.45, 0.38, 0.54, "EPA EFH 2011 Ch.6 (65+ yr)", "A"),
    light: s(0.9, 0.78, 1.05, "EPA EFH 2011 Ch.6 (65+ yr)", "A"),
    moderate: s(1.35, 1.15, 1.6, "EPA EFH 2011 Ch.6 (65+ yr)", "B"),
    vigorous: s(2.2, 1.8, 2.6, "EPA EFH 2011 Ch.6 (65+ yr)", "B"),
  },
};
