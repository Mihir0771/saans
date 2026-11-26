"use client";

import React, { useState } from "react";
import { aqiToBand, computeCpcbAqi } from "@/engine/aqi";
import type { AirHour, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import {
  HourInspectorCard,
  StripLegend,
  StripScrubber,
  StripTableSection,
} from "./HourlyStripInspector";

const pmBand = (pm: number) => aqiToBand(computeCpcbAqi({ pm25: pm }).aqi);

function StripBarRect({
  hr,
  idx,
  maxPm,
  selected,
  onSelect,
}: {
  hr: AirHour;
  idx: number;
  maxPm: number;
  selected: boolean;
  onSelect: (idx: number) => void;
}) {
  const bh = Math.max(4, (hr.pm25 / maxPm) * 78);
  const b = pmBand(hr.pm25);
  return (
    <rect
      x={idx * 14}
      y={108 - bh}
      width={11}
      height={bh}
      rx={2.5}
      fill={`var(--aqi-${b}-fill)`}
      stroke={selected ? "var(--ink)" : `var(--aqi-${b}-edge)`}
      strokeWidth={selected ? 2.5 : 1.5}
      className="cursor-pointer"
      onClick={() => onSelect(idx)}
      onMouseEnter={() => onSelect(idx)}
    />
  );
}

function StripBars({
  slice,
  activeIdx,
  onSelect,
}: {
  slice: AirHour[];
  activeIdx: number;
  onSelect: (idx: number) => void;
}) {
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
      <line
        x1={activeIdx * 14 + 5.5}
        y1={10}
        x2={activeIdx * 14 + 5.5}
        y2={108}
        stroke="var(--brand)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      {slice.map((hr, idx) => (
        <StripBarRect
          key={hr.hourLocal}
          hr={hr}
          idx={idx}
          maxPm={maxPm}
          selected={idx === activeIdx}
          onSelect={onSelect}
        />
      ))}
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

function HourlyStripSvg({
  slice,
  activeIdx,
  bestStart,
  worstStart,
  locale,
  onSelect,
}: {
  slice: AirHour[];
  activeIdx: number;
  bestStart: number;
  worstStart: number;
  locale: Locale;
  onSelect: (idx: number) => void;
}) {
  return (
    <svg
      className="block h-auto w-full select-none"
      viewBox="0 0 336 166"
      role="img"
      aria-labelledby="stripTitle stripDesc"
    >
      <title id="stripTitle">{t(locale, "today.next24")}</title>
      <desc id="stripDesc">{t(locale, "today.next24Sub")}</desc>
      <StripBars slice={slice} activeIdx={activeIdx} onSelect={onSelect} />
      <WindowMarkers bestStart={bestStart} worstStart={worstStart} locale={locale} />
    </svg>
  );
}

export function HourlyStripChart(p: {
  hours: AirHour[];
  bestStart: number;
  worstStart: number;
  locale: Locale;
}) {
  const [showTable, setShowTable] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const slice = p.hours.slice(0, 24);
  const activeHour = slice[activeIdx] ?? slice[0];

  return (
    <div>
      {activeHour ? (
        <HourInspectorCard
          hour={activeHour}
          bestStart={p.bestStart}
          worstStart={p.worstStart}
          locale={p.locale}
        />
      ) : null}
      <HourlyStripSvg
        slice={slice}
        activeIdx={activeIdx}
        bestStart={p.bestStart}
        worstStart={p.worstStart}
        locale={p.locale}
        onSelect={setActiveIdx}
      />
      <StripScrubber
        max={Math.max(0, slice.length - 1)}
        activeIdx={activeIdx}
        locale={p.locale}
        onChange={setActiveIdx}
      />
      <StripLegend locale={p.locale} />
      <StripTableSection
        showTable={showTable}
        onToggle={() => setShowTable((v) => !v)}
        slice={slice}
        activeIdx={activeIdx}
        onSelect={setActiveIdx}
        locale={p.locale}
      />
    </div>
  );
}
