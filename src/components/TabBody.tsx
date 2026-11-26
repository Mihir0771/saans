"use client";

import React, { useMemo } from "react";
import { computeFullPlan } from "@/engine/plan";
import type { AirBundle, HouseholdProfile } from "@/engine/schema";
import { AskView } from "./screens/AskView";
import { CommunityView } from "./screens/CommunityView";
import { HomeLabView } from "./screens/HomeLabView";
import { OnboardingView } from "./screens/OnboardingView";
import { PlanView } from "./screens/PlanView";
import { ProofView } from "./screens/ProofView";
import { TodayView } from "./screens/TodayView";
import type { AppTab } from "./ui/AppShell";
import type { MathDetail } from "./ui/MathDrawer";

export interface TabBodyProps {
  tab: AppTab;
  profile: HouseholdProfile;
  air: AirBundle;
  focusMemberId: string;
  activeActionIds: string[];
  onSelectMember: (id: string) => void;
  onToggleAction: (id: string) => void;
  onCalibrate: (v: number | undefined) => void;
  onSimTarget: (v: number | undefined) => void;
  onShowMath: (d: MathDetail) => void;
  onUpdateHome: (patch: Partial<HouseholdProfile["home"]>) => void;
  onOpenOnboarding: () => void;
  onOpenTutorial: () => void;
  onTrySharma: () => void;
  onTryAhmedabad: () => void;
  onSaveProfile: (p: HouseholdProfile) => void;
  onDeleteData: () => void;
}

export function TabBody(p: TabBodyProps) {
  const fullPlan = useMemo(
    () => computeFullPlan(p.profile, p.air, p.focusMemberId, p.activeActionIds),
    [p.profile, p.air, p.focusMemberId, p.activeActionIds],
  );
  if (p.tab === "today") return <TodayView {...p} fullPlan={fullPlan} />;
  if (p.tab === "plan") return <PlanView {...p} fullPlan={fullPlan} />;
  if (p.tab === "lab") return <HomeLabView {...p} />;
  if (p.tab === "ask") return <AskView {...p} />;
  if (p.tab === "community")
    return <CommunityView air={p.air} locale={p.profile.locale} cityName={p.profile.cityName} />;
  if (p.tab === "proof")
    return <ProofView locale={p.profile.locale} onDeleteAllData={p.onDeleteData} />;
  return (
    <OnboardingView
      {...p}
      onUseSharmaDemo={p.onTrySharma}
      onUseAhmedabadDemo={p.onTryAhmedabad}
      onOpenTutorial={p.onOpenTutorial}
    />
  );
}
