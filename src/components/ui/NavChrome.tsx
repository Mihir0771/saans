"use client";

import React from "react";
import type { Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import type { ThemeMode } from "@/lib/storage";

export type AppTab = "today" | "plan" | "lab" | "ask" | "community" | "proof" | "onboarding";

export function BrandLogo() {
  return (
    <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-ink">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="14" r="13" fill="var(--brand)" />
        <path
          d="M7 15c3-6 7-6 7-6s4 0 7 6M9 19c2.5-3 5-3 5-3s2.5 0 5 3"
          fill="none"
          stroke="var(--on-brand)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span>Saans</span>
    </span>
  );
}

const ICONS: Record<"today" | "plan" | "lab" | "ask", React.ReactNode> = {
  today: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 16a8 8 0 1 1 16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M12 16l4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  plan: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 19V5M4 19h16M7 15l4-4 3 3 5-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  lab: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 11l8-7 8 7v9H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ask: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 5h16v11H9l-5 4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const PRIMARY_IDS: Array<"today" | "plan" | "lab" | "ask"> = ["today", "plan", "lab", "ask"];

export function SidebarNav({
  activeTab,
  onSelectTab,
  locale,
}: {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  locale: Locale;
}) {
  return (
    <aside className="no-print hidden md:flex md:flex-col md:gap-2 md:py-5">
      <div className="px-2 pb-4">
        <BrandLogo />
      </div>
      <nav aria-label="Primary" className="grid gap-1">
        {[...PRIMARY_IDS, "community", "proof", "onboarding"].map((id) => {
          const tabId = id as AppTab;
          const cls =
            activeTab === tabId ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-surface-2";
          return (
            <button
              key={tabId}
              type="button"
              aria-current={activeTab === tabId ? "page" : undefined}
              onClick={() => onSelectTab(tabId)}
              className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-pill px-4 text-left font-semibold ${cls}`}
            >
              {id in ICONS ? ICONS[id as keyof typeof ICONS] : null}
              <span>{t(locale, `nav.${id}`)}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  locale,
}: {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  locale: Locale;
}) {
  return (
    <nav
      aria-label="Primary mobile"
      className="no-print fixed inset-x-0 bottom-0 z-30 grid h-[calc(var(--nav-h)+env(safe-area-inset-bottom))] grid-cols-4 border-t border-divider bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {PRIMARY_IDS.map((id) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onSelectTab(id)}
            className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 text-xs font-semibold ${active ? "text-brand-ink" : "text-ink-2"}`}
          >
            <span
              className={`grid h-[30px] w-[56px] place-items-center rounded-pill ${active ? "bg-brand-soft" : ""}`}
            >
              {ICONS[id]}
            </span>
            <span>{t(locale, `nav.${id}`)}</span>
          </button>
        );
      })}
    </nav>
  );
}

function LangSwitch({
  locale,
  onChangeLocale,
}: {
  locale: Locale;
  onChangeLocale: (l: Locale) => void;
}) {
  const cls = (active: boolean) =>
    `min-h-[44px] min-w-[44px] cursor-pointer px-2 font-bold ${active ? "bg-brand text-on-brand" : "text-ink-2"}`;
  return (
    <div
      className="inline-flex overflow-hidden rounded-pill border border-line bg-surface"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => onChangeLocale("en")}
        className={cls(locale === "en")}
      >
        EN
      </button>
      <button
        type="button"
        lang="hi"
        aria-pressed={locale === "hi"}
        onClick={() => onChangeLocale("hi")}
        className={cls(locale === "hi")}
      >
        हिं
      </button>
    </div>
  );
}

export function TopControls({
  locale,
  onChangeLocale,
  theme,
  onChangeTheme,
  moreOpen,
  onToggleMore,
}: {
  locale: Locale;
  onChangeLocale: (l: Locale) => void;
  theme: ThemeMode;
  onChangeTheme: (m: ThemeMode) => void;
  moreOpen: boolean;
  onToggleMore: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChangeTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
        className="min-h-[44px] cursor-pointer rounded-pill border border-line bg-surface px-3 text-sm font-semibold text-ink"
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>
      <LangSwitch locale={locale} onChangeLocale={onChangeLocale} />
      <button
        type="button"
        aria-expanded={moreOpen}
        onClick={onToggleMore}
        className="min-h-[44px] cursor-pointer rounded-pill border border-line bg-surface px-3 text-sm font-semibold text-ink md:hidden"
      >
        {t(locale, "app.more")}
      </button>
    </div>
  );
}
