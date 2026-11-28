"use client";

import React, { useMemo } from "react";
import { simulateIndoor24h } from "@/engine/indoor";
import type { AirBundle, HouseholdProfile, Locale } from "@/engine/schema";
import { findSmartVentilationWindow } from "@/engine/windows";
import { t } from "@/lib/i18n";
import { Card } from "../ui/Primitives";
import { IndoorBandSvg } from "./HomeLabChart";
import { CrBoxGuide, LabControls } from "./HomeLabWidgets";
import { SnapConfirmCard } from "./SnapConfirmCard";

function VentilationCard({ locale, text }: { locale: Locale; text: string }) {
  return (
    <Card aria-labelledby="vent-heading">
      <h2 id="vent-heading" className="text-lg font-bold text-ink">
        {t(locale, "lab.ventTitle")}
      </h2>
      <p className="mt-2 text-sm text-ink-2">{text}</p>
    </Card>
  );
}

function useLabSimulation(profile: HouseholdProfile, air: AirBundle) {
  const outdoor = useMemo(() => air.hours.slice(0, 24).map((h) => h.pm25), [air.hours]);
  const sim = useMemo(
    () =>
      simulateIndoor24h({
        home: profile.home,
        outdoorPm25: outdoor,
        windowStates: Array.from({ length: 24 }, () => "closed"),
        cookingHours: [8, 20],
      }),
    [profile.home, outdoor],
  );
  const vent = useMemo(
    () => findSmartVentilationWindow(profile.home, air.hours),
    [profile.home, air.hours],
  );
  return { outdoor, sim, vent };
}

/** Interactive 24-hour indoor mass-balance simulator, smart airing window finder, CR box guide, and label scanner. */
export function HomeLabView({
  profile,
  air,
  onUpdateHome,
}: {
  profile: HouseholdProfile;
  air: AirBundle;
  onUpdateHome: (patch: Partial<HouseholdProfile["home"]>) => void;
}) {
  const locale = profile.locale;
  const { outdoor, sim, vent } = useLabSimulation(profile, air);
  const ventText = vent.hasWindow
    ? `${t(locale, "lab.vent_found")} ${vent.startHour}:00 (${vent.durationMin} min, −${vent.estimatedDropPct}%)`
    : t(locale, "lab.vent_none");
  const applyCadr = (cadrM3h: number) =>
    onUpdateHome({
      purifier: { ...profile.home.purifier, enabled: true, cadrM3h, hoursPerDay: 24 },
    });

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start">
      <Card aria-labelledby="lab-heading">
        <h1 id="lab-heading" className="text-lg font-bold text-ink">
          {t(locale, "lab.title")}
        </h1>
        <p className="mb-3 text-sm text-ink-2">{t(locale, "lab.subtitle")}</p>
        <IndoorBandSvg
          outdoor={outdoor}
          low={sim.low}
          central={sim.central}
          high={sim.high}
          locale={locale}
        />
        <LabControls home={profile.home} locale={locale} onUpdateHome={onUpdateHome} />
      </Card>
      <div className="grid gap-4">
        <VentilationCard locale={locale} text={ventText} />
        <CrBoxGuide locale={locale} />
        <SnapConfirmCard locale={locale} onApplyCadr={applyCadr} />
      </div>
    </div>
  );
}
