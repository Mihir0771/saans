import { computeAqiNowEquivalent } from "../aqi";
import { buildDefaultSchedule, computeMemberExposure } from "../exposure";
import type { AirHour, FamilyMember, HouseholdProfile } from "../schema";
import { ACTION_CATALOG, type ActionBucket, type ActionDefinition } from "./catalog";
import { evaluateSafetyRules } from "./rules";

export interface RankedAction extends ActionDefinition {
  deltaRatio: number;
  deltaUg: number;
  score: number;
}

export interface RankedActions {
  doNow: RankedAction[];
  thisWeek: RankedAction[];
  budgetAllows: RankedAction[];
  all: RankedAction[];
  blockedActionIds: string[];
}

function isActionRelevant(
  action: ActionDefinition,
  profile: HouseholdProfile,
  member: FamilyMember,
): boolean {
  if (action.id === "commute_metro" && member.commuteMode === "wfh") return false;
  if (action.id === "n95_commute" && member.ageBand === "toddler_0_1") return false;
  if (action.id === "stop_incense_coil") {
    return (
      profile.home.indoorSources.incenseDailyMin > 0 || profile.home.indoorSources.mosquitoCoilNight
    );
  }
  return true;
}

function scoreAction(deltaUg: number, action: ActionDefinition): number {
  const costFactor = 1 + action.costOneTimeInr / 1500;
  return Number((deltaUg / (costFactor * action.effort)).toFixed(2));
}

function bucketPick(all: RankedAction[], bucket: ActionBucket): RankedAction[] {
  return all.filter((a) => a.bucket === bucket).slice(0, 3);
}

/** Ranks eligible, safety-filtered household actions by dose reduction per rupee and effort. */
export function rankHouseholdActions(
  profile: HouseholdProfile,
  member: FamilyMember,
  hours: AirHour[],
): RankedActions {
  const firstHour = hours[0] ?? { isoTime: "", hourLocal: 0, pm25: 100, pm10: 150 };
  const aqiNow = computeAqiNowEquivalent(firstHour);
  const safety = evaluateSafetyRules(profile, aqiNow);
  const schedule = buildDefaultSchedule(member);
  const base = computeMemberExposure({
    member,
    home: profile.home,
    hours,
    schedule,
    activeActionIds: [],
  });

  const ranked: RankedAction[] = [];
  for (const def of ACTION_CATALOG) {
    if (safety.blockedActionIds.includes(def.id)) continue;
    if (!isActionRelevant(def, profile, member)) continue;

    const withAct = computeMemberExposure({
      member,
      home: profile.home,
      hours,
      schedule,
      activeActionIds: [def.id],
    });
    const deltaRatio = Number(Math.max(0, base.ratio - withAct.ratio).toFixed(3));
    const deltaUg = Number(Math.max(0, base.doseUg - withAct.doseUg).toFixed(2));
    ranked.push({ ...def, deltaRatio, deltaUg, score: scoreAction(deltaUg, def) });
  }

  ranked.sort((a, b) => b.score - a.score);
  return {
    doNow: bucketPick(ranked, "do_now"),
    thisWeek: bucketPick(ranked, "this_week"),
    budgetAllows: bucketPick(ranked, "budget_allows"),
    all: ranked,
    blockedActionIds: safety.blockedActionIds,
  };
}
