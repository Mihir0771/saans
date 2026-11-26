"use client";

import React, { useState } from "react";
import { aqiToBand, computeCpcbAqi } from "@/engine/aqi";
import type { AirHour, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { BandShapeIcon } from "./AQIChip";

const pmBand = (pm: number) => aqiToBand(computeCpcbAqi({ pm25: pm }).aqi);

function HourlyStripTable({ slice, locale }: { slice: AirHour[]; locale: Locale }) {
  return (
    <div id="hourly-data-table" className="mt-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="pb-2 text-left text-ink-2">{t(locale, "today.next24Sub")}</caption>
        <thead>
          <tr className="border-b border-divider text-left">
            <th scope="col" className="py-1.5 pr-3">
              Hour
            </th>
            <th scope="col" className="py-1.5 pr-3">
              PM2.5 (µg/m³)
            </th>
            <th scope="col" className="py-1.5">
              Band
            </th>
          </tr>
        </thead>
        <tbody>
          {slice.map((h) => (
            <tr key={h.hourLocal} className="border-b border-divider">
              <td className="py-1 pr-3 font-num">{String(h.hourLocal).padStart(2, "0")}:00</td>
              <td className="py-1 pr-3 font-num">{Math.round(h.pm25)}</td>
              <td className="py-1">{t(locale, `aqiBands.${pmBand(h.pm25)}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StripBars({ slice }: { slice: AirHour[] }) {
  const maxPm = Math.max(200, ...slice.map((h) => h.pm25));
  return (
    <g>
      {[0, 6, 12, 18].map((h, i) => (
        <text
          key={h}
          x={h * 14 + 5.5}
          y={124}
          textAnchor={i === 0 ? "start" : "middle"}
          className="fill-ink-2 text-[12px]"
        >
          {["12a", "6a", "12p", "6p"][i]}
        </text>
      ))}
      {slice.map((hr, idx) => {
        const bh = Math.max(4, (hr.pm25 / maxPm) * 78);
        const b = pmBand(hr.pm25);
        return (
          <rect
            key={hr.hourLocal}
            x={idx * 14}
            y={108 - bh}
            width={11}
            height={bh}
            rx={2.5}
            fill={`var(--aqi-${b}-fill)`}
            stroke={`var(--aqi-${b}-edge)`}
            strokeWidth={1.5}
          />
        );
      })}
      <line x1="0" y1={108} x2="336" y2={108} stroke="var(--line)" strokeWidth="1" />
    </g>
  );
}

function WindowMarkers({
  bestStart,
  worstStart,
  locale,
}: {
  bestStart: number;
  worstStart: number;
  locale: Locale;
}) {
  const bestX = Math.max(46, Math.min(290, bestStart * 14 + 13));
  const worstX = Math.max(46, Math.min(290, worstStart * 14 + 13));
  const stacked = Math.abs(bestX - worstX) < 88;
  return (
    <g>
      <path
        d={`M${bestStart * 14} 130h26`}
        stroke="var(--save)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text
        x={bestX}
        y={148}
        textAnchor="middle"
        className="text-[12px] font-bold"
        fill="var(--save)"
      >
        {t(locale, "today.best")} {bestStart}:00
      </text>
      <path
        d={`M${worstStart * 14} 130h26`}
        stroke="var(--danger)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text
        x={worstX}
        y={stacked ? 162 : 148}
        textAnchor="middle"
        className="text-[12px] font-bold"
        fill="var(--danger)"
      >
        {t(locale, "today.avoid")} {worstStart}:00
      </text>
    </g>
  );
}

export function HourlyStripChart({
  hours,
  bestStart,
  worstStart,
  locale,
}: {
  hours: AirHour[];
  bestStart: number;
  worstStart: number;
  locale: Locale;
}) {
  const [showTable, setShowTable] = useState(false);
  const slice = hours.slice(0, 24);
  const toggleBtn = (
    <button
      type="button"
      aria-expanded={showTable}
      aria-controls="hourly-data-table"
      onClick={() => setShowTable((v) => !v)}
      className="mt-1 min-h-[44px] px-2 font-bold text-brand-ink underline underline-offset-4"
    >
      {showTable ? t(locale, "today.hideTable") : t(locale, "today.viewTable")}
    </button>
  );
  return (
    <div>
      <svg
        className="block h-auto w-full"
        viewBox="0 0 336 166"
        role="img"
        aria-labelledby="stripTitle stripDesc"
      >
        <title id="stripTitle">{t(locale, "today.next24")}</title>
        <desc id="stripDesc">{t(locale, "today.next24Sub")}</desc>
        <StripBars slice={slice} />
        <WindowMarkers bestStart={bestStart} worstStart={worstStart} locale={locale} />
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2">
        {(["mod", "poor", "vpoor", "severe"] as const).map((b) => (
          <span key={b} className="inline-flex items-center gap-1.5">
            <BandShapeIcon band={b} size={12} />
            {t(locale, `aqiBands.${b}`)}
          </span>
        ))}
      </div>
      {toggleBtn}
      {showTable ? <HourlyStripTable slice={slice} locale={locale} /> : null}
    </div>
  );
}
