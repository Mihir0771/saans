import { z } from "zod";
import { compareCommutes } from "@/engine/commute";
import { computeCommunityKit } from "@/engine/community";
import { computeMemberPlan } from "@/engine/plan";
import type { AirBundle, FactItem, FactSheet, HouseholdProfile } from "@/engine/schema";
import { findBestWorstWindows, findSmartVentilationWindow } from "@/engine/windows";

export interface EngineToolContext {
  profile: HouseholdProfile;
  air: AirBundle;
  factSheet: FactSheet;
  focusMemberId: string;
}

const SimulateArgs = z.object({ actionId: z.string().max(40) });
const CommuteArgs = z.object({ distanceKm: z.number().min(0.5).max(80).optional() });
const CommunityArgs = z.object({
  orgType: z.enum(["school", "rwa", "office"]).default("school"),
  headcount: z.number().int().min(10).max(5000).default(200),
});
const TermArgs = z.object({ term: z.string().max(40) });

export const GEMINI_TOOL_DECLARATIONS = [
  {
    type: "function" as const,
    name: "get_air_now",
    description: "Get current CPCB-scale AQI, PM2.5, and trapped-air risk for the user's city.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    type: "function" as const,
    name: "get_forecast_windows",
    description: "Get today's best/worst 2-hour windows and smart indoor ventilation window.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    type: "function" as const,
    name: "simulate_action",
    description:
      "Simulate enabling a single protective action (cr_box, hepa_purifier, commute_metro, seal_gaps, close_peak_windows, n95_commute).",
    parameters: {
      type: "object",
      properties: { actionId: { type: "string", description: "Catalog action id" } },
      required: ["actionId"],
    },
  },
  {
    type: "function" as const,
    name: "compare_commute",
    description: "Compare commute modes (metro, auto, bus, car_ac, walk) for dose and CO2e.",
    parameters: { type: "object", properties: { distanceKm: { type: "number" } }, required: [] },
  },
  {
    type: "function" as const,
    name: "community_brief",
    description: "Compute school/RWA/office go/no-go hours and collective dose savings.",
    parameters: {
      type: "object",
      properties: {
        orgType: { type: "string", enum: ["school", "rwa", "office"] },
        headcount: { type: "number" },
      },
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "explain_term",
    description:
      "Explain an air-quality term (breath_budget, cpcb_aqi, cr_box, grap, trapped_air).",
    parameters: { type: "object", properties: { term: { type: "string" } }, required: ["term"] },
  },
];

function addFact(
  facts: Record<string, FactItem>,
  id: string,
  value: number | string,
  unit: string,
  display: string,
) {
  facts[id] = { id, value, unit, display, confidence: "B" };
}

function runWindowsTool(ctx: EngineToolContext) {
  const bw = findBestWorstWindows(ctx.air.hours);
  const vent = findSmartVentilationWindow(ctx.profile.home, ctx.air.hours);
  const newFacts: Record<string, FactItem> = {};
  addFact(newFacts, "vent_duration_min", vent.durationMin, "min", `${vent.durationMin} min`);
  return {
    result: {
      bestSlot: "{{fact:best_window_start}}",
      worstSlot: "{{fact:worst_window_start}}",
      smartVentilationFound: vent.hasWindow,
      bestMeanPm25: bw.bestMeanPm25,
    },
    newFacts,
  };
}

function runSimulateTool(rawArgs: unknown, ctx: EngineToolContext) {
  const { actionId } = SimulateArgs.parse(rawArgs ?? {});
  const plan = computeMemberPlan(ctx.profile, ctx.focusMemberId, ctx.air, [actionId]);
  const saved = Math.max(0, plan.baseline.ratio - plan.plan.ratio);
  const newFacts: Record<string, FactItem> = {};
  addFact(newFacts, "sim_action_ratio", plan.plan.ratio, "× WHO", `${plan.plan.ratio.toFixed(1)}×`);
  addFact(newFacts, "sim_action_saved", saved, "× WHO", `${saved.toFixed(1)}×`);
  return {
    result: {
      actionId,
      resultingDoseSlot: "{{fact:sim_action_ratio}}",
      savedSlot: "{{fact:sim_action_saved}}",
    },
    newFacts,
  };
}

function runCompareCommuteTool(rawArgs: unknown, ctx: EngineToolContext) {
  const parsed = CommuteArgs.parse(rawArgs ?? {});
  const member =
    ctx.profile.members.find((m) => m.id === ctx.focusMemberId) ?? ctx.profile.members[0];
  const ageBand = member ? member.ageBand : "adult_18_64";
  const distanceKm = parsed.distanceKm ?? (member ? member.commuteDistanceKm : 6);
  const departHour = member ? member.commuteDepartHour : 8;
  const rows = compareCommutes({ ageBand, distanceKm, departHour, hours: ctx.air.hours });
  const metro = rows.find((r) => r.mode === "metro");
  const auto = rows.find((r) => r.mode === "auto");
  const diff = Math.max(0, (auto ? auto.doseUg : 0) - (metro ? metro.doseUg : 0));
  const newFacts: Record<string, FactItem> = {};
  addFact(newFacts, "commute_metro_save_ug", diff, "µg", `${Math.round(diff)} µg`);
  return { result: { metroVsAutoSaveSlot: "{{fact:commute_metro_save_ug}}" }, newFacts };
}

export function executeEngineTool(
  name: string,
  rawArgs: unknown,
  ctx: EngineToolContext,
): { result: Record<string, unknown>; newFacts: Record<string, FactItem> } {
  if (name === "get_air_now") {
    return {
      result: {
        aqiSlot: "{{fact:aqi_now}}",
        pm25Slot: "{{fact:pm25_now}}",
        trappedAirRisk: ctx.factSheet.trappedAirRisk,
      },
      newFacts: {},
    };
  }
  if (name === "get_forecast_windows") return runWindowsTool(ctx);
  if (name === "simulate_action") return runSimulateTool(rawArgs, ctx);
  if (name === "compare_commute") return runCompareCommuteTool(rawArgs, ctx);
  if (name === "community_brief") {
    const parsed = CommunityArgs.parse(rawArgs ?? {});
    const kit = computeCommunityKit(
      { ...parsed, orgName: "Community", hours: ctx.air.hours },
      ctx.profile.locale,
    );
    const newFacts: Record<string, FactItem> = {};
    addFact(
      newFacts,
      "community_avoid_hours",
      kit.avoidHoursCount,
      "hours",
      `${kit.avoidHoursCount} h`,
    );
    return { result: { avoidHoursSlot: "{{fact:community_avoid_hours}}" }, newFacts };
  }
  const { term } = TermArgs.parse(rawArgs ?? {});
  return { result: { term, definition: `Engine concept: ${term}` }, newFacts: {} };
}
