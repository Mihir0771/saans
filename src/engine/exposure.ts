import { simulateIndoor24h } from "./indoor";
import {
  COMMUTE_SPECS,
  CR_BOX_CADR_M3H,
  INHALATION_RATE_M3H,
  MASK_PROTECTION,
  SCHOOL_INDOOR_INFILTRATION,
  WHO_PM25_24H_GUIDELINE,
} from "./params";
import type {
  ActivityLevel,
  AirHour,
  CommuteMode,
  FamilyMember,
  HomeProfile,
  WindowState,
} from "./schema";

export type MicroEnv = "home" | "school_work" | "outdoor" | "transit";

export interface HourlySlot {
  hour: number;
  env: MicroEnv;
  activity: ActivityLevel;
  mask: "none" | "cloth" | "surgical" | "n95";
}

export interface ExposureInput {
  member: FamilyMember;
  home: HomeProfile;
  hours: AirHour[];
  schedule: HourlySlot[];
  activeActionIds: string[];
}

export interface MemberDoseResult {
  doseUg: number;
  budgetUg: number;
  ratio: number;
  hourlyCumulative: number[];
  indoorCentral: number[];
  indoorLow: number[];
  indoorHigh: number[];
}

function isCommuteHour(member: FamilyMember, hour: number): boolean {
  const returnHour = (member.commuteDepartHour + 7) % 24;
  return hour === member.commuteDepartHour || hour === returnHour;
}

function schoolOrWorkSlot(member: FamilyMember, hour: number): HourlySlot | null {
  const inSchoolOrWork = member.persona === "school_child" || member.persona === "office_worker";
  if (!inSchoolOrWork || hour < 9 || hour > 15) return null;
  const act = member.persona === "school_child" && hour === 11 ? "moderate" : "light";
  return { hour, env: "school_work", activity: act, mask: "none" };
}

function outdoorPlaySlot(member: FamilyMember, hour: number): HourlySlot | null {
  const canPlayOut = member.ageBand !== "toddler_0_1" && member.ageBand !== "elder_65_plus";
  if (hour === 17 && canPlayOut)
    return { hour, env: "outdoor", activity: "moderate", mask: "none" };
  return null;
}

function defaultHourSlot(member: FamilyMember, hour: number): HourlySlot {
  if (hour >= 22 || hour < 6) return { hour, env: "home", activity: "sleep", mask: "none" };
  if (member.outdoorWorker && hour >= 9 && hour <= 17) {
    return { hour, env: "outdoor", activity: "moderate", mask: "none" };
  }
  if (isCommuteHour(member, hour)) {
    return member.commuteMode === "wfh"
      ? { hour, env: "home", activity: "light", mask: "none" }
      : {
          hour,
          env: "transit",
          activity: COMMUTE_SPECS[member.commuteMode].activity,
          mask: "none",
        };
  }
  return (
    schoolOrWorkSlot(member, hour) ??
    outdoorPlaySlot(member, hour) ?? { hour, env: "home", activity: "light", mask: "none" }
  );
}

export function buildDefaultSchedule(member: FamilyMember): HourlySlot[] {
  return Array.from({ length: 24 }, (_, hour) => defaultHourSlot(member, hour));
}

function buildPurifierState(
  purifier: HomeProfile["purifier"],
  actions: string[],
): HomeProfile["purifier"] {
  const hasCr = actions.includes("cr_box");
  const hasHepa = actions.includes("hepa_purifier");
  const enabled = purifier.enabled || hasCr || hasHepa;
  let cadr = purifier.cadrM3h;
  if (hasCr) cadr = Math.max(cadr, CR_BOX_CADR_M3H.value);
  if (hasHepa) cadr = Math.max(cadr, 380);
  return {
    ...purifier,
    enabled,
    cadrM3h: cadr,
    hoursPerDay: enabled ? 24 : purifier.hoursPerDay,
    isCrBox: purifier.isCrBox || hasCr,
  };
}

function buildSimHome(home: HomeProfile, actions: string[]): HomeProfile {
  const stopSmoke = actions.includes("stop_incense_coil");
  return {
    ...home,
    sealDoorGaps: home.sealDoorGaps || actions.includes("seal_gaps"),
    hasExhaustHood: home.hasExhaustHood || actions.includes("cook_hood_shift"),
    indoorSources: {
      ...home.indoorSources,
      incenseDailyMin: stopSmoke ? 0 : home.indoorSources.incenseDailyMin,
      mosquitoCoilNight: stopSmoke ? false : home.indoorSources.mosquitoCoilNight,
    },
    purifier: buildPurifierState(home.purifier, actions),
  };
}

function adaptSlot(slot: HourlySlot, actions: string[], allowMask: boolean): HourlySlot {
  let next = { ...slot };
  if (
    actions.includes("shift_outdoor_timing") &&
    slot.env === "outdoor" &&
    slot.activity === "moderate"
  ) {
    next = { ...next, activity: "light", env: "home" };
  }
  if (
    actions.includes("n95_commute") &&
    allowMask &&
    (slot.env === "transit" || slot.env === "outdoor")
  ) {
    next = { ...next, mask: "n95" };
  }
  return next;
}

function applyActionsToSim(
  home: HomeProfile,
  member: FamilyMember,
  schedule: HourlySlot[],
  actions: string[],
) {
  const closePeak = actions.includes("close_peak_windows");
  const windowStates: WindowState[] = Array.from({ length: 24 }, (_, h) => {
    if (closePeak) return h === 13 ? "ajar" : "closed";
    return h >= 7 && h <= 19 ? "ajar" : "closed";
  });
  const cookingHours = actions.includes("cook_hood_shift") ? [13, 19] : [8, 20];
  const commuteMode: CommuteMode =
    actions.includes("commute_metro") && member.commuteMode !== "wfh"
      ? "metro"
      : member.commuteMode;
  const allowMask = member.ageBand !== "toddler_0_1";

  return {
    simHome: buildSimHome(home, actions),
    windowStates,
    cookingHours,
    commuteMode,
    slots: schedule.map((slot) => adaptSlot(slot, actions, allowMask)),
  };
}

function slotConc(
  slot: HourlySlot,
  hourAir: AirHour,
  indoorPm: number,
  commuteMode: CommuteMode,
): number {
  if (slot.env === "home") return indoorPm;
  if (slot.env === "school_work") return hourAir.pm25 * SCHOOL_INDOOR_INFILTRATION.value;
  if (slot.env === "transit") return hourAir.pm25 * COMMUTE_SPECS[commuteMode].pmMultiplier.value;
  return hourAir.pm25;
}

/** Integrates a member's 24-hour inhaled PM2.5 dose (µg and × WHO guideline multiple). */
export function computeMemberExposure(input: ExposureInput): MemberDoseResult {
  const adapted = applyActionsToSim(
    input.home,
    input.member,
    input.schedule,
    input.activeActionIds,
  );
  const indoor = simulateIndoor24h({
    home: adapted.simHome,
    outdoorPm25: input.hours.map((h) => h.pm25),
    windowStates: adapted.windowStates,
    cookingHours: adapted.cookingHours,
  });

  let doseUg = 0;
  let budgetUg = 0;
  const hourlyDoses: number[] = [];

  for (let h = 0; h < 24; h += 1) {
    const slot = adapted.slots[h] ?? { hour: h, env: "home", activity: "rest", mask: "none" };
    const air = input.hours[h] ?? { isoTime: "", hourLocal: h, pm25: 0, pm10: 0 };
    const br = INHALATION_RATE_M3H[input.member.ageBand][slot.activity].value;
    const conc = slotConc(slot, air, indoor.central[h] ?? 0, adapted.commuteMode);
    const hDose = br * conc * (1 - MASK_PROTECTION[slot.mask].value);
    doseUg += hDose;
    budgetUg += br * WHO_PM25_24H_GUIDELINE.value;
    hourlyDoses.push(hDose);
  }

  const safeBudget = Math.max(budgetUg, 1e-6);
  let running = 0;
  const hourlyCumulative = [0];
  for (const d of hourlyDoses) {
    running += d;
    hourlyCumulative.push(Number((running / safeBudget).toFixed(3)));
  }

  return {
    doseUg: Number(doseUg.toFixed(2)),
    budgetUg: Number(budgetUg.toFixed(2)),
    ratio: Number((doseUg / safeBudget).toFixed(6)),
    hourlyCumulative,
    indoorCentral: indoor.central,
    indoorLow: indoor.low,
    indoorHigh: indoor.high,
  };
}

export function roughCigaretteEquivalent(doseUg: number): number {
  if (!Number.isFinite(doseUg) || doseUg <= 0) return 0;
  return Number((doseUg / 317).toFixed(1));
}
