import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeFullPlan } from "@/engine/plan";
import { AirBundleSchema, HouseholdProfileSchema, LocaleSchema } from "@/engine/schema";
import { resolveDemoInputs } from "@/lib/ahmedabad-fixture";
import { generateGuardedChat } from "@/server/ai-service";
import { checkRateLimit, clientIpFromHeaders } from "@/server/ratelimit";

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

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers);
  if (!checkRateLimit(`chat:${ip}`, 20)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat request" }, { status: 400 });
  }

  const d = parsed.data;
  const resolved = resolveDemoInputs(d.demo, d.profile, d.air);
  const profile = { ...resolved.profile, locale: d.locale };
  const air = resolved.air;
  const full = computeFullPlan(profile, air, d.focusMemberId);
  const focusMemberId = d.focusMemberId ?? profile.members[0]?.id ?? "aarav";

  const result = await generateGuardedChat({
    message: d.message,
    history: d.history,
    profile,
    air,
    factSheet: full.factSheet,
    focusMemberId,
    locale: d.locale,
  });

  return NextResponse.json(result);
}
