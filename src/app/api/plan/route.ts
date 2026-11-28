import type { NextRequest } from "next/server";
import { z } from "zod";
import { computeFullPlan } from "@/engine/plan";
import { AirBundleSchema, HouseholdProfileSchema } from "@/engine/schema";
import { resolveDemoInputs } from "@/lib/ahmedabad-fixture";
import { enforceRouteRateLimit, jsonNoStore, parseJsonRequest } from "@/server/http";

const PlanRequestSchema = z.object({
  demo: z.enum(["sharma", "ahmedabad"]).optional(),
  profile: HouseholdProfileSchema.optional(),
  air: AirBundleSchema.optional(),
  focusMemberId: z.string().max(32).optional(),
  activeActionIds: z.array(z.string().max(40)).max(12).optional(),
});

/**
 * Computes deterministic per-member Breath Budgets, Shapley action attribution,
 * commute Pareto comparisons, and safety flags for the submitted household.
 */
export async function POST(req: NextRequest) {
  const blocked = enforceRouteRateLimit(req, "plan", 60);
  if (blocked) return blocked;

  const parsed = await parseJsonRequest(req, PlanRequestSchema, "Invalid plan request");
  if (!parsed.ok) return parsed.response;

  const d = parsed.data;
  const { profile, air } = resolveDemoInputs(d.demo, d.profile, d.air);
  return jsonNoStore(computeFullPlan(profile, air, d.focusMemberId, d.activeActionIds));
}
