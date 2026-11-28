import type { NextRequest } from "next/server";
import { z } from "zod";
import { computeFullPlan } from "@/engine/plan";
import { AirBundleSchema, HouseholdProfileSchema, LocaleSchema } from "@/engine/schema";
import { resolveDemoInputs } from "@/lib/ahmedabad-fixture";
import { generateGuardedChat } from "@/server/ai-service";
import { extractUserGeminiKey } from "@/server/gemini";
import { enforceRouteRateLimit, jsonNoStore, parseJsonRequest } from "@/server/http";

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(500),
  locale: LocaleSchema.default("en"),
  demo: z.enum(["sharma", "ahmedabad"]).optional(),
  profile: HouseholdProfileSchema.optional(),
  air: AirBundleSchema.optional(),
  focusMemberId: z.string().max(32).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().max(800),
      }),
    )
    .max(12)
    .default([]),
});

/**
 * Handles grounded Ask Saans chat turns: validates input, computes an engine
 * FactSheet, runs Gemini function calling + slot substitution, and falls back
 * deterministically if AI is unavailable or blocked by `guard.ts`.
 */
export async function POST(req: NextRequest) {
  const blocked = enforceRouteRateLimit(req, "chat", 20);
  if (blocked) return blocked;

  const parsed = await parseJsonRequest(req, ChatRequestSchema, "Invalid chat request");
  if (!parsed.ok) return parsed.response;

  const d = parsed.data;
  const resolved = resolveDemoInputs(d.demo, d.profile, d.air);
  const profile = { ...resolved.profile, locale: d.locale };
  const full = computeFullPlan(profile, resolved.air, d.focusMemberId);
  const focusMemberId = d.focusMemberId ?? profile.members[0]?.id ?? "aarav";

  const result = await generateGuardedChat({
    message: d.message,
    history: d.history,
    profile,
    air: resolved.air,
    factSheet: full.factSheet,
    focusMemberId,
    locale: d.locale,
    apiKey: extractUserGeminiKey(req.headers),
  });

  return jsonNoStore(result);
}
