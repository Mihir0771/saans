import type { FactSheet } from "@/engine/schema";

export interface GuardResult {
  ok: boolean;
  text: string;
  slotsUsed: string[];
  reason?: "UNSLOTTED_NUMBER" | "UNKNOWN_SLOT" | "BANNED_SAFETY_ADVICE" | "EMPTY_OUTPUT";
}

// Fixed domain labels that legitimately contain digits (not invented statistics)
const ALLOWED_TOKEN_PATTERNS: RegExp[] = [
  /\bPM2\.5\b/gi,
  /\bPM10\b/gi,
  /\bNO2\b/gi,
  /\bO3\b/gi,
  /\bCO2e?\b/gi,
  /\bN95\b/gi,
  /\bN99\b/gi,
  /\bFFP2\b/gi,
  /\bFFP3\b/gi,
  /\bMERV[\s-]?13\b/gi,
  /\b24-hour\b/gi,
  /\b24-h\b/gi,
  /\b8-hour\b/gi,
  /\b24\s*घंटे\b/gi,
];

const BANNED_ADVICE_PATTERNS: RegExp[] = [
  /(?:use|using|buy|buying|run|running|try|recommend|get|install)\s+(?:an?\s+)?(?:ozone\s+(?:generator|purifier|machine)|ionizer)/i,
  /(?:seal|close|shut|keep\s+windows?\s+shut|keep\s+doors?\s+shut).{0,60}(?:angeethi|chulha|charcoal|coal\s+heater|unvented)/i,
  /(?:angeethi|chulha|charcoal).{0,60}(?:seal|keep\s+windows?\s+shut|close\s+all|shut\s+all)/i,
  /(?:mask|n95|ffp2)\s+(?:for|on)\s+(?:a\s+|your\s+)?(?:baby|infant|toddler|1-year-old|under[\s-]?2)/i,
];

export function sanitizeUserText(raw: string, maxLen = 500): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function hasBannedSafetyAdvice(text: string): boolean {
  return BANNED_ADVICE_PATTERNS.some((rx) => rx.test(text));
}

function stripAllowedNumberTokens(text: string): string {
  let out = text;
  for (const rx of ALLOWED_TOKEN_PATTERNS) {
    out = out.replace(rx, " ");
  }
  return out;
}

/**
 * Verifies AI-generated prose against `factSheet`: resolves `{{fact:id}}` slots,
 * rejects unslotted numbers, unknown slots, or banned safety advice (§6.5).
 */
export function runNumberGuard(rawText: string, factSheet: FactSheet): GuardResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { ok: false, text: "", slotsUsed: [], reason: "EMPTY_OUTPUT" };
  }
  if (hasBannedSafetyAdvice(trimmed)) {
    return { ok: false, text: "", slotsUsed: [], reason: "BANNED_SAFETY_ADVICE" };
  }

  const slotRx = /\{\{fact:([a-z0-9_]+)\}\}/g;
  const slotsUsed: string[] = [];
  let unknownSlot = false;

  // Check raw text (outside {{fact:...}} slots) for any unslotted digits
  const withoutSlots = trimmed.replace(slotRx, (_, id: string) => {
    if (!factSheet.facts[id]) unknownSlot = true;
    else if (!slotsUsed.includes(id)) slotsUsed.push(id);
    return " ";
  });

  if (unknownSlot) {
    return { ok: false, text: "", slotsUsed: [], reason: "UNKNOWN_SLOT" };
  }

  const stripped = stripAllowedNumberTokens(withoutSlots);
  if (/[\d०-९]/.test(stripped)) {
    return { ok: false, text: "", slotsUsed: [], reason: "UNSLOTTED_NUMBER" };
  }

  const substituted = trimmed.replace(
    slotRx,
    (_, id: string) => factSheet.facts[id]?.display ?? "",
  );
  return { ok: true, text: substituted, slotsUsed };
}
