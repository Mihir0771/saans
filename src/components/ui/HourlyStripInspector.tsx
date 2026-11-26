"use client";

import React from "react";
import { aqiToBand, computeCpcbAqi } from "@/engine/aqi";
import type { AirHour, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { BandShapeIcon } from "./AQIChip";

const pmBand = (pm: number) => aqiToBand(computeCpcbAqi({ pm25: pm }).aqi);

export function StripScrubber({
  max,
  activeIdx,
  locale,
  onChange,
}: {
  max: number;
  activeIdx: number;
  locale: Locale;
  onChange: (idx: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={max}
        value={activeIdx}
        aria-label={t(locale, "today.inspectHint")}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 flex-1 accent-[var(--brand)]"
      />
      <span className="text-xs text-ink-3">{t(locale, "today.inspectHint")}</span>
    </div>
  );
}

export function StripTableSection({
  showTable,
  onToggle,
  slice,
  activeIdx,
  onSelect,
  locale,
}: {
  showTable: boolean;
  onToggle: () => void;
  slice: AirHour[];
  activeIdx: number;
  onSelect: (idx: number) => void;
  locale: Locale;
}) {
  return (
    <>
      <button
        type="button"
        aria-expanded={showTable}
        aria-controls="hourly-data-table"
        onClick={onToggle}
        className="mt-1 min-h-[44px] px-2 font-bold text-brand-ink underline underline-offset-4"
      >
        {showTable ? t(locale, "today.hideTable") : t(locale, "today.viewTable")}
      </button>
      {showTable ? (
        <HourlyStripTable slice={slice} activeIdx={activeIdx} onSelect={onSelect} locale={locale} />
      ) : null}
    </>
  );
}

export function StripLegend({ locale }: { locale: Locale }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2">
      {(["mod", "poor", "vpoor", "severe"] as const).map((b) => (
        <span key={b} className="inline-flex items-center gap-1.5">
          <BandShapeIcon band={b} size={12} />
          {t(locale, `aqiBands.${b}`)}
        </span>
      ))}
    </div>
  );
}

function InspectorWeather({ hour, locale }: { hour: AirHour; locale: Locale }) {
  const ratio = (hour.pm25 / 15).toFixed(1);
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      <span>
        <strong className="font-num text-ink">{Math.round(hour.pm25)} µg/m³</strong> PM2.5 (
        <b className="font-num text-ink">{ratio}×</b> WHO)
      </span>
      {hour.tempC !== undefined ? (
        <span>
          {t(locale, "today.temp")}:{" "}
          <strong className="font-num text-ink">{Math.round(hour.tempC)}°C</strong>
        </span>
      ) : null}
      {hour.windMs !== undefined ? (
        <span>
          {t(locale, "today.wind")}:{" "}
          <strong className="font-num text-ink">{hour.windMs.toFixed(1)} m/s</strong>
        </span>
      ) : null}
    </div>
  );
}

export function HourInspectorCard({
  hour,
  bestStart,
  worstStart,
  locale,
}: {
  hour: AirHour;
  bestStart: number;
  worstStart: number;
  locale: Locale;
}) {
  const cpcb = computeCpcbAqi({ pm25: hour.pm25, pm10: hour.pm10 });
  const inBest = hour.hourLocal === bestStart || hour.hourLocal === (bestStart + 1) % 24;
  const inWorst = hour.hourLocal === worstStart || hour.hourLocal === (worstStart + 1) % 24;
  const tagKey = inBest
    ? "today.bestWindowTag"
    : inWorst
      ? "today.avoidWindowTag"
      : "today.normalWindowTag";
  const tagCls = inBest
    ? "bg-brand-soft text-brand-ink"
    : inWorst
      ? "border border-danger bg-surface text-danger"
      : "border border-divider bg-surface text-ink-2";

  return (
    <div
      aria-live="polite"
      className="mb-3 rounded-md border border-divider bg-surface-2 p-3 text-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-num text-base font-extrabold text-ink">
            {String(hour.hourLocal).padStart(2, "0")}:00
          </span>
          <span className="inline-flex items-center gap-1 rounded-pill bg-surface px-2.5 py-0.5 text-xs font-bold text-ink">
            <BandShapeIcon band={cpcb.band} size={11} />
            AQI {cpcb.aqi} · {t(locale, `aqiBands.${cpcb.band}`)}
          </span>
        </div>
        <span className={`rounded-pill px-2.5 py-0.5 text-xs font-bold ${tagCls}`}>
          {t(locale, tagKey)}
        </span>
      </div>
      <InspectorWeather hour={hour} locale={locale} />
    </div>
  );
}

export function HourlyStripTable({
  slice,
  activeIdx,
  onSelect,
  locale,
}: {
  slice: AirHour[];
  activeIdx: number;
  onSelect: (idx: number) => void;
  locale: Locale;
}) {
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
          {slice.map((h, idx) => (
            <tr
              key={h.hourLocal}
              onClick={() => onSelect(idx)}
              className={`cursor-pointer border-b border-divider ${idx === activeIdx ? "bg-brand-soft" : ""}`}
            >
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
