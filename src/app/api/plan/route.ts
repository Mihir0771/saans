import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeFullPlan } from "@/engine/plan";
import { AirBundleSchema, HouseholdProfileSchema } from "@/engine/schema";
import { resolveDemoInputs } from "@/lib/ahmedabad-fixture";
import { checkRateLimit, clientIpFromHeaders } from "@/server/ratelimit";

const PlanRequestSchema = z.object({
  demo: z.enum(["sharma", "ahmedabad"]).optional(),
  profile: HouseholdProfileSchema.optional(),
  air: AirBundleSchema.optional(),
  focusMemberId: z.string().max(32).optional(),
  activeActionIds: z.array(z.string().max(40)).max(12).optional(),
});

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers);
  if (!checkRateLimit(`plan:${ip}`, 60)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan request" }, { status: 400 });
  }

  const { profile, air } = resolveDemoInputs(
    parsed.data.demo,
    parsed.data.profile,
    parsed.data.air,
  );
  const result = computeFullPlan(
    profile,
    air,
    parsed.data.focusMemberId,
    parsed.data.activeActionIds,
  );
  return NextResponse.json(result);
}
