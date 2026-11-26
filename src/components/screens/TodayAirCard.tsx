"use client";

import React, { useState } from "react";
import type { FullPlanResult } from "@/engine/plan";
import type { AirBundle, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { AQIChip } from "../ui/AQIChip";
import { Button, Card } from "../ui/Primitives";

function riskLabel(risk: FullPlanResult["trappedAirRisk"], locale: Locale): string {
  if (risk === "high") return t(locale, "today.riskHigh");
  if (risk === "moderate") return t(locale, "today.riskModerate");
  return t(locale, "today.riskLow");
}

function SimSliderRow({
  air,
  locale,
  onSimTarget,
}: {
  air: AirBundle;
  locale: Locale;
  onSimTarget: (v: number | undefined) => void;
}) {
  return (
    <div className="pt-1">
      <label htmlFor="sim-smog-slider" className="block text-xs font-semibold text-ink-2">
        {t(locale, "today.simulateSmog")} ({air.simulationTargetMean ?? "live"} µg/m³)
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          id="sim-smog-slider"
          type="range"
          min={50}
          max={450}
          step={25}
          value={air.simulationTargetMean ?? 175}
          onChange={(e) => onSimTarget(Number(e.target.value))}
          className="flex-1"
        />
        {air.simulationTargetMean !== undefined ? (
          <Button onClick={() => onSimTarget(undefined)}>{t(locale, "banners.undo")}</Button>
        ) : null}
      </div>
    </div>
  );
}

function CalibrateForm({
  air,
  locale,
  onCalibrate,
  onSimTarget,
  onDone,
}: {
  air: AirBundle;
  locale: Locale;
  onCalibrate: (v: number | undefined) => void;
  onSimTarget: (v: number | undefined) => void;
  onDone: () => void;
}) {
  const [calVal, setCalVal] = useState(String(Math.round(air.hours[0]?.pm25 ?? 174)));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(calVal);
    if (Number.isFinite(n) && n > 0) onCalibrate(n);
    onDone();
  };
  return (
    <form
      className="mt-3 grid gap-2 rounded-md border border-divider bg-surface-2 p-3"
      onSubmit={submit}
    >
      <label htmlFor="cal-pm-input" className="text-sm font-semibold text-ink">
        {t(locale, "today.calibrateHint")}
      </label>
      <div className="flex gap-2">
        <input
          id="cal-pm-input"
          type="number"
          min={1}
          max={1500}
          value={calVal}
          onChange={(e) => setCalVal(e.target.value)}
          className="min-h-[44px] flex-1 rounded-sm border border-line bg-surface px-3 font-num text-ink"
        />
        <Button type="submit" variant="primary">
          {t(locale, "app.save")}
        </Button>
      </div>
      <SimSliderRow air={air} locale={locale} onSimTarget={onSimTarget} />
    </form>
  );
}

function GrapNotice({ grap, locale }: { grap: FullPlanResult["grap"]; locale: Locale }) {
  if (!grap) return null;
  return (
    <p className="mt-3 rounded-md bg-surface-2 p-3 text-xs text-ink-2">
      <strong className="block text-sm text-ink">
        {t(locale, "today.grapTitle")} {grap.stage} ({grap.aqiBandLabel})
      </strong>
      {t(locale, grap.indicativeNoteKey)}
    </p>
  );
}

function AirMetricsGrid({
  nowPm,
  risk,
  locale,
}: {
  nowPm: number;
  risk: FullPlanResult["trappedAirRisk"];
  locale: Locale;
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div>
        <span className="block text-xs text-ink-3">{t(locale, "today.pm25")}</span>
        <b className="font-num text-lg text-ink">{nowPm} µg/m³</b>
      </div>
      <div>
        <span className="block text-xs text-ink-3">{t(locale, "today.trappedRisk")}</span>
        <b className="font-num text-lg text-ink">{riskLabel(risk, locale)}</b>
      </div>
    </div>
  );
}

interface TodayAirCardProps {
  air: AirBundle;
  fullPlan: FullPlanResult;
  locale: Locale;
  onCalibrate: (v: number | undefined) => void;
  onSimTarget: (v: number | undefined) => void;
  onOpenOnboarding: () => void;
}

export function TodayAirCard({
  air,
  fullPlan,
  locale,
  onCalibrate,
  onSimTarget,
  onOpenOnboarding,
}: TodayAirCardProps) {
  const [calOpen, setCalOpen] = useState(false);
  const nowPm = Math.round(air.hours[0]?.pm25 ?? 0);
  return (
    <Card aria-labelledby="air-now-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="air-now-heading" className="text-lg font-bold text-ink">
          {t(locale, "today.airNow")}
        </h2>
        <span className="inline-flex min-h-[28px] items-center rounded-sm border border-line bg-surface px-2 text-sm text-ink-2">
          {t(locale, "today.modelEstimate")}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <AQIChip aqi={fullPlan.aqiNow.aqi} band={fullPlan.aqiNow.band} locale={locale} />
        <span className="text-xs text-ink-3">
          {t(locale, "today.cpcbScale")} {fullPlan.aqiNow.dominantPollutant}
        </span>
      </div>
      <AirMetricsGrid nowPm={nowPm} risk={fullPlan.trappedAirRisk} locale={locale} />
      <GrapNotice grap={fullPlan.grap} locale={locale} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => setCalOpen((v) => !v)} className="flex-1">
          {t(locale, "today.calibrateBtn")}
        </Button>
        <Button onClick={onOpenOnboarding}>{t(locale, "today.changeLocation")}</Button>
      </div>
      {calOpen ? (
        <CalibrateForm
          air={air}
          locale={locale}
          onCalibrate={onCalibrate}
          onSimTarget={onSimTarget}
          onDone={() => setCalOpen(false)}
        />
      ) : null}
    </Card>
  );
}
