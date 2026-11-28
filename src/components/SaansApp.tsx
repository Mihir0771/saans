"use client";

import React, { useEffect, useState } from "react";
import type { AirBundle, Locale } from "@/engine/schema";
import type { DemoKind } from "@/lib/ahmedabad-fixture";
import { t } from "@/lib/i18n";
import {
  clearAllStoredData,
  loadTutorialDismissed,
  saveStoredProfile,
  saveTutorialDismissed,
} from "@/lib/storage";
import { useAirData, useSaansController } from "@/lib/use-saans";
import { TabBody } from "./TabBody";
import { AppShell } from "./ui/AppShell";
import { MathDrawer } from "./ui/MathDrawer";
import { Banner, SkeletonCard } from "./ui/Primitives";
import { TutorialModal } from "./ui/TutorialModal";

function demoBannerKey(demoKind: DemoKind | false, source: AirBundle["source"]): string | null {
  if (demoKind === "ahmedabad" || source === "demo-ahmedabad") return "banners.demoAhmedabad";
  if (demoKind === "sharma" || source === "demo-sharma") return "banners.demo";
  return null;
}

function StatusBanner({
  air,
  demoKind,
  locale,
  onTrySharma,
  onClearCal,
}: {
  air: AirBundle;
  demoKind: DemoKind | false;
  locale: Locale;
  onTrySharma: () => void;
  onClearCal: () => void;
}) {
  const demoKey = demoBannerKey(demoKind, air.source);
  if (demoKey) return <Banner label={t(locale, "banners.labelDemo")} text={t(locale, demoKey)} />;
  if (air.simulationTargetMean !== undefined)
    return <Banner label={t(locale, "banners.labelSim")} text={t(locale, "banners.simulation")} />;
  if (air.calibrationScale !== 1)
    return (
      <Banner
        label={`${t(locale, "banners.calibrated")} ×${air.calibrationScale}.`}
        text=""
        actionLabel={t(locale, "banners.undo")}
        onAction={onClearCal}
      />
    );
  const offline = air.source === "offline-sample";
  const labelKey = offline
    ? "banners.labelOffline"
    : air.stale
      ? "banners.labelStale"
      : "banners.labelLive";
  const key = offline ? "banners.offline" : air.stale ? "banners.stale" : "today.modelEstimate";
  return (
    <Banner
      label={t(locale, labelKey)}
      text={t(locale, key)}
      actionLabel={t(locale, "banners.trySharma")}
      onAction={onTrySharma}
    />
  );
}

function saveUserProfile(s: ReturnType<typeof useSaansController>, next: typeof s.profile) {
  s.setDemoKind(false);
  saveStoredProfile(next);
  s.setProfile(next);
  s.setTab("today");
}

function SaansContent({
  s,
  air,
  loadingAir,
  autoPlayWalkthrough,
  onOpenTutorial,
}: {
  s: ReturnType<typeof useSaansController>;
  air: AirBundle;
  loadingAir: boolean;
  autoPlayWalkthrough: boolean;
  onOpenTutorial: () => void;
}) {
  return (
    <>
      {loadingAir && !air.hours.length ? (
        <SkeletonCard label={t(s.profile.locale, "app.loading")} />
      ) : null}
      <TabBody
        tab={s.tab}
        profile={s.profile}
        air={air}
        focusMemberId={s.focusMemberId}
        activeActionIds={s.activeActionIds}
        onSelectMember={s.selectMember}
        onToggleAction={s.toggleAction}
        onCalibrate={s.setCalibratePm}
        onSimTarget={s.setSimMean}
        onShowMath={s.setMathDetail}
        onUpdateHome={s.updateHome}
        onOpenOnboarding={() => s.setTab("onboarding")}
        onOpenAsk={() => s.setTab("ask")}
        onOpenTutorial={onOpenTutorial}
        autoPlayWalkthrough={autoPlayWalkthrough}
        onTrySharma={s.activateSharmaDemo}
        onTryAhmedabad={s.activateAhmedabadDemo}
        onSaveProfile={(next) => saveUserProfile(s, next)}
        onDeleteData={() => {
          clearAllStoredData();
          s.activateSharmaDemo();
        }}
      />
      <MathDrawer
        detail={s.mathDetail}
        locale={s.profile.locale}
        onClose={() => s.setMathDetail(null)}
      />
    </>
  );
}

function AppTutorial({
  open,
  s,
  onClose,
  onOpenWhat,
}: {
  open: boolean;
  s: ReturnType<typeof useSaansController>;
  onClose: (dontShow: boolean) => void;
  onOpenWhat: (dontShow: boolean) => void;
}) {
  return (
    <TutorialModal
      open={open}
      locale={s.profile.locale}
      onClose={onClose}
      onPickWhat={onOpenWhat}
      onPickSharma={(d) => {
        onClose(d);
        s.activateSharmaDemo();
      }}
      onPickAhmedabad={(d) => {
        onClose(d);
        s.activateAhmedabadDemo();
      }}
      onPickCity={(d) => {
        onClose(d);
        s.setTab("onboarding");
      }}
    />
  );
}

function formatPlaceLine(cityName: string, hours: AirBundle["hours"]): string {
  const pmVal = hours[0]?.pm25;
  return typeof pmVal === "number" ? `${cityName} · ${Math.round(pmVal)} µg/m³` : cityName;
}

export function SaansApp({ initialDemo = false }: { initialDemo?: DemoKind | false }) {
  const s = useSaansController(initialDemo);
  const { air, loadingAir } = useAirData(s.profile, s.demoKind, s.calibratePm, s.simMean);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [autoPlayWhat, setAutoPlayWhat] = useState(false);
  useEffect(() => {
    if (!loadTutorialDismissed()) setTutorialOpen(true);
  }, []);
  const closeTutorial = (dontShow: boolean) => {
    if (dontShow) saveTutorialDismissed(true);
    setTutorialOpen(false);
  };
  const openWhat = (dontShow: boolean) => {
    closeTutorial(dontShow);
    setAutoPlayWhat(true);
    s.setTab("what");
  };
  const banner = (
    <StatusBanner
      air={air}
      demoKind={s.demoKind}
      locale={s.profile.locale}
      onTrySharma={s.activateSharmaDemo}
      onClearCal={() => s.setCalibratePm(undefined)}
    />
  );
  return (
    <AppShell
      activeTab={s.tab}
      onSelectTab={s.setTab}
      locale={s.profile.locale}
      onChangeLocale={s.changeLocale}
      theme={s.theme}
      onChangeTheme={s.changeTheme}
      placeLine={formatPlaceLine(s.profile.cityName, air.hours)}
      banner={banner}
    >
      <SaansContent
        s={s}
        air={air}
        loadingAir={loadingAir}
        autoPlayWalkthrough={autoPlayWhat}
        onOpenTutorial={() => setTutorialOpen(true)}
      />
      <AppTutorial open={tutorialOpen} s={s} onClose={closeTutorial} onOpenWhat={openWhat} />
    </AppShell>
  );
}
