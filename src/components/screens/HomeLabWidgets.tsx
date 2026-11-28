"use client";

import React from "react";
import { CR_BOX_CADR_M3H, CR_BOX_COST_INR } from "@/engine/params";
import type { CookingFuel, HouseholdProfile, LeakinessClass, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { Button, Card } from "../ui/Primitives";

function LabSizeControls({
  areaSqm,
  locale,
  onChange,
}: {
  areaSqm: number;
  locale: Locale;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="lab-area" className="text-sm font-semibold text-ink">
          {t(locale, "lab.areaLabel")}: {areaSqm}
        </label>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => onChange(Math.max(10, areaSqm - 5))}
            aria-label="Decrease room size"
          >
            −
          </Button>
          <Button
            onClick={() => onChange(Math.min(250, areaSqm + 5))}
            aria-label="Increase room size"
          >
            +
          </Button>
        </div>
      </div>
      <input
        id="lab-area"
        type="range"
        min={10}
        max={200}
        step={5}
        value={areaSqm}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full"
      />
    </div>
  );
}

function PurifierControls({
  home,
  locale,
  onUpdateHome,
}: {
  home: HouseholdProfile["home"];
  locale: Locale;
  onUpdateHome: (patch: Partial<HouseholdProfile["home"]>) => void;
}) {
  const cadrVal = home.purifier.enabled ? home.purifier.cadrM3h : 0;
  const toggleOn = () =>
    onUpdateHome({
      purifier: {
        ...home.purifier,
        enabled: !home.purifier.enabled,
        cadrM3h: home.purifier.cadrM3h || 350,
        hoursPerDay: 24,
      },
    });
  const setSlider = (c: number) =>
    onUpdateHome({ purifier: { ...home.purifier, enabled: c > 0, cadrM3h: c, hoursPerDay: 24 } });
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="lab-cadr" className="text-sm font-semibold text-ink">
          {t(locale, "lab.purifierCadr")}: {cadrVal}
        </label>
        <Button aria-pressed={home.purifier.enabled} onClick={toggleOn}>
          {t(locale, "lab.purifierOn")}
        </Button>
      </div>
      <input
        id="lab-cadr"
        type="range"
        min={0}
        max={700}
        step={25}
        value={cadrVal}
        onChange={(e) => setSlider(Number(e.target.value))}
      />
    </div>
  );
}

export function LabControls({
  home,
  locale,
  onUpdateHome,
}: {
  home: HouseholdProfile["home"];
  locale: Locale;
  onUpdateHome: (patch: Partial<HouseholdProfile["home"]>) => void;
}) {
  return (
    <div className="mt-4 grid gap-3">
      <LabSizeControls
        areaSqm={home.areaSqm}
        locale={locale}
        onChange={(areaSqm) => onUpdateHome({ areaSqm })}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label={t(locale, "lab.leakiness")}>
        {(["tight", "average", "leaky"] as LeakinessClass[]).map((lk) => (
          <Button
            key={lk}
            aria-pressed={home.leakiness === lk}
            onClick={() => onUpdateHome({ leakiness: lk })}
          >
            {t(locale, `lab.${lk}`)}
          </Button>
        ))}
      </div>
      <PurifierControls home={home} locale={locale} onUpdateHome={onUpdateHome} />
      <label htmlFor="lab-cooking-fuel" className="text-sm font-semibold text-ink">
        {t(locale, "lab.cookingFuel")}
        <select
          id="lab-cooking-fuel"
          value={home.cookingFuel}
          onChange={(e) => onUpdateHome({ cookingFuel: e.target.value as CookingFuel })}
          className="mt-1 block min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 text-ink"
        >
          <option value="lpg">LPG</option>
          <option value="induction">Induction / Electric</option>
          <option value="biomass_chulha">Biomass / Chulha</option>
          <option value="mixed">Mixed</option>
        </select>
      </label>
    </div>
  );
}

export function CrBoxGuide({ locale }: { locale: Locale }) {
  return (
    <Card aria-labelledby="cr-heading">
      <h2 id="cr-heading" className="text-lg font-bold text-ink">
        {t(locale, "lab.crTitle")}
      </h2>
      <p className="mt-1 text-sm text-ink-2">{t(locale, "lab.crSub")}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-md bg-surface-2 p-2.5">
          <b className="font-num block text-ink">
            ₹{CR_BOX_COST_INR.low}–{CR_BOX_COST_INR.high}
          </b>
          <span className="text-xs text-ink-2">BOM</span>
        </div>
        <div className="rounded-md bg-surface-2 p-2.5">
          <b className="font-num block text-ink">
            {CR_BOX_CADR_M3H.low}–{CR_BOX_CADR_M3H.high}
          </b>
          <span className="text-xs text-ink-2">m³/h CADR</span>
        </div>
        <div className="rounded-md bg-surface-2 p-2.5">
          <b className="font-num block text-ink">4× MERV 13</b>
          <span className="text-xs text-ink-2">+ Box fan</span>
        </div>
      </div>
      <p className="mt-3 rounded-sm border border-dashed border-warn bg-surface p-2.5 text-xs text-ink-2">
        {t(locale, "lab.crSafety")}
      </p>
    </Card>
  );
}
