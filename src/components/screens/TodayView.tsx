"use client";

import React from "react";
import type { RankedAction } from "@/engine/actions/rank";
import type { FullPlanResult, MemberPlanResult } from "@/engine/plan";
import type { AirBundle, FamilyMember, HouseholdProfile, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { ActionCard } from "../ui/ActionAndWaterfall";
import { BreathGauge } from "../ui/BreathGauge";
import { HourlyStripChart } from "../ui/HourlyStripChart";
import type { MathDetail } from "../ui/MathDrawer";
import { Card } from "../ui/Primitives";
import { TodayAirCard } from "./TodayAirCard";

function formatFetchedTime(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "07:00";
  }
}

function MemberSwitcher({
  members,
  activeId,
  onSelect,
}: {
  members: FamilyMember[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="mt-3 flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1"
      role="group"
      aria-label="Family member"
    >
      {members.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-pressed={m.id === activeId}
          onClick={() => onSelect(m.id)}
          className={`flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 rounded-pill border px-3 pl-1 font-semibold ${m.id === activeId ? "border-brand bg-surface text-ink shadow-[inset_0_0_0_2px_var(--brand)]" : "border-line bg-surface text-ink"}`}
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft font-extrabold text-brand-ink"
          >
            {m.avatarEmoji}
          </span>
          <span>{m.name}</span>
        </button>
      ))}
    </div>
  );
}

function actionMathDetail(
  action: RankedAction,
  memberName: string,
  ageBand: string,
  locale: Locale,
): MathDetail {
  return {
    title: t(locale, action.titleKey),
    formula: "dose(m) = Σ_h t · BR(age, activity) · C_e(h) · (1 − protection)",
    inputs: [
      `${memberName} · ${ageBand}`,
      `Δ dose: −${action.deltaRatio.toFixed(2)}× WHO (−${Math.round(action.deltaUg)} µg)`,
      `Effort: ${action.effort}/5 · ₹${action.costOneTimeInr}`,
    ],
    source: "WHO 2021 (15 µg/m³), US EPA EFH Ch.6, indoor mass-balance",
    confidence: action.confidence,
  };
}

function TodayRightColumn({
  air,
  fullPlan,
  mPlan,
  focusMember,
  locale,
  onShowMath,
}: {
  air: AirBundle;
  fullPlan: FullPlanResult;
  mPlan: MemberPlanResult;
  focusMember: FamilyMember;
  locale: Locale;
  onShowMath: (d: MathDetail) => void;
}) {
  const show = (a: RankedAction) =>
    onShowMath(actionMathDetail(a, focusMember.name, focusMember.ageBand, locale));
  const best = fullPlan.windows.bestStartHour;
  const worst = fullPlan.windows.worstStartHour;
  return (
    <div className="grid min-w-0 gap-4">
      <Card aria-labelledby="next24-heading">
        <h2 id="next24-heading" className="text-lg font-bold text-ink">
          {t(locale, "today.next24")}
        </h2>
        <p className="mb-3 text-sm text-ink-2">{t(locale, "today.next24Sub")}</p>
        <HourlyStripChart hours={air.hours} bestStart={best} worstStart={worst} locale={locale} />
      </Card>
      <section aria-labelledby="do-now-heading" className="grid gap-3">
        <h2 id="do-now-heading" className="text-xl font-bold text-ink">
          {t(locale, "today.doNowTitle")}
        </h2>
        {mPlan.ranked.doNow.slice(0, 3).map((act, idx) => (
          <ActionCard key={act.id} index={idx + 1} action={act} locale={locale} onShowMath={show} />
        ))}
      </section>
      <p className="text-xs leading-relaxed text-ink-3">
        {t(locale, "today.trustFooter")} ({formatFetchedTime(air.fetchedAt, locale)})
      </p>
    </div>
  );
}

function TodayBudgetCard({
  members,
  focusMember,
  mPlan,
  locale,
  onSelectMember,
}: {
  members: FamilyMember[];
  focusMember: FamilyMember;
  mPlan: MemberPlanResult;
  locale: Locale;
  onSelectMember: (id: string) => void;
}) {
  return (
    <Card aria-labelledby="bb-heading">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
        {t(locale, "today.eyebrow")}
      </p>
      <h1 id="bb-heading" className="mt-1 text-lg font-bold leading-tight text-ink">
        {t(locale, "today.title")}
      </h1>
      <MemberSwitcher members={members} activeId={focusMember.id} onSelect={onSelectMember} />
      <BreathGauge
        memberName={focusMember.name}
        typicalRatio={mPlan.waterfall.baselineRatio}
        planRatio={mPlan.waterfall.planRatio}
        savedPct={mPlan.waterfall.totalSavedPct}
        locale={locale}
      />
    </Card>
  );
}

interface TodayViewProps {
  profile: HouseholdProfile;
  air: AirBundle;
  fullPlan: FullPlanResult;
  focusMemberId: string;
  onSelectMember: (id: string) => void;
  onCalibrate: (pm25: number | undefined) => void;
  onSimTarget: (mean: number | undefined) => void;
  onShowMath: (detail: MathDetail) => void;
  onOpenOnboarding: () => void;
}

export function TodayView(p: TodayViewProps) {
  const focus = p.profile.members.find((m) => m.id === p.focusMemberId) ?? p.profile.members[0];
  const mPlan = focus ? p.fullPlan.memberPlans[focus.id] : undefined;
  if (!focus || !mPlan) return null;
  const loc = p.profile.locale;
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start">
      <div className="grid min-w-0 gap-4">
        <TodayBudgetCard
          members={p.profile.members}
          focusMember={focus}
          mPlan={mPlan}
          locale={loc}
          onSelectMember={p.onSelectMember}
        />
        <TodayAirCard
          air={p.air}
          fullPlan={p.fullPlan}
          locale={loc}
          onCalibrate={p.onCalibrate}
          onSimTarget={p.onSimTarget}
          onOpenOnboarding={p.onOpenOnboarding}
        />
      </div>
      <TodayRightColumn
        air={p.air}
        fullPlan={p.fullPlan}
        mPlan={mPlan}
        focusMember={focus}
        locale={loc}
        onShowMath={p.onShowMath}
      />
    </div>
  );
}
