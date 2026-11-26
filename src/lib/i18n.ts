import type { Locale } from "@/engine/schema";
import en from "@/i18n/en.json";
import hi from "@/i18n/hi.json";

const DICTS = { en, hi } as const;

export function t(locale: Locale, keyPath: string): string {
  const parts = keyPath.split(".");
  let cur: unknown = DICTS[locale];
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in cur) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return keyPath;
    }
  }
  return typeof cur === "string" ? cur : keyPath;
}

export function formatNumberLocale(value: number, locale: Locale, maxDecimals = 1): string {
  return new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    maximumFractionDigits: maxDecimals,
  }).format(value);
}
