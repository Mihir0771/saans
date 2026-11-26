"use client";

import React, { useState } from "react";
import type { HouseholdProfile } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { Button, Card } from "../ui/Primitives";

interface CityMatch {
  name: string;
  lat: number;
  lon: number;
}

function CityMatchesList({
  matches,
  selectedName,
  onPick,
}: {
  matches: CityMatch[];
  selectedName: string;
  onPick: (m: CityMatch) => void;
}) {
  if (matches.length === 0) return null;
  return (
    <ul className="grid gap-1">
      {matches.map((m) => (
        <li key={`${m.lat}-${m.lon}`}>
          <Button
            className="w-full justify-start"
            aria-pressed={selectedName === m.name}
            onClick={() => onPick(m)}
          >
            {m.name} ({m.lat}, {m.lon})
          </Button>
        </li>
      ))}
    </ul>
  );
}

function CitySearchBar({
  value,
  label,
  searchLabel,
  onChange,
  onSearch,
}: {
  value: string;
  label: string;
  searchLabel: string;
  onChange: (v: string) => void;
  onSearch: () => void;
}) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      <input
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[44px] flex-1 rounded-sm border border-line bg-surface px-3 text-ink"
      />
      <Button type="submit">{searchLabel}</Button>
    </form>
  );
}

async function fetchCityMatches(query: string): Promise<CityMatch[]> {
  if (query.trim().length < 2) return [];
  const data = await (await fetch(`/api/air?q=${encodeURIComponent(query.trim())}`)).json();
  return data.results ?? [];
}

interface OnboardingProps {
  profile: HouseholdProfile;
  onSaveProfile: (next: HouseholdProfile) => void;
  onUseSharmaDemo: () => void;
  onUseAhmedabadDemo: () => void;
  onOpenTutorial: () => void;
}

function DemoPickers({
  locale,
  onSharma,
  onAhmedabad,
}: {
  locale: HouseholdProfile["locale"];
  onSharma: () => void;
  onAhmedabad: () => void;
}) {
  return (
    <>
      <Button variant="primary" onClick={onSharma}>
        {t(locale, "onboarding.useSharma")}
      </Button>
      <Button onClick={onAhmedabad}>{t(locale, "onboarding.useAhmedabad")}</Button>
    </>
  );
}

function buildSavedProfile(profile: HouseholdProfile, selected: CityMatch): HouseholdProfile {
  return {
    ...profile,
    id: "user-household",
    cityName: selected.name,
    lat: selected.lat,
    lon: selected.lon,
  };
}

export function OnboardingView(p: OnboardingProps) {
  const locale = p.profile.locale;
  const [cityQuery, setCityQuery] = useState(p.profile.cityName);
  const [matches, setMatches] = useState<CityMatch[]>([]);
  const [selected, setSelected] = useState<CityMatch>({
    name: p.profile.cityName,
    lat: p.profile.lat,
    lon: p.profile.lon,
  });
  const pick = (m: CityMatch) => {
    setSelected(m);
    setCityQuery(m.name);
    setMatches([]);
  };

  return (
    <div className="mx-auto grid max-w-xl gap-4">
      <Card>
        <h1 className="text-xl font-bold text-ink">{t(locale, "onboarding.title")}</h1>
        <p className="mt-1 text-sm text-ink-2">{t(locale, "onboarding.subtitle")}</p>
        <div className="mt-4 grid gap-3">
          <DemoPickers
            locale={locale}
            onSharma={p.onUseSharmaDemo}
            onAhmedabad={p.onUseAhmedabadDemo}
          />
          <CitySearchBar
            value={cityQuery}
            label={t(locale, "onboarding.cityLabel")}
            searchLabel={t(locale, "onboarding.search")}
            onChange={setCityQuery}
            onSearch={() => fetchCityMatches(cityQuery).then(setMatches)}
          />
          <CityMatchesList matches={matches} selectedName={selected.name} onPick={pick} />
          <Button
            variant="primary"
            onClick={() => p.onSaveProfile(buildSavedProfile(p.profile, selected))}
          >
            {t(locale, "onboarding.finish")}
          </Button>
          <Button onClick={p.onOpenTutorial}>{t(locale, "onboarding.replayTour")}</Button>
        </div>
      </Card>
    </div>
  );
}
