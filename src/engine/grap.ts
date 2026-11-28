export type GrapStage = "I" | "II" | "III" | "IV";

export interface GrapStatus {
  stage: GrapStage;
  aqiBandLabel: string;
  indicativeNoteKey: string;
  caqmUrl: string;
}

/** Returns true when `(lat, lon)` falls inside the Delhi-NCR bounding box. */
export function isDelhiNcr(lat: number, lon: number): boolean {
  return lat >= 28.2 && lat <= 28.95 && lon >= 76.75 && lon <= 77.65;
}

/**
 * Maps current AQI to an indicative Delhi-NCR GRAP stage (`null` outside NCR or when AQI <= 200).
 */
export function computeGrapStatus(lat: number, lon: number, aqi: number): GrapStatus | null {
  if (!isDelhiNcr(lat, lon) || aqi <= 200) return null;

  let stage: GrapStage = "I";
  let aqiBandLabel = "201–300";
  if (aqi > 450) {
    stage = "IV";
    aqiBandLabel = "> 450";
  } else if (aqi > 400) {
    stage = "III";
    aqiBandLabel = "401–450";
  } else if (aqi > 300) {
    stage = "II";
    aqiBandLabel = "301–400";
  }

  return {
    stage,
    aqiBandLabel,
    indicativeNoteKey: "today.grap_indicative_note",
    caqmUrl: "https://caqm.nic.in/",
  };
}
