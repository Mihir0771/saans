import type { NextRequest } from "next/server";
import { z } from "zod";
import { computeFullPlan } from "@/engine/plan";
import { AirBundleSchema, HouseholdProfileSchema, LocaleSchema } from "@/engine/schema";
import { resolveDemoInputs } from "@/lib/ahmedabad-fixture";
import { generateGuardedExplain } from "@/server/ai-service";
import { extractUserGeminiKey } from "@/server/gemini";
import { enforceRouteRateLimit, jsonNoStore, parseJsonRequest } from "@/server/http";

const ExplainRequestSchema = z.object({
  demo: z.enum(["sharma", "ahmedabad"]).optional(),
  locale: LocaleSchema.default("en"),
  profile: HouseholdProfileSchema.optional(),
  air: AirBundleSchema.optional(),
  focusMemberId: z.string().max(32).optional(),
});

/**
 * Generates structured, FactSheet-grounded plan narration via Gemini with `guard.ts` verification.
 */
export async function POST(req: NextRequest) {
  const blocked = enforceRouteRateLimit(req, "explain", 30);
  if (blocked) return blocked;

  const parsed = await parseJsonRequest(req, ExplainRequestSchema, "Invalid explain request");
  if (!parsed.ok) return parsed.response;

  const d = parsed.data;
  const resolved = resolveDemoInputs(d.demo, d.profile, d.air);
  const profile = { ...resolved.profile, locale: d.locale };
  const focusId = d.focusMemberId ?? profile.members[0]?.id ?? "aarav";
  const full = computeFullPlan(profile, resolved.air, focusId);
  const eligible = full.memberPlans[focusId]?.activeActionIds ?? [];
  const explained = await generateGuardedExplain(
    full.factSheet,
    eligible,
    undefined,
    extractUserGeminiKey(req.headers),
  );
  return jsonNoStore({ ...explained, factSheet: full.factSheet });
}
