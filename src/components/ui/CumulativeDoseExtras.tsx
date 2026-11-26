"use client";

import React from "react";
import type { Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";

export function DoseLegend({ locale }: { locale: Locale }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm text-ink-2">
      <span className="inline-flex items-center gap-1.5">
        <i className="inline-block h-1 w-5 rounded bg-typical" aria-hidden="true" />
        {t(locale, "plan.typicalDashed")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="inline-block h-2 w-5 rounded bg-plan" aria-hidden="true" />
        {t(locale, "plan.planSolid")}
      </span>
    </div>
  );
}

export function DoseScrubReadout({
  hour,
  typVal,
  planVal,
  locale,
}: {
  hour: number;
  typVal: number;
  planVal: number;
  locale: Locale;
}) {
  const saved = Math.max(0, typVal - planVal);
  const pct = typVal > 0 ? Math.round((saved / typVal) * 100) : 0;
  return (
    <div
      aria-live="polite"
      className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-divider bg-surface-2 px-3 py-2 text-sm"
    >
      <span className="font-num font-extrabold text-ink">
        {String(hour % 24).padStart(2, "0")}:00
      </span>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span>
          {t(locale, "today.statTypical")}:{" "}
          <strong className="font-num text-typical">{typVal.toFixed(1)}×</strong>
        </span>
        <span>
          {t(locale, "today.statPlan")}:{" "}
          <strong className="font-num text-plan">{planVal.toFixed(1)}×</strong>
        </span>
        <span className="rounded-pill bg-brand-soft px-2 py-0.5 font-num font-bold text-brand-ink">
          {t(locale, "plan.savedAt")}: −{saved.toFixed(1)}× (−{pct}%)
        </span>
      </div>
    </div>
  );
}

export function CumulativeTable({
  typicalSeries,
  planSeries,
  locale,
}: {
  typicalSeries: number[];
  planSeries: number[];
  locale: Locale;
}) {
  return (
    <div id="cum-data-table" className="mt-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="pb-2 text-left text-ink-2">{t(locale, "plan.subtitle")}</caption>
        <thead>
          <tr className="border-b border-divider text-left">
            <th scope="col" className="py-1.5 pr-3">
              Time
            </th>
            <th scope="col" className="py-1.5 pr-3">
              {t(locale, "today.statTypical")}
            </th>
            <th scope="col" className="py-1.5">
              {t(locale, "today.statPlan")}
            </th>
          </tr>
        </thead>
        <tbody>
          {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
            <tr key={h} className="border-b border-divider">
              <td className="py-1 pr-3 font-num">{String(h % 24).padStart(2, "0")}:00</td>
              <td className="py-1 pr-3 font-num">{(typicalSeries[h] ?? 0).toFixed(1)}×</td>
              <td className="py-1 font-num">{(planSeries[h] ?? 0).toFixed(1)}×</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
