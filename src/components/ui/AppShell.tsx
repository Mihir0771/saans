"use client";

import React, { useState } from "react";
import type { Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import type { ThemeMode } from "@/lib/storage";
import { BrandLogo, MobileBottomNav, SidebarNav, TopControls, type AppTab } from "./NavChrome";

export type { AppTab } from "./NavChrome";

function MoreMenuDrawer({
  open,
  locale,
  onPick,
}: {
  open: boolean;
  locale: Locale;
  onPick: (id: AppTab) => void;
}) {
  if (!open) return null;
  return (
    <div className="no-print mx-4 mb-3 flex flex-wrap gap-2 rounded-md border border-divider bg-surface p-3 md:hidden">
      {(["what", "community", "proof", "onboarding"] as AppTab[]).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onPick(id)}
          className="min-h-[44px] rounded-pill border border-line bg-surface-2 px-4 text-sm font-semibold text-ink"
        >
          {t(locale, `nav.${id}`)}
        </button>
      ))}
    </div>
  );
}

interface ShellProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  locale: Locale;
  onChangeLocale: (loc: Locale) => void;
  theme: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  placeLine: string;
  banner?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell(p: ShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div className="min-h-dvh pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+16px)] md:pb-8">
      <div className="mx-auto max-w-[1120px] md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 md:px-4">
        <SidebarNav activeTab={p.activeTab} onSelectTab={p.onSelectTab} locale={p.locale} />
        <div className="min-w-0">
          <header className="no-print flex flex-wrap items-center justify-between gap-2 px-4 pt-3 pb-2 md:px-0">
            <div className="md:hidden">
              <BrandLogo />
            </div>
            <p className="hidden text-sm text-ink-2 md:block">{p.placeLine}</p>
            <TopControls {...p} moreOpen={moreOpen} onToggleMore={() => setMoreOpen((v) => !v)} />
          </header>
          <p className="px-4 pb-2 text-sm text-ink-2 md:hidden">{p.placeLine}</p>
          <MoreMenuDrawer
            open={moreOpen}
            locale={p.locale}
            onPick={(id) => {
              p.onSelectTab(id);
              setMoreOpen(false);
            }}
          />
          {p.banner ? <div className="no-print px-4 pb-3 md:px-0">{p.banner}</div> : null}
          <main
            id="main-content"
            tabIndex={-1}
            className="grid min-w-0 gap-4 px-4 pb-6 md:px-0"
            lang={p.locale}
          >
            {p.children}
          </main>
        </div>
      </div>
      <MobileBottomNav activeTab={p.activeTab} onSelectTab={p.onSelectTab} locale={p.locale} />
    </div>
  );
}
