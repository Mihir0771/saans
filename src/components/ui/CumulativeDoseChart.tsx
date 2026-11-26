"use client";

import React, { useState } from "react";
import type { Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";

function CumulativeTable({
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

function AxisGrid({
  maxY,
  x,
  y,
}: {
  maxY: number;
  x: (h: number) => number;
  y: (v: number) => number;
}) {
  const ticks = [0, Math.round(maxY / 3), Math.round((2 * maxY) / 3), maxY];
  return (
    <g>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={34} x2={326} y1={y(v)} y2={y(v)} stroke="var(--divider)" strokeWidth="1" />
          <text x={28} y={y(v) + 4} textAnchor="end" className="fill-ink-2 text-[12px]">
            {v}×
          </text>
        </g>
      ))}
      {[0, 6, 12, 18, 24].map((h, i) => (
        <text key={h} x={x(h)} y={182} textAnchor="middle" className="fill-ink-2 text-[12px]">
          {["12a", "6a", "12p", "6p", "12a"][i]}
        </text>
      ))}
    </g>
  );
}

function PlotEndLabels({
  typEnd,
  planEnd,
  y,
}: {
  typEnd: number;
  planEnd: number;
  y: (v: number) => number;
}) {
  return (
    <>
      <text
        x={326}
        y={Math.max(24, y(typEnd) - 8)}
        textAnchor="end"
        className="text-[12px] font-bold"
        fill="var(--typical)"
      >
        {typEnd.toFixed(1)}×
      </text>
      <text
        x={326}
        y={Math.min(158, y(planEnd) + 16)}
        textAnchor="end"
        className="text-[12px] font-bold"
        fill="var(--plan)"
      >
        {planEnd.toFixed(1)}×
      </text>
    </>
  );
}

function CumulativePlot({
  typicalSeries,
  planSeries,
}: {
  typicalSeries: number[];
  planSeries: number[];
}) {
  const typEnd = typicalSeries[24] ?? 0;
  const planEnd = planSeries[24] ?? 0;
  const maxY = Math.max(15, Math.ceil(typEnd + 1));
  const x = (h: number) => 34 + (292 * h) / 24;
  const y = (v: number) => 164 - (150 * v) / maxY;
  const pT = typicalSeries.map((v, h) => `${x(h)},${y(v)}`);
  const pP = planSeries.map((v, h) => `${x(h)},${y(v)}`);
  return (
    <g>
      <AxisGrid maxY={maxY} x={x} y={y} />
      <polygon
        points={`${pT.join(" ")} ${[...pP].reverse().join(" ")}`}
        fill="var(--brand-soft)"
        opacity="0.85"
      />
      <polyline
        points={pT.join(" ")}
        fill="none"
        stroke="var(--typical)"
        strokeWidth="3"
        strokeDasharray="7 5"
        strokeLinecap="round"
      />
      <polyline
        points={pP.join(" ")}
        fill="none"
        stroke="var(--plan)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <PlotEndLabels typEnd={typEnd} planEnd={planEnd} y={y} />
    </g>
  );
}

export function CumulativeDoseChart({
  typicalSeries,
  planSeries,
  locale,
}: {
  typicalSeries: number[];
  planSeries: number[];
  locale: Locale;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <div>
      <svg
        className="block h-auto w-full"
        viewBox="0 0 336 200"
        role="img"
        aria-labelledby="cumTitle cumDesc"
      >
        <title id="cumTitle">{t(locale, "plan.title")}</title>
        <desc id="cumDesc">
          Typical {(typicalSeries[24] ?? 0).toFixed(1)}× vs Saans plan{" "}
          {(planSeries[24] ?? 0).toFixed(1)}×
        </desc>
        <CumulativePlot typicalSeries={typicalSeries} planSeries={planSeries} />
      </svg>
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
      <button
        type="button"
        aria-expanded={showTable}
        aria-controls="cum-data-table"
        onClick={() => setShowTable((v) => !v)}
        className="mt-1 min-h-[44px] px-2 font-bold text-brand-ink underline underline-offset-4"
      >
        {showTable ? t(locale, "today.hideTable") : t(locale, "today.viewTable")}
      </button>
      {showTable ? (
        <CumulativeTable typicalSeries={typicalSeries} planSeries={planSeries} locale={locale} />
      ) : null}
    </div>
  );
}
