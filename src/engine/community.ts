import { computeAqiNowEquivalent } from "./aqi";
import type { AirHour, Locale } from "./schema";

export type OrgType = "school" | "rwa" | "office";
export type GoNoGo = "go" | "limit" | "avoid";

export interface CommunityInput {
  orgType: OrgType;
  orgName: string;
  headcount: number;
  hours: AirHour[];
}

export interface HourlyActivityDecision {
  hour: number;
  pm25: number;
  aqi: number;
  status: GoNoGo;
}

export interface CommunityActionItem {
  id: string;
  evidenceTier: "high" | "moderate" | "low_short_term";
  titleKey: string;
  noteKey: string;
}

export interface CommunityKitResult {
  hourlyDecisions: HourlyActivityDecision[];
  goHoursCount: number;
  avoidHoursCount: number;
  collectiveDeltaKgLow: number;
  collectiveDeltaKgHigh: number;
  whatsappText: string;
  actions: CommunityActionItem[];
}

const COMMUNITY_ACTIONS: CommunityActionItem[] = [
  {
    id: "no_waste_burn",
    evidenceTier: "high",
    titleKey: "community.act_no_burn",
    noteKey: "community.act_no_burn_note",
  },
  {
    id: "dust_wet_control",
    evidenceTier: "high",
    titleKey: "community.act_dust",
    noteKey: "community.act_dust_note",
  },
  {
    id: "gate_idle_off",
    evidenceTier: "high",
    titleKey: "community.act_idle",
    noteKey: "community.act_idle_note",
  },
  {
    id: "classroom_cr_box",
    evidenceTier: "high",
    titleKey: "community.act_cr",
    noteKey: "community.act_cr_note",
  },
  {
    id: "tree_planting",
    evidenceTier: "low_short_term",
    titleKey: "community.act_trees",
    noteKey: "community.act_trees_note",
  },
  {
    id: "smog_tower",
    evidenceTier: "low_short_term",
    titleKey: "community.act_tower",
    noteKey: "community.act_tower_note",
  },
];

function decideStatus(aqi: number): GoNoGo {
  if (aqi <= 150) return "go";
  if (aqi <= 250) return "limit";
  return "avoid";
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

export function computeCommunityKit(input: CommunityInput, locale: Locale): CommunityKitResult {
  const decisions = input.hours.slice(0, 24).map((h) => {
    const aqi = computeAqiNowEquivalent(h).aqi;
    return { hour: h.hourLocal, pm25: Math.round(h.pm25), aqi, status: decideStatus(aqi) };
  });

  const goHours = decisions.filter((d) => d.status === "go").map((d) => formatHour(d.hour));
  const avoidHours = decisions.filter((d) => d.status === "avoid");
  const meanPm = decisions.reduce((s, d) => s + d.pm25, 0) / Math.max(decisions.length, 1);

  // Typical indoor shift + CR box + avoid-peak saves ~250–650 ug/person/day during smog days
  const perPersonUgLow = Math.max(50, meanPm * 2.2);
  const perPersonUgHigh = Math.max(120, meanPm * 4.8);
  const collectiveDeltaKgLow = Number(((perPersonUgLow * input.headcount) / 1e6).toFixed(3));
  const collectiveDeltaKgHigh = Number(((perPersonUgHigh * input.headcount) / 1e6).toFixed(3));

  const goSummary =
    goHours.slice(0, 4).join(", ") || (locale === "hi" ? "कोई सुरक्षित खिड़की नहीं" : "None");
  const whatsappText =
    locale === "hi"
      ? `${input.orgName} वायु सूचना: आज ${avoidHours.length} घंटे बाहरी खेल/असेंबली से बचें। बेहतर समय: ${goSummary}। कक्षाओं में खिड़कियाँ बंद रखें। (Saans)`
      : `${input.orgName} Air Notice: Avoid vigorous outdoor assembly/PE for ${avoidHours.length} peak hours today. Better outdoor slots: ${goSummary}. Keep doors shut & run room filtration where available. (Saans)`;

  return {
    hourlyDecisions: decisions,
    goHoursCount: goHours.length,
    avoidHoursCount: avoidHours.length,
    collectiveDeltaKgLow,
    collectiveDeltaKgHigh,
    whatsappText,
    actions: COMMUNITY_ACTIONS,
  };
}
