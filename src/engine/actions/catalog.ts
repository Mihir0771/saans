import { CR_BOX_COST_INR } from "../params";
import type { Confidence } from "../schema";

export type ActionCategory = "indoor" | "routine" | "commute" | "source" | "mask";
export type ActionBucket = "do_now" | "this_week" | "budget_allows";
export type EvidenceTier = "high" | "moderate" | "caution";

export interface ActionDefinition {
  id: string;
  category: ActionCategory;
  bucket: ActionBucket;
  costOneTimeInr: number;
  costDailyInr: number;
  effort: 1 | 2 | 3 | 4 | 5;
  confidence: Confidence;
  evidenceTier: EvidenceTier;
  titleKey: string;
  whyKey: string;
}

export const ACTION_CATALOG: ActionDefinition[] = [
  {
    id: "cr_box",
    category: "indoor",
    bucket: "this_week",
    costOneTimeInr: CR_BOX_COST_INR.value,
    costDailyInr: 8,
    effort: 2,
    confidence: "A",
    evidenceTier: "high",
    titleKey: "actions.cr_box.title",
    whyKey: "actions.cr_box.why",
  },
  {
    id: "hepa_purifier",
    category: "indoor",
    bucket: "budget_allows",
    costOneTimeInr: 7500,
    costDailyInr: 12,
    effort: 1,
    confidence: "A",
    evidenceTier: "high",
    titleKey: "actions.hepa_purifier.title",
    whyKey: "actions.hepa_purifier.why",
  },
  {
    id: "commute_metro",
    category: "commute",
    bucket: "do_now",
    costOneTimeInr: 0,
    costDailyInr: 0,
    effort: 1,
    confidence: "B",
    evidenceTier: "high",
    titleKey: "actions.commute_metro.title",
    whyKey: "actions.commute_metro.why",
  },
  {
    id: "seal_gaps",
    category: "indoor",
    bucket: "this_week",
    costOneTimeInr: 250,
    costDailyInr: 0,
    effort: 2,
    confidence: "C",
    evidenceTier: "moderate",
    titleKey: "actions.seal_gaps.title",
    whyKey: "actions.seal_gaps.why",
  },
  {
    id: "close_peak_windows",
    category: "routine",
    bucket: "do_now",
    costOneTimeInr: 0,
    costDailyInr: 0,
    effort: 1,
    confidence: "B",
    evidenceTier: "high",
    titleKey: "actions.close_peak_windows.title",
    whyKey: "actions.close_peak_windows.why",
  },
  {
    id: "cook_hood_shift",
    category: "source",
    bucket: "do_now",
    costOneTimeInr: 0,
    costDailyInr: 0,
    effort: 1,
    confidence: "B",
    evidenceTier: "high",
    titleKey: "actions.cook_hood_shift.title",
    whyKey: "actions.cook_hood_shift.why",
  },
  {
    id: "stop_incense_coil",
    category: "source",
    bucket: "do_now",
    costOneTimeInr: 0,
    costDailyInr: 0,
    effort: 1,
    confidence: "B",
    evidenceTier: "high",
    titleKey: "actions.stop_incense_coil.title",
    whyKey: "actions.stop_incense_coil.why",
  },
  {
    id: "n95_commute",
    category: "mask",
    bucket: "do_now",
    costOneTimeInr: 150,
    costDailyInr: 0,
    effort: 2,
    confidence: "A",
    evidenceTier: "high",
    titleKey: "actions.n95_commute.title",
    whyKey: "actions.n95_commute.why",
  },
  {
    id: "shift_outdoor_timing",
    category: "routine",
    bucket: "do_now",
    costOneTimeInr: 0,
    costDailyInr: 0,
    effort: 1,
    confidence: "B",
    evidenceTier: "high",
    titleKey: "actions.shift_outdoor_timing.title",
    whyKey: "actions.shift_outdoor_timing.why",
  },
  {
    id: "wet_mop",
    category: "indoor",
    bucket: "this_week",
    costOneTimeInr: 0,
    costDailyInr: 0,
    effort: 2,
    confidence: "C",
    evidenceTier: "moderate",
    titleKey: "actions.wet_mop.title",
    whyKey: "actions.wet_mop.why",
  },
];
