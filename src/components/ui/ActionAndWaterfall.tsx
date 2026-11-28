"use client";

import React from "react";
import type { RankedAction } from "@/engine/actions/rank";
import type { Locale } from "@/engine/schema";
import type { WaterfallAttribution } from "@/engine/waterfall";
import { t } from "@/lib/i18n";

function EffortDots({ effort }: { effort: number }) {
  return <span aria-hidden="true">{[1, 2, 3].map((i) => (i <= effort ? "●" : "○")).join("")}</span>;
}

function formatCardBadges(action: RankedAction, locale: Locale) {
  const delta =
    action.deltaRatio >= 0.1
      ? `${action.deltaRatio.toFixed(1)}×`
      : `${Math.round(action.deltaUg)} µg`;
  const dose = `↓ ${delta} ${t(locale, "actions.doseUnit")}`;
  const cost =
    action.costOneTimeInr > 0
      ? `₹${action.costOneTimeInr.toLocaleString("en-IN")}`
      : t(locale, "actions.zeroExtra");
  return { dose, cost };
}

interface ActionCardProps {
  index: number;
  action: RankedAction;
  locale: Locale;
  onShowMath: (action: RankedAction) => void;
}

export function ActionCard({ index, action, locale, onShowMath }: ActionCardProps) {
  const { dose, cost } = formatCardBadges(action, locale);
  return (
    <article className="grid gap-2 rounded-lg border border-divider bg-surface p-4 shadow-[var(--shadow-1)]">
      <span
        aria-hidden="true"
        className="inline-grid h-7 w-7 place-items-center rounded-full bg-brand text-sm font-extrabold text-on-brand"
      >
        {index}
      </span>
      <h3 className="text-md font-bold leading-snug text-ink">{t(locale, action.titleKey)}</h3>
      <p className="text-sm text-ink-2">{t(locale, action.whyKey)}</p>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex min-h-[28px] items-center rounded-pill bg-brand-soft px-3 text-sm font-bold text-brand-ink">
          {dose}
        </span>
        <span className="inline-flex min-h-[28px] items-center rounded-pill bg-surface-2 px-3 text-sm font-bold text-ink">
          {cost}
        </span>
        <span className="inline-flex min-h-[28px] items-center gap-1 rounded-pill bg-surface-2 px-3 text-sm font-bold text-ink">
          {t(locale, "today.effort")} <EffortDots effort={Math.min(3, action.effort)} />
        </span>
      </div>
      <button
        type="button"
        onClick={() => onShowMath(action)}
        className="min-h-[44px] justify-self-start px-2 font-bold text-brand-ink underline underline-offset-4"
      >
        {t(locale, "today.showMath")}
      </button>
    </article>
  );
}

function ToggleSwitch({
  isOn,
  label,
  onToggle,
}: {
  isOn: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={label}
      onClick={onToggle}
      className="relative inline-flex h-[44px] w-[52px] shrink-0 cursor-pointer items-center bg-transparent p-0"
    >
      <span
        aria-hidden="true"
        className={`block h-[30px] w-[52px] rounded-full border-2 ${isOn ? "border-brand bg-brand" : "border-line bg-surface-2"}`}
      />
      <span
        aria-hidden="true"
        className={`absolute left-[5px] h-[20px] w-[20px] rounded-full transition-transform ${isOn ? "translate-x-[22px] bg-on-brand" : "translate-x-0 bg-ink-2"}`}
      />
    </button>
  );
}

function WaterfallRow({
  label,
  isOn,
  delta,
  leftPct,
  widthPct,
  offLabel,
  onToggle,
}: {
  label: string;
  isOn: boolean;
  delta: number;
  leftPct: number;
  widthPct: number;
  offLabel: string;
  onToggle: () => void;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-3">
        <ToggleSwitch isOn={isOn} label={label} onToggle={onToggle} />
        <span
          className={`flex-1 text-sm leading-snug ${isOn ? "font-semibold text-ink" : "font-normal text-ink-2"}`}
        >
          {label}
        </span>
        <span
          className={`min-w-[5ch] text-right font-num font-extrabold ${isOn ? "text-save" : "text-ink-2"}`}
        >
          {isOn ? `−${delta.toFixed(1)}×` : offLabel}
        </span>
      </div>
      <div className="relative h-[18px] rounded-[9px] bg-surface-2" aria-hidden="true">
        <div
          className="absolute inset-y-0 rounded-[9px] bg-save transition-all"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

function SummaryBarRow({
  label,
  value,
  colorClass,
  pct,
}: {
  label: string;
  value: number;
  colorClass: string;
  pct: number;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-ink">{label}</span>
        <span
          className={`font-num font-extrabold ${colorClass === "bg-typical" ? "text-typical" : "text-plan"}`}
        >
          {value.toFixed(1)}×
        </span>
      </div>
      <div className="relative h-[18px] rounded-[9px] bg-surface-2" aria-hidden="true">
        <div
          className={`absolute inset-y-0 left-0 rounded-[9px] ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function buildWaterfallRows(
  waterfall: WaterfallAttribution,
  allSteps: Array<{ id: string; titleKey: string; deltaRatio: number }>,
  activeIds: string[],
  onToggle: (id: string) => void,
  locale: Locale,
) {
  const base = Math.max(waterfall.baselineRatio, 0.1);
  let run = waterfall.baselineRatio;
  return allSteps.map((item) => {
    const isOn = activeIds.includes(item.id);
    const stepDelta = waterfall.steps.find((s) => s.actionId === item.id)?.deltaRatio;
    const d = isOn ? (stepDelta ?? item.deltaRatio) : 0;
    const end = Math.max(0, run - d);
    run = end;
    return (
      <WaterfallRow
        key={item.id}
        label={t(locale, item.titleKey)}
        isOn={isOn}
        delta={d}
        leftPct={(end / base) * 100}
        widthPct={(d / base) * 100}
        offLabel={t(locale, "actions.off")}
        onToggle={() => onToggle(item.id)}
      />
    );
  });
}

/** Interactive Shapley waterfall comparison between typical day and Saans plan. */
export function WaterfallList({
  waterfall,
  allSteps,
  activeIds,
  onToggle,
  locale,
}: {
  waterfall: WaterfallAttribution;
  allSteps: Array<{ id: string; titleKey: string; deltaRatio: number }>;
  activeIds: string[];
  onToggle: (id: string) => void;
  locale: Locale;
}) {
  const base = Math.max(waterfall.baselineRatio, 0.1);
  const rows = buildWaterfallRows(waterfall, allSteps, activeIds, onToggle, locale);
  const finalPct = Math.min(100, (waterfall.planRatio / base) * 100);
  return (
    <div className="grid gap-3">
      <SummaryBarRow
        label={t(locale, "plan.typicalDay")}
        value={waterfall.baselineRatio}
        colorClass="bg-typical"
        pct={100}
      />
      {rows}
      <SummaryBarRow
        label={t(locale, "plan.withSaansPlan")}
        value={waterfall.planRatio}
        colorClass="bg-plan"
        pct={finalPct}
      />
    </div>
  );
}
