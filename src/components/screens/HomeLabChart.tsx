"use client";

import React, { useState } from "react";
import type { Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { pointerRatioInSvg } from "@/lib/svg-pointer";

const BOX = { l: 34, r: 326, t: 14, b: 156 };

function LabGrid({ maxY, y }: { maxY: number; y: (v: number) => number }) {
  return (
    <>
      {[0, 0.5, 1].map((frac) => {
        const val = Math.round(maxY * frac);
        const yy = y(val);
        return (
          <g key={frac}>
            <line x1={BOX.l} x2={BOX.r} y1={yy} y2={yy} stroke="var(--divider)" strokeWidth="1" />
            <text x={BOX.l - 6} y={yy + 4} textAnchor="end" className="fill-ink-2 text-[11px]">
              {val}
            </text>
          </g>
        );
      })}
    </>
  );
}

function LabEndLabels({ outY, inY, locale }: { outY: number; inY: number; locale: Locale }) {
  return (
    <>
      <text
        x={BOX.r}
        y={Math.max(20, outY - 6)}
        textAnchor="end"
        className="text-[11px] font-bold"
        fill="var(--typical)"
      >
        {t(locale, "lab.outdoor")}
      </text>
      <text
        x={BOX.r}
        y={Math.min(BOX.b - 4, inY + 14)}
        textAnchor="end"
        className="text-[11px] font-bold"
        fill="var(--plan)"
      >
        {t(locale, "lab.indoor")}
      </text>
    </>
  );
}

function LabScrubReadout({
  hour,
  outdoorVal,
  indoorVal,
  lowVal,
  highVal,
  locale,
}: {
  hour: number;
  outdoorVal: number;
  indoorVal: number;
  lowVal: number;
  highVal: number;
  locale: Locale;
}) {
  const dropPct =
    outdoorVal > 0 ? Math.max(0, Math.round(((outdoorVal - indoorVal) / outdoorVal) * 100)) : 0;
  return (
    <div
      aria-live="polite"
      className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-divider bg-surface-2 px-3 py-2 text-xs"
    >
      <span className="font-num text-sm font-extrabold text-ink">
        {String(hour).padStart(2, "0")}:00
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <span>
          {t(locale, "lab.outdoor")}:{" "}
          <strong className="font-num text-typical">{Math.round(outdoorVal)} µg/m³</strong>
        </span>
        <span>
          {t(locale, "lab.indoor")}:{" "}
          <strong className="font-num text-plan">{Math.round(indoorVal)} µg/m³</strong> (
          {Math.round(lowVal)}–{Math.round(highVal)})
        </span>
        <span className="rounded-pill bg-brand-soft px-2 py-0.5 font-num font-bold text-brand-ink">
          −{dropPct}% {t(locale, "lab.cleaner")}
        </span>
      </div>
    </div>
  );
}

function labHourFromPointer(e: React.PointerEvent<SVGSVGElement>): number {
  return Math.round(pointerRatioInSvg(e, 336, BOX.l, BOX.r) * 23);
}

interface PlotProps {
  outdoor: number[];
  low: number[];
  central: number[];
  high: number[];
  hour: number;
  locale: Locale;
  onPointer: (e: React.PointerEvent<SVGSVGElement>) => void;
}

function IndoorBandPlot(p: PlotProps) {
  const maxY = Math.max(200, ...p.outdoor, ...p.high);
  const x = (h: number) => BOX.l + ((BOX.r - BOX.l) * h) / 23;
  const y = (v: number) => BOX.b - ((BOX.b - BOX.t) * v) / maxY;
  const poly = `${p.high.map((v, h) => `${x(h)},${y(v)}`).join(" ")} ${[...p.low]
    .reverse()
    .map((v, i) => `${x(23 - i)},${y(v)}`)
    .join(" ")}`;
  const line = (arr: number[]) => arr.map((v, h) => `${x(h)},${y(v)}`).join(" ");
  const cx = x(p.hour);
  return (
    <svg
      className="block h-auto w-full cursor-crosshair select-none"
      viewBox="0 0 336 184"
      role="img"
      aria-labelledby="labChartTitle labChartDesc"
      onPointerDown={p.onPointer}
      onPointerMove={p.onPointer}
    >
      <title id="labChartTitle">{t(p.locale, "lab.title")}</title>
      <desc id="labChartDesc">{t(p.locale, "lab.subtitle")}</desc>
      <LabGrid maxY={maxY} y={y} />
      <polygon points={poly} fill="var(--brand-soft)" opacity="0.7" />
      <polyline
        points={line(p.outdoor)}
        fill="none"
        stroke="var(--typical)"
        strokeWidth="2.5"
        strokeDasharray="6 4"
      />
      <polyline points={line(p.central)} fill="none" stroke="var(--plan)" strokeWidth="3" />
      <line x1={cx} y1={BOX.t} x2={cx} y2={BOX.b} stroke="var(--ink)" strokeDasharray="3 3" />
      <circle cx={cx} cy={y(p.outdoor[p.hour] ?? 0)} r={4.5} fill="var(--typical)" />
      <circle cx={cx} cy={y(p.central[p.hour] ?? 0)} r={5} fill="var(--plan)" />
      <LabEndLabels outY={y(p.outdoor[23] ?? 0)} inY={y(p.central[23] ?? 0)} locale={p.locale} />
    </svg>
  );
}

export function IndoorBandSvg({
  outdoor,
  low,
  central,
  high,
  locale = "en",
}: {
  outdoor: number[];
  low: number[];
  central: number[];
  high: number[];
  locale?: Locale;
}) {
  const [hour, setHour] = useState(8);
  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons === 1 || e.type === "pointerdown") setHour(labHourFromPointer(e));
  };
  return (
    <div>
      <LabScrubReadout
        hour={hour}
        outdoorVal={outdoor[hour] ?? 0}
        indoorVal={central[hour] ?? 0}
        lowVal={low[hour] ?? 0}
        highVal={high[hour] ?? 0}
        locale={locale}
      />
      <IndoorBandPlot
        outdoor={outdoor}
        low={low}
        central={central}
        high={high}
        hour={hour}
        locale={locale}
        onPointer={onPointer}
      />
      <input
        type="range"
        min={0}
        max={23}
        value={hour}
        aria-label={t(locale, "plan.scrubHint")}
        onChange={(e) => setHour(Number(e.target.value))}
        className="mt-2 h-6 w-full accent-[var(--brand)]"
      />
    </div>
  );
}
