import { z } from "zod";
import type { AirBundle, FactSheet, HouseholdProfile, Locale } from "@/engine/schema";
import { defaultChatGenerator, defaultExplainGenerator } from "./ai-generators";
import { buildChatFallback, buildExplainFallback, type ExplainPayload } from "./fallbacks";
import {
  cacheKeyForPayload,
  getCachedAiResponse,
  loadPromptFile,
  setCachedAiResponse,
} from "./gemini";
import { runNumberGuard, sanitizeUserText } from "./guard";
import type { EngineToolContext } from "./tools";

export const ExplainRawSchema = z.object({
  headline: z.string().min(1).max(200),
  summary: z.string().min(1).max(600),
  sections: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        body: z.string().min(1).max(600),
        actionIds: z.array(z.string().max(40)).max(5),
      }),
    )
    .min(1)
    .max(4),
  tips: z.array(z.object({ actionId: z.string().max(40), why: z.string().min(1).max(240) })).max(5),
});

export type ExplainGenerator = (
  prompt: string,
  isRetry: boolean,
  apiKey?: string,
) => Promise<string>;
export type ChatGenerator = (
  prompt: string,
  ctx: EngineToolContext,
  isRetry: boolean,
  apiKey?: string,
) => Promise<{ text: string; factSheet: FactSheet }>;

function guardExplainObject(
  rawObj: z.infer<typeof ExplainRawSchema>,
  factSheet: FactSheet,
  eligibleActionIds: string[],
): ExplainPayload | null {
  const headline = runNumberGuard(rawObj.headline, factSheet);
  const summary = runNumberGuard(rawObj.summary, factSheet);
  if (!headline.ok || !summary.ok) return null;

  const sections: ExplainPayload["sections"] = [];
  for (const sec of rawObj.sections) {
    const title = runNumberGuard(sec.title, factSheet);
    const body = runNumberGuard(sec.body, factSheet);
    if (!title.ok || !body.ok || !sec.actionIds.every((id) => eligibleActionIds.includes(id)))
      return null;
    sections.push({ title: title.text, body: body.text, actionIds: sec.actionIds });
  }

  const tips: ExplainPayload["tips"] = [];
  for (const tip of rawObj.tips) {
    const why = runNumberGuard(tip.why, factSheet);
    if (!why.ok || !eligibleActionIds.includes(tip.actionId)) return null;
    tips.push({ actionId: tip.actionId, why: why.text });
  }
  return {
    headline: headline.text,
    summary: summary.text,
    sections,
    tips,
    verifiedByEngine: true,
    offlineFallback: false,
  };
}

export async function generateGuardedExplain(
  factSheet: FactSheet,
  eligibleActionIds: string[],
  generator?: ExplainGenerator,
  apiKey?: string,
): Promise<ExplainPayload> {
  const cKey = cacheKeyForPayload({ kind: "explain", factSheet, eligibleActionIds });
  const useCache = generator === undefined;
  if (useCache) {
    const cached = getCachedAiResponse(cKey);
    if (cached) return JSON.parse(cached) as ExplainPayload;
  }
  const gen = generator ?? defaultExplainGenerator;
  const basePrompt = `${loadPromptFile("system")}\n\n${loadPromptFile("explain")}\n\neligibleActionIds: ${JSON.stringify(eligibleActionIds)}\nFactSheet:\n${JSON.stringify(factSheet)}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const prompt =
        attempt === 0
          ? basePrompt
          : `${basePrompt}\n\nSTRICT REMINDER: Output ZERO digits outside {{fact:id}} slots.`;
      const parsed = ExplainRawSchema.parse(JSON.parse(await gen(prompt, attempt === 1, apiKey)));
      const guarded = guardExplainObject(parsed, factSheet, eligibleActionIds);
      if (guarded) {
        if (useCache) setCachedAiResponse(cKey, JSON.stringify(guarded));
        return guarded;
      }
    } catch {
      // retry once, then fall back cleanly
    }
  }
  return buildExplainFallback(factSheet, eligibleActionIds);
}

export interface ChatResponsePayload {
  reply: string;
  verifiedByEngine: boolean;
  offlineFallback: boolean;
  slotsUsed: string[];
  facts: FactSheet["facts"];
}

function buildChatPrompt(
  cleanMsg: string,
  history: Array<{ role: "user" | "assistant"; text: string }>,
  locale: Locale,
  factSheet: FactSheet,
): string {
  const recent = history
    .slice(-6)
    .map((t) => `${t.role}: ${sanitizeUserText(t.text, 300)}`)
    .join("\n");
  return `${loadPromptFile("system")}\n\n${loadPromptFile("chat")}\n\nLocale: ${locale}\nFactSheet:\n${JSON.stringify(factSheet)}\nRecent turns:\n${recent}\n<user_data>\n${cleanMsg}\n</user_data>`;
}

async function tryChatAttempt(
  prompt: string,
  ctx: EngineToolContext,
  gen: ChatGenerator,
  isRetry: boolean,
  apiKey?: string,
): Promise<ChatResponsePayload | null> {
  try {
    const out = await gen(prompt, ctx, isRetry, apiKey);
    const guarded = runNumberGuard(out.text, out.factSheet);
    if (!guarded.ok) return null;
    return {
      reply: guarded.text,
      verifiedByEngine: true,
      offlineFallback: false,
      slotsUsed: guarded.slotsUsed,
      facts: out.factSheet.facts,
    };
  } catch {
    return null;
  }
}

export async function generateGuardedChat(input: {
  message: string;
  history: Array<{ role: "user" | "assistant"; text: string }>;
  profile: HouseholdProfile;
  air: AirBundle;
  factSheet: FactSheet;
  focusMemberId: string;
  locale: Locale;
  generator?: ChatGenerator;
  apiKey?: string;
}): Promise<ChatResponsePayload> {
  const cleanMsg = sanitizeUserText(input.message, 500);
  const ctx: EngineToolContext = {
    profile: input.profile,
    air: input.air,
    factSheet: { ...input.factSheet, facts: { ...input.factSheet.facts } },
    focusMemberId: input.focusMemberId,
  };
  const basePrompt = buildChatPrompt(cleanMsg, input.history, input.locale, ctx.factSheet);
  const gen = input.generator ?? defaultChatGenerator;

  const first = await tryChatAttempt(basePrompt, ctx, gen, false, input.apiKey);
  if (first) return first;
  const second = await tryChatAttempt(
    `${basePrompt}\n\nSTRICT REMINDER: Never write raw numbers. Use {{fact:id}} slots only.`,
    ctx,
    gen,
    true,
    input.apiKey,
  );
  if (second) return second;

  return {
    reply: buildChatFallback(cleanMsg, ctx.factSheet, input.locale),
    verifiedByEngine: false,
    offlineFallback: true,
    slotsUsed: [],
    facts: ctx.factSheet.facts,
  };
}
