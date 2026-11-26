"use client";

import React from "react";
import type { Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { StatTile } from "./Primitives";

function GaugeRings({
  typArc,
  planArc,
  oneXDeg,
}: {
  typArc: number;
  planArc: number;
  oneXDeg: number;
}) {
  const c = { cx: 100, cy: 100, pathLength: 100 };
  return (
    <g>
      <g transform="rotate(135 100 100)" fill="none" strokeLinecap="round">
        <circle {...c} r="82" stroke="var(--surface-2)" strokeWidth="8" strokeDasharray="75 100" />
        <circle
          {...c}
          r="82"
          stroke="var(--typical)"
          strokeWidth="8"
          strokeDasharray={`${typArc} 100`}
        />
        <circle {...c} r="64" stroke="var(--surface-2)" strokeWidth="16" strokeDasharray="75 100" />
        <circle
          {...c}
          r="64"
          stroke="var(--plan)"
          strokeWidth="16"
          strokeDasharray={`${planArc} 100`}
        />
      </g>
      <g transform={`rotate(${oneXDeg} 100 100)`}>
        <line x1="170" y1="100" x2="196" y2="100" stroke="var(--ink)" strokeWidth="3" />
      </g>
    </g>
  );
}

function GaugeDial({
  memberName,
  typicalRatio,
  planRatio,
  locale,
}: {
  memberName: string;
  typicalRatio: number;
  planRatio: number;
  locale: Locale;
}) {
  const scaleMax = Math.max(20, Math.ceil(typicalRatio + 2));
  const typArc = Math.min(75, Math.max(0.5, (75 * typicalRatio) / scaleMax));
  const planArc = Math.min(75, Math.max(0.5, (75 * planRatio) / scaleMax));
  const oneXDeg = 135 + (270 * 1) / scaleMax;

  return (
    <div className="relative mx-auto mt-2 w-full max-w-[260px]">
      <svg
        className="block h-auto w-full"
        viewBox="0 10 200 160"
        role="img"
        aria-labelledby="gaugeTitle gaugeDesc"
      >
        <title id="gaugeTitle">{t(locale, "today.eyebrow")}</title>
        <desc id="gaugeDesc">
          {memberName}: {typicalRatio.toFixed(1)}× typical, {planRatio.toFixed(1)}× with Saans plan
        </desc>
        <GaugeRings typArc={typArc} planArc={planArc} oneXDeg={oneXDeg} />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-[10%] text-center">
        <div className="font-num text-[40px] font-extrabold leading-none text-brand-ink">
          {planRatio.toFixed(1)}×
        </div>
        <div className="mt-1 max-w-[13ch] text-sm text-ink-2">{t(locale, "today.withPlan")}</div>
      </div>
    </div>
  );
}

export function BreathGauge({
  memberName,
  typicalRatio,
  planRatio,
  savedPct,
  locale,
}: {
  memberName: string;
  typicalRatio: number;
  planRatio: number;
  savedPct: number;
  locale: Locale;
}) {
  return (
    <div>
      <GaugeDial
        memberName={memberName}
        typicalRatio={typicalRatio}
        planRatio={planRatio}
        locale={locale}
      />
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2 w-5 rounded bg-plan" aria-hidden="true" />
          {t(locale, "today.legendPlan")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-1 w-5 rounded bg-typical" aria-hidden="true" />
          {t(locale, "today.legendTypical")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-3.5 w-0.5 bg-ink" aria-hidden="true" />
          {t(locale, "today.legendTick")}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatTile value={`${typicalRatio.toFixed(1)}×`} label={t(locale, "today.statTypical")} />
        <StatTile value={`${planRatio.toFixed(1)}×`} label={t(locale, "today.statPlan")} />
        <StatTile value={`−${savedPct}%`} label={t(locale, "today.statSaved")} tone="save" />
      </div>
    </div>
  );
}
