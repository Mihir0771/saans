import type { ParamSpec } from "./params-inhalation";
import type { Confidence, LeakinessClass } from "./schema";

export type { ParamSpec } from "./params-inhalation";
export { INHALATION_RATE_M3H, WHO_PM25_24H_GUIDELINE } from "./params-inhalation";
export type { CommuteModeSpec } from "./params-commute";
export { COMMUTE_SPECS } from "./params-commute";

export const INDOOR_PENETRATION: ParamSpec = {
  value: 0.8,
  low: 0.6,
  high: 0.95,
  unit: "ratio",
  source: "Residential PM2.5 infiltration literature (Thatcher et al. / US EPA)",
  confidence: "A",
};

export const INDOOR_DEPOSITION_H: ParamSpec = {
  value: 0.39,
  low: 0.15,
  high: 0.7,
  unit: "h⁻¹",
  source: "Residential PM2.5 surface deposition range (0.1–0.8 h⁻¹)",
  confidence: "A",
};

export const LEAKINESS_AER_H: Record<LeakinessClass, ParamSpec> = {
  tight: {
    value: 0.3,
    low: 0.15,
    high: 0.5,
    unit: "h⁻¹",
    source: "Closed tight envelope AER",
    confidence: "B",
  },
  average: {
    value: 0.75,
    low: 0.45,
    high: 1.15,
    unit: "h⁻¹",
    source: "Average urban residential AER",
    confidence: "B",
  },
  leaky: {
    value: 1.4,
    low: 0.9,
    high: 2.0,
    unit: "h⁻¹",
    source: "Leaky residential envelope AER",
    confidence: "B",
  },
};

export const DOOR_SEAL_AER_FACTOR: ParamSpec = {
  value: 0.68,
  low: 0.55,
  high: 0.82,
  unit: "multiplier",
  source: "Weatherstripping / door-gap sealing heuristic reduction",
  confidence: "C",
};

export const WINDOW_EXTRA_ACH: Record<"ajar" | "open", ParamSpec> = {
  ajar: {
    value: 1.5,
    low: 1.0,
    high: 2.5,
    unit: "h⁻¹",
    source: "Single-sided ajar window ventilation heuristic",
    confidence: "C",
  },
  open: {
    value: 4.5,
    low: 2.5,
    high: 7.0,
    unit: "h⁻¹",
    source: "Open window natural ventilation range",
    confidence: "B",
  },
};

export const PURIFIER_MIXING_EFFICIENCY: ParamSpec = {
  value: 0.85,
  low: 0.7,
  high: 0.95,
  unit: "ratio",
  source: "Room air mixing efficiency factor",
  confidence: "B",
};

export const CR_BOX_CADR_M3H: ParamSpec = {
  value: 425,
  low: 255,
  high: 610,
  unit: "m³/h",
  source: "Corsi-Rosenthal 4× MERV-13 CADR range (150–360 CFM; PMC9828579 / Rutgers)",
  confidence: "A",
};

export const CR_BOX_COST_INR: ParamSpec = {
  value: 1800,
  low: 1500,
  high: 2400,
  unit: "₹",
  source: "Box fan + MERV-13 filter + tape local assembly estimate",
  confidence: "C",
};

export const INDOOR_SOURCE_UG_H = {
  lpg: {
    value: 1800,
    low: 900,
    high: 3600,
    unit: "µg/h",
    source: "LPG cooking aerosol range",
    confidence: "B" as Confidence,
  },
  induction: {
    value: 900,
    low: 400,
    high: 2000,
    unit: "µg/h",
    source: "Electric/induction cooking aerosol",
    confidence: "C" as Confidence,
  },
  biomass_chulha: {
    value: 28000,
    low: 15000,
    high: 50000,
    unit: "µg/h",
    source: "Indoor solid-fuel cooking emission",
    confidence: "B" as Confidence,
  },
  mixed: {
    value: 12000,
    low: 6000,
    high: 22000,
    unit: "µg/h",
    source: "Mixed LPG + biomass cooking",
    confidence: "C" as Confidence,
  },
  hoodCaptureFraction: {
    value: 0.65,
    low: 0.5,
    high: 0.8,
    unit: "ratio",
    source: "Vented kitchen hood capture efficiency",
    confidence: "B" as Confidence,
  },
  incense: {
    value: 22000,
    low: 12000,
    high: 35000,
    unit: "µg/h",
    source: "Incense/agarbatti burning rate",
    confidence: "B" as Confidence,
  },
  mosquitoCoil: {
    value: 18000,
    low: 10000,
    high: 30000,
    unit: "µg/h",
    source: "Mosquito coil smouldering emission",
    confidence: "B" as Confidence,
  },
  smoking: {
    value: 35000,
    low: 20000,
    high: 60000,
    unit: "µg/h",
    source: "Indoor cigarette smoke emission",
    confidence: "B" as Confidence,
  },
};

export const MASK_PROTECTION: Record<"none" | "cloth" | "surgical" | "n95", ParamSpec> = {
  none: { value: 0, low: 0, high: 0, unit: "fraction", source: "No mask", confidence: "A" },
  cloth: {
    value: 0.15,
    low: 0.1,
    high: 0.25,
    unit: "fraction",
    source: "Real-world cloth mask PM2.5 leakage studies",
    confidence: "B",
  },
  surgical: {
    value: 0.3,
    low: 0.2,
    high: 0.4,
    unit: "fraction",
    source: "Real-world surgical mask PM2.5 leakage studies",
    confidence: "B",
  },
  n95: {
    value: 0.8,
    low: 0.65,
    high: 0.9,
    unit: "fraction",
    source: "Real-world N95/FFP2 protection with fit factor",
    confidence: "A",
  },
};

export const SCHOOL_INDOOR_INFILTRATION: ParamSpec = {
  value: 0.72,
  low: 0.55,
  high: 0.9,
  unit: "ratio",
  source: "Typical unpurified classroom/office indoor-to-outdoor ratio",
  confidence: "C",
};
