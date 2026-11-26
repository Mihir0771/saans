import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeFullPlan } from "@/engine/plan";
import { AirBundleSchema, HouseholdProfileSchema, LocaleSchema } from "@/engine/schema";
import { resolveDemoInputs } from "@/lib/ahmedabad-fixture";
import { generateGuardedExplain } from "@/server/ai-service";
import { extractUserGeminiKey } from "@/server/gemini";
import { checkRateLimit, clientIpFromHeaders } from "@/server/ratelimit";

const ExplainRequestSchema = z.object({
  demo: z.enum(["sharma", "ahmedabad"]).optional(),
  locale: LocaleSchema.default("en"),
  profile: HouseholdProfileSchema.optional(),
  air: AirBundleSchema.optional(),
  focusMemberId: z.string().max(32).optional(),
});

function resolveInputs(d: z.infer<typeof ExplainRequestSchema>) {
  const resolved = resolveDemoInputs(d.demo, d.profile, d.air);
  const profile = { ...resolved.profile, locale: d.locale };
  const air = resolved.air;
  const focusId = d.focusMemberId ?? profile.members[0]?.id ?? "aarav";
  return { profile, air, focusId };
}

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers);
  if (!checkRateLimit(`explain:${ip}`, 30)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const parsed = ExplainRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid explain request" }, { status: 400 });
  }

  const { profile, air, focusId } = resolveInputs(parsed.data);
  const full = computeFullPlan(profile, air, focusId);
  const eligible = full.memberPlans[focusId]?.activeActionIds ?? [];
  const explained = await generateGuardedExplain(
    full.factSheet,
    eligible,
    undefined,
    extractUserGeminiKey(req.headers),
  );
  return NextResponse.json({ ...explained, factSheet: full.factSheet });
}
