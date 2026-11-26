"use client";

import React from "react";
import type { CommuteComparison } from "@/engine/commute";
import type { FullPlanResult, MemberPlanResult } from "@/engine/plan";
import type { HouseholdProfile, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { buildPlanIcs } from "@/lib/ics";
import { WaterfallList } from "../ui/ActionAndWaterfall";
import { CumulativeDoseChart } from "../ui/CumulativeDoseChart";
import { Button, Card } from "../ui/Primitives";

function CommuteTableRows({ commutes }: { commutes: CommuteComparison[] }) {
  return (
    <tbody>
      {commutes.slice(0, 6).map((c) => (
        <tr key={c.mode} className="border-b border-divider">
          <td className="py-1.5 pr-3 font-semibold capitalize text-ink">
            {c.mode.replace("_", " ")}
          </td>
          <td className="py-1.5 pr-3 font-num">{Math.round(c.doseUg)} µg</td>
          <td className="py-1.5 pr-3 font-num">{c.co2g} g</td>
          <td className="py-1.5 pr-3 font-num">₹{c.costInr}</td>
          <td className="py-1.5 font-num">{c.durationMin}m</td>
        </tr>
      ))}
    </tbody>
  );
}

function CommuteParetoCard({
  commutes,
  locale,
}: {
  commutes: CommuteComparison[];
  locale: Locale;
}) {
  return (
    <Card aria-labelledby="commute-heading">
      <h2 id="commute-heading" className="text-lg font-bold text-ink">
        {t(locale, "plan.commuteTitle")}
      </h2>
      <p className="mb-2 text-sm text-ink-2">{t(locale, "plan.commuteSub")}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-divider text-left text-ink-2">
              <th scope="col" className="py-1.5 pr-3">
                {t(locale, "plan.mode")}
              </th>
              <th scope="col" className="py-1.5 pr-3">
                {t(locale, "plan.dose")}
              </th>
              <th scope="col" className="py-1.5 pr-3">
                {t(locale, "plan.co2")}
              </th>
              <th scope="col" className="py-1.5 pr-3">
                {t(locale, "plan.cost")}
              </th>
              <th scope="col" className="py-1.5">
                {t(locale, "plan.time")}
              </th>
            </tr>
          </thead>
          <CommuteTableRows commutes={commutes} />
        </table>
      </div>
    </Card>
  );
}

function triggerIcsDownload(
  memberName: string,
  cityName: string,
  plan: MemberPlanResult,
  fullPlan: FullPlanResult,
) {
  const ics = buildPlanIcs({
    memberName,
    cityName,
    plan,
    windows: fullPlan.windows,
    ventilation: fullPlan.ventilation,
  });
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `saans-${memberName.toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function WaterfallCard({
  memberName,
  mPlan,
  activeActionIds,
  onToggleAction,
  locale,
}: {
  memberName: string;
  mPlan: MemberPlanResult;
  activeActionIds: string[];
  onToggleAction: (id: string) => void;
  locale: Locale;
}) {
  const candidateActions = [
    ...mPlan.ranked.doNow,
    ...mPlan.ranked.thisWeek,
    ...mPlan.ranked.budgetAllows,
  ]
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .slice(0, 6);
  return (
    <Card aria-labelledby="wf-heading">
      <h2 id="wf-heading" className="text-lg font-bold text-ink">
        {t(locale, "plan.waterfallTitle")}
      </h2>
      <p className="mb-3 text-sm text-ink-2">{t(locale, "plan.waterfallSub")}</p>
      <div aria-live="polite" className="sr-only">
        {memberName}: {mPlan.waterfall.planRatio.toFixed(1)}×
      </div>
      <WaterfallList
        waterfall={mPlan.waterfall}
        allSteps={candidateActions}
        activeIds={activeActionIds}
        onToggle={onToggleAction}
        locale={locale}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex min-h-[28px] items-center rounded-pill bg-surface-2 px-3 text-sm font-bold text-ink">
          {t(locale, "plan.oneTimeCost")} ₹{mPlan.oneTimeCostInr.toLocaleString("en-IN")}
        </span>
        <span className="inline-flex min-h-[28px] items-center rounded-pill bg-surface-2 px-3 text-sm font-bold text-ink">
          {t(locale, "plan.dailyCost")} ₹{mPlan.dailyCostInr}
        </span>
      </div>
    </Card>
  );
}

interface PlanViewProps {
  profile: HouseholdProfile;
  fullPlan: FullPlanResult;
  focusMemberId: string;
  activeActionIds: string[];
  onToggleAction: (id: string) => void;
}

export function PlanView(p: PlanViewProps) {
  const locale = p.profile.locale;
  const member = p.profile.members.find((m) => m.id === p.focusMemberId) ?? p.profile.members[0];
  const mPlan = member ? p.fullPlan.memberPlans[member.id] : undefined;
  if (!member || !mPlan) return null;
  const dl = () => triggerIcsDownload(member.name, p.profile.cityName, mPlan, p.fullPlan);
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start">
      <Card aria-labelledby="cum-heading">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
          {t(locale, "plan.eyebrow")}
        </p>
        <h1 id="cum-heading" className="mt-1 text-lg font-bold text-ink">
          {t(locale, "plan.title")}
        </h1>
        <p className="mb-3 text-sm text-ink-2">{t(locale, "plan.subtitle")}</p>
        <CumulativeDoseChart
          typicalSeries={mPlan.baseline.hourlyCumulative}
          planSeries={mPlan.plan.hourlyCumulative}
          locale={locale}
        />
      </Card>
      <div className="grid gap-4">
        <WaterfallCard
          memberName={member.name}
          mPlan={mPlan}
          activeActionIds={p.activeActionIds}
          onToggleAction={p.onToggleAction}
          locale={locale}
        />
        <CommuteParetoCard commutes={mPlan.commutes} locale={locale} />
        <Button variant="primary" onClick={dl}>
          {t(locale, "plan.addCalendar")}
        </Button>
        <p className="text-xs text-ink-3">{t(locale, "plan.trustNote")}</p>
      </div>
    </div>
  );
}
