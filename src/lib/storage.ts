import { HouseholdProfileSchema, type HouseholdProfile, type Locale } from "@/engine/schema";
import { SHARMA_PROFILE } from "./sharma-fixture";

const PROFILE_KEY = "saans_profile_v1";
const THEME_KEY = "color-scheme";
const LOCALE_KEY = "saans_locale_v1";
const ACTIONS_KEY = "saans_active_actions_v1";
const FOCUS_KEY = "saans_focus_member_v1";
const TUTORIAL_KEY = "saans_tutorial_dismissed_v1";

export type ThemeMode = "system" | "light" | "dark";

export function loadStoredProfile(): HouseholdProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = HouseholdProfileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveStoredProfile(profile: HouseholdProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage quota errors
  }
}

export function clearAllStoredData(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PROFILE_KEY);
    window.localStorage.removeItem(LOCALE_KEY);
    window.localStorage.removeItem(THEME_KEY);
    window.localStorage.removeItem(ACTIONS_KEY);
    window.localStorage.removeItem(FOCUS_KEY);
    window.localStorage.removeItem(TUTORIAL_KEY);
  } catch {
    // ignore
  }
}

export function loadStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(LOCALE_KEY);
  return v === "hi" ? "hi" : "en";
}

export function saveStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // ignore
  }
}

export function loadStoredActions(fallback: string[]): string[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(ACTIONS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((x) => typeof x === "string") ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredActions(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIONS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function loadStoredFocusMember(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(FOCUS_KEY) || fallback;
}

export function saveStoredFocusMember(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FOCUS_KEY, id);
  } catch {
    // ignore
  }
}

export function loadTutorialDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(TUTORIAL_KEY) === "1";
}

export function saveTutorialDismissed(dismissed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (dismissed) window.localStorage.setItem(TUTORIAL_KEY, "1");
    else window.localStorage.removeItem(TUTORIAL_KEY);
  } catch {
    // ignore
  }
}

export function defaultNewProfile(): HouseholdProfile {
  return { ...SHARMA_PROFILE, id: "user-household" };
}
