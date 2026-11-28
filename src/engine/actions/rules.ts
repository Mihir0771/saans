import type { CpcbAqiResult, FamilyMember, HouseholdProfile } from "../schema";

export type SafetyFlag =
  | "NO_OZONE_IONIZER"
  | "NO_SEAL_WITH_COMBUSTION_CO_RISK"
  | "NO_MASK_UNDER_2"
  | "AVOID_VIGOROUS_OUTDOOR"
  | "CR_BOX_SUPERVISION_NOTE"
  | "NON_MEDICAL_ASTHMA_PLAN_NOTE";

export interface SafetyGateResult {
  flags: SafetyFlag[];
  blockedActionIds: string[];
  maskBlockedMemberIds: string[];
}

function hasSensitiveCondition(member: FamilyMember): boolean {
  const sensitiveAge =
    member.ageBand === "child_2_5" ||
    member.ageBand === "child_6_12" ||
    member.ageBand === "elder_65_plus";
  return sensitiveAge || member.conditions.some((c) => c !== "none");
}

function hasMedicalFlag(member: FamilyMember): boolean {
  return (
    member.conditions.includes("asthma") ||
    member.conditions.includes("copd") ||
    member.conditions.includes("heart")
  );
}

function collectMemberFlags(
  members: FamilyMember[],
  flags: SafetyFlag[],
  maskBlockedMemberIds: string[],
): void {
  let addedMedical = false;
  let addedUnder2 = false;
  for (const m of members) {
    if (m.ageBand === "toddler_0_1") {
      maskBlockedMemberIds.push(m.id);
      if (!addedUnder2) {
        flags.push("NO_MASK_UNDER_2");
        addedUnder2 = true;
      }
    }
    if (hasMedicalFlag(m) && !addedMedical) {
      flags.push("NON_MEDICAL_ASTHMA_PLAN_NOTE");
      addedMedical = true;
    }
  }
}

/**
 * Evaluates non-negotiable §6.5 safety rules (ozone/ionizer block, combustion sealing block,
 * under-2 mask block, vigorous outdoor caution, medical disclaimer) and returns blocked action IDs.
 */
export function evaluateSafetyRules(
  profile: HouseholdProfile,
  aqiNow: CpcbAqiResult,
): SafetyGateResult {
  const flags: SafetyFlag[] = ["NO_OZONE_IONIZER"];
  const blockedActionIds: string[] = ["ozone_ionizer"];
  const maskBlockedMemberIds: string[] = [];

  if (
    profile.home.indoorSources.unventedCombustion ||
    profile.home.cookingFuel === "biomass_chulha"
  ) {
    flags.push("NO_SEAL_WITH_COMBUSTION_CO_RISK");
    blockedActionIds.push("seal_gaps", "close_peak_windows");
  }

  collectMemberFlags(profile.members, flags, maskBlockedMemberIds);

  const anySensitive = profile.members.some(hasSensitiveCondition);
  if (aqiNow.aqi > 300 || (anySensitive && aqiNow.aqi > 200)) {
    flags.push("AVOID_VIGOROUS_OUTDOOR");
  }

  flags.push("CR_BOX_SUPERVISION_NOTE");
  return { flags, blockedActionIds, maskBlockedMemberIds };
}
