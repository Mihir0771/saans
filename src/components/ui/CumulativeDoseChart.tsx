"use client";

import React, { useState } from "react";
import type { Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { pointerRatioInSvg } from "@/lib/svg-pointer";
import { CumulativeTable, DoseLegend, DoseScrubReadout } from "./CumulativeDoseExtras";

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
  scrubHour,
}: {
  typicalSeries: number[];
  planSeries: number[];
  scrubHour: number;
}) {
  const typEnd = typicalSeries[24] ?? 0;
  const planEnd = planSeries[24] ?? 0;
  const maxY = Math.max(15, Math.ceil(typEnd + 1));
  const x = (h: number) => 34 + (292 * h) / 24;
  const y = (v: number) => 164 - (150 * v) / maxY;
  const pT = typicalSeries.map((v, h) => `${x(h)},${y(v)}`);
  const pP = planSeries.map((v, h) => `${x(h)},${y(v)}`);
  const cx = x(scrubHour);
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
      <line x1={cx} y1={14} x2={cx} y2={164} stroke="var(--ink)" strokeDasharray="3 3" />
      <circle cx={cx} cy={y(typicalSeries[scrubHour] ?? 0)} r={5} fill="var(--typical)" />
      <circle cx={cx} cy={y(planSeries[scrubHour] ?? 0)} r={5.5} fill="var(--plan)" />
      <PlotEndLabels typEnd={typEnd} planEnd={planEnd} y={y} />
    </g>
  );
}

function hourFromPointer(e: React.PointerEvent<SVGSVGElement>): number {
  return Math.round(pointerRatioInSvg(e, 336, 34, 326) * 24);
}

function DoseScrubber({
  scrubHour,
  locale,
  onChange,
}: {
  scrubHour: number;
  locale: Locale;
  onChange: (h: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={24}
        value={scrubHour}
        aria-label={t(locale, "plan.scrubHint")}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 flex-1 accent-[var(--brand)]"
      />
      <span className="text-xs text-ink-3">{t(locale, "plan.scrubHint")}</span>
    </div>
  );
}

function DoseTableSection({
  showTable,
  onToggle,
  typicalSeries,
  planSeries,
  locale,
}: {
  showTable: boolean;
  onToggle: () => void;
  typicalSeries: number[];
  planSeries: number[];
  locale: Locale;
}) {
  return (
    <>
      <button
        type="button"
        aria-expanded={showTable}
        aria-controls="cum-data-table"
        onClick={onToggle}
        className="mt-1 min-h-[44px] px-2 font-bold text-brand-ink underline underline-offset-4"
      >
        {showTable ? t(locale, "today.hideTable") : t(locale, "today.viewTable")}
      </button>
      {showTable ? (
        <CumulativeTable typicalSeries={typicalSeries} planSeries={planSeries} locale={locale} />
      ) : null}
    </>
  );
}

function CumulativeChartSvg({
  typicalSeries,
  planSeries,
  scrubHour,
  locale,
  onPointer,
}: {
  typicalSeries: number[];
  planSeries: number[];
  scrubHour: number;
  locale: Locale;
  onPointer: (e: React.PointerEvent<SVGSVGElement>) => void;
}) {
  return (
    <svg
      className="block h-auto w-full cursor-crosshair select-none"
      viewBox="0 0 336 200"
      role="img"
      aria-labelledby="cumTitle cumDesc"
      onPointerDown={onPointer}
      onPointerMove={onPointer}
    >
      <title id="cumTitle">{t(locale, "plan.title")}</title>
      <desc id="cumDesc">
        Typical {(typicalSeries[24] ?? 0).toFixed(1)}× vs Saans plan{" "}
        {(planSeries[24] ?? 0).toFixed(1)}×
      </desc>
      <CumulativePlot typicalSeries={typicalSeries} planSeries={planSeries} scrubHour={scrubHour} />
    </svg>
  );
}

export function CumulativeDoseChart(p: {
  typicalSeries: number[];
  planSeries: number[];
  locale: Locale;
}) {
  const [showTable, setShowTable] = useState(false);
  const [scrubHour, setScrubHour] = useState(24);
  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons === 1 || e.type === "pointerdown") setScrubHour(hourFromPointer(e));
  };
  return (
    <div>
      <DoseScrubReadout
        hour={scrubHour}
        typVal={p.typicalSeries[scrubHour] ?? 0}
        planVal={p.planSeries[scrubHour] ?? 0}
        locale={p.locale}
      />
      <CumulativeChartSvg
        typicalSeries={p.typicalSeries}
        planSeries={p.planSeries}
        scrubHour={scrubHour}
        locale={p.locale}
        onPointer={onPointer}
      />
      <DoseScrubber scrubHour={scrubHour} locale={p.locale} onChange={setScrubHour} />
      <DoseLegend locale={p.locale} />
      <DoseTableSection
        showTable={showTable}
        onToggle={() => setShowTable((v) => !v)}
        typicalSeries={p.typicalSeries}
        planSeries={p.planSeries}
        locale={p.locale}
      />
    </div>
  );
}
