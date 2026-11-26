import { computeAqiNowEquivalent } from "./aqi";
import { rankHouseholdActions, type RankedAction } from "./actions/rank";
import { evaluateSafetyRules, type SafetyFlag } from "./actions/rules";
import {
  compareCommutes,
  findBestDepartureShift,
  type CommuteComparison,
  type DepartureShiftResult,
} from "./commute";
import { buildDefaultSchedule, computeMemberExposure, type MemberDoseResult } from "./exposure";
import { buildFactSheet } from "./factsheet";
import { computeGrapStatus, type GrapStatus } from "./grap";
import type { AirBundle, CpcbAqiResult, FactSheet, HouseholdProfile } from "./schema";
import { computeShapleyWaterfall, type WaterfallAttribution } from "./waterfall";
import {
  computeTrappedAirRisk,
  findBestWorstWindows,
  findSmartVentilationWindow,
  type BestWorstWindows,
  type TrappedAirRisk,
  type VentilationWindowResult,
} from "./windows";

export interface MemberPlanResult {
  memberId: string;
  baseline: MemberDoseResult;
  plan: MemberDoseResult;
  waterfall: WaterfallAttribution;
  ranked: {
    doNow: RankedAction[];
    thisWeek: RankedAction[];
    budgetAllows: RankedAction[];
  };
  commutes: CommuteComparison[];
  departureShift: DepartureShiftResult;
  activeActionIds: string[];
  oneTimeCostInr: number;
  dailyCostInr: number;
}

export interface FullPlanResult {
  aqiNow: CpcbAqiResult;
  trappedAirRisk: TrappedAirRisk;
  windows: BestWorstWindows;
  ventilation: VentilationWindowResult;
  grap: GrapStatus | null;
  safetyFlags: SafetyFlag[];
  blockedActionIds: string[];
  memberPlans: Record<string, MemberPlanResult>;
  factSheet: FactSheet;
}

function sumCosts(rankedAll: RankedAction[], activeIds: string[]) {
  const chosen = rankedAll.filter((a) => activeIds.includes(a.id));
  return {
    oneTimeCostInr: chosen.reduce((s, a) => s + a.costOneTimeInr, 0),
    dailyCostInr: chosen.reduce((s, a) => s + a.costDailyInr, 0),
  };
}

function computeCommutesForMember(
  member: HouseholdProfile["members"][number],
  air: AirBundle,
  indoorCentral: number[],
) {
  const nowHour = air.hours[0];
  return {
    commutes: compareCommutes({
      ageBand: member.ageBand,
      distanceKm: member.commuteDistanceKm,
      departHour: member.commuteDepartHour,
      hours: air.hours,
      indoorPmAtHour: indoorCentral[nowHour?.hourLocal ?? 0],
    }),
    departureShift: findBestDepartureShift({
      ageBand: member.ageBand,
      mode: member.commuteMode,
      distanceKm: member.commuteDistanceKm,
      usualDepartHour: member.commuteDepartHour,
      hours: air.hours,
    }),
  };
}

export function computeMemberPlan(
  profile: HouseholdProfile,
  memberId: string,
  air: AirBundle,
  overrideActiveActionIds?: string[],
): MemberPlanResult {
  const member = profile.members.find((m) => m.id === memberId) ?? profile.members[0];
  if (!member) throw new Error("Household must contain at least one member");

  const ranked = rankHouseholdActions(profile, member, air.hours);
  const defaultIds = ranked.all.slice(0, 5).map((a) => a.id);
  const activeIds = (overrideActiveActionIds ?? defaultIds).filter(
    (id) => !ranked.blockedActionIds.includes(id),
  );
  const schedule = buildDefaultSchedule(member);
  const baseline = computeMemberExposure({
    member,
    home: profile.home,
    hours: air.hours,
    schedule,
    activeActionIds: [],
  });
  const plan = computeMemberExposure({
    member,
    home: profile.home,
    hours: air.hours,
    schedule,
    activeActionIds: activeIds,
  });

  return {
    memberId: member.id,
    baseline,
    plan,
    waterfall: computeShapleyWaterfall({
      member,
      home: profile.home,
      hours: air.hours,
      activeActionIds: activeIds,
    }),
    ranked: { doNow: ranked.doNow, thisWeek: ranked.thisWeek, budgetAllows: ranked.budgetAllows },
    ...computeCommutesForMember(member, air, plan.indoorCentral),
    activeActionIds: activeIds,
    ...sumCosts(ranked.all, activeIds),
  };
}

function buildPlanFacts(
  profile: HouseholdProfile,
  air: AirBundle,
  focusMemberName: string,
  focusPlan: MemberPlanResult,
  windows: BestWorstWindows,
  safetyFlags: SafetyFlag[],
  trappedAirRisk: TrappedAirRisk,
): FactSheet {
  const topStep = focusPlan.waterfall.steps[0];
  return buildFactSheet({
    cityName: air.cityName || profile.cityName,
    locale: profile.locale,
    isDemo: air.source === "demo-sharma" || air.source === "demo-ahmedabad",
    isSimulation: air.simulationTargetMean !== undefined,
    calibrationScale: air.calibrationScale,
    hours: air.hours,
    memberName: focusMemberName,
    baselineRatio: focusPlan.waterfall.baselineRatio,
    planRatio: focusPlan.waterfall.planRatio,
    doseSavedPct: focusPlan.waterfall.totalSavedPct,
    bestWindowStartHour: windows.bestStartHour,
    worstWindowStartHour: windows.worstStartHour,
    oneTimeCostInr: focusPlan.oneTimeCostInr,
    topActionSavingRatio: topStep ? topStep.deltaRatio : 0,
    safetyFlags,
    trappedAirRisk,
  });
}

export function computeFullPlan(
  profile: HouseholdProfile,
  air: AirBundle,
  focusMemberId?: string,
  overrideActiveActionIds?: string[],
): FullPlanResult {
  const nowHour = air.hours[0] ?? { isoTime: "", hourLocal: 0, pm25: 100, pm10: 150 };
  const aqiNow = computeAqiNowEquivalent(nowHour);
  const safety = evaluateSafetyRules(profile, aqiNow);
  const trappedAirRisk = computeTrappedAirRisk(nowHour);
  const windows = findBestWorstWindows(air.hours);
  const ventilation = findSmartVentilationWindow(profile.home, air.hours);
  const grap = computeGrapStatus(profile.lat, profile.lon, aqiNow.aqi);

  const memberPlans: Record<string, MemberPlanResult> = {};
  for (const m of profile.members) {
    memberPlans[m.id] = computeMemberPlan(
      profile,
      m.id,
      air,
      m.id === focusMemberId ? overrideActiveActionIds : undefined,
    );
  }
  const focusMember = profile.members.find((m) => m.id === focusMemberId) ?? profile.members[0];
  if (!focusMember) throw new Error("Household must contain at least one member");
  const focusPlan = memberPlans[focusMember.id];
  if (!focusPlan) throw new Error("Missing focus plan");

  return {
    aqiNow,
    trappedAirRisk,
    windows,
    ventilation,
    grap,
    safetyFlags: safety.flags,
    blockedActionIds: safety.blockedActionIds,
    memberPlans,
    factSheet: buildPlanFacts(
      profile,
      air,
      focusMember.name,
      focusPlan,
      windows,
      safety.flags,
      trappedAirRisk,
    ),
  };
}
