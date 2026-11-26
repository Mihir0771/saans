const CFM_TO_M3H = 1.699;

export function cfmToM3h(cfm: number): number {
  if (!Number.isFinite(cfm) || cfm <= 0) return 0;
  return cfm * CFM_TO_M3H;
}

export function m3hToCfm(m3h: number): number {
  if (!Number.isFinite(m3h) || m3h <= 0) return 0;
  return m3h / CFM_TO_M3H;
}

export function ugm3ToMgm3(ugm3: number): number {
  if (!Number.isFinite(ugm3) || ugm3 <= 0) return 0;
  return ugm3 / 1000;
}

export function roundTo2Dp(value: number): number {
  return Math.round(value * 100) / 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roomVolumeM3(areaSqm: number, ceilingHeightM: number): number {
  return Math.max(areaSqm, 1) * Math.max(ceilingHeightM, 1.5);
}
