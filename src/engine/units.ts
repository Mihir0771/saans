const CFM_TO_M3H = 1.699;

/** Converts cubic feet per minute (CFM) to cubic meters per hour (m³/h). */
export function cfmToM3h(cfm: number): number {
  if (!Number.isFinite(cfm) || cfm <= 0) return 0;
  return cfm * CFM_TO_M3H;
}

/** Converts cubic meters per hour (m³/h) to cubic feet per minute (CFM). */
export function m3hToCfm(m3h: number): number {
  if (!Number.isFinite(m3h) || m3h <= 0) return 0;
  return m3h / CFM_TO_M3H;
}

/** Converts micrograms per cubic meter (µg/m³) to milligrams per cubic meter (mg/m³). */
export function ugm3ToMgm3(ugm3: number): number {
  if (!Number.isFinite(ugm3) || ugm3 <= 0) return 0;
  return ugm3 / 1000;
}

/** Rounds a number to 2 decimal places (used to coarsen coordinates before server calls). */
export function roundTo2Dp(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Clamps `value` inclusively to `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Computes enclosed indoor room volume in cubic meters with safe lower bounds. */
export function roomVolumeM3(areaSqm: number, ceilingHeightM: number): number {
  return Math.max(areaSqm, 1) * Math.max(ceilingHeightM, 1.5);
}
