"use client";

import React, { useEffect, useRef, useState } from "react";
import type { HouseholdProfile, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { clearUserGeminiKey, loadUserGeminiKey, saveUserGeminiKey } from "@/lib/storage";
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

async function fetchCityMatches(
  query: string,
  locale: Locale,
): Promise<{ results: CityMatch[]; note: string | null }> {
  if (query.trim().length < 2) return { results: [], note: null };
  try {
    const res = await fetch(`/api/air?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) return { results: [], note: t(locale, "onboarding.cityError") };
    const data = (await res.json()) as { results?: CityMatch[] };
    const results = data.results ?? [];
    return { results, note: results.length === 0 ? t(locale, "onboarding.cityEmpty") : null };
  } catch {
    return { results: [], note: t(locale, "onboarding.cityError") };
  }
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

function GeminiKeyCard({ locale }: { locale: Locale }) {
  const [draft, setDraft] = useState("");
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    setHasKey(Boolean(loadUserGeminiKey()));
  }, []);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveUserGeminiKey(draft);
    setHasKey(Boolean(loadUserGeminiKey()));
    setDraft("");
  };
  const onClear = () => {
    clearUserGeminiKey();
    setHasKey(false);
    setDraft("");
  };

  return (
    <Card aria-labelledby="gemini-key-heading">
      <h2 id="gemini-key-heading" className="text-lg font-bold text-ink">
        {t(locale, "onboarding.geminiTitle")}
      </h2>
      <p className="mt-1 text-sm text-ink-2">{t(locale, "onboarding.geminiSub")}</p>
      <p className="mt-2 text-xs font-bold text-brand-ink">
        {hasKey ? t(locale, "onboarding.geminiSaved") : t(locale, "onboarding.geminiDefault")}
      </p>
      <form className="mt-3 flex flex-wrap gap-2" onSubmit={onSave}>
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          aria-label={t(locale, "onboarding.geminiTitle")}
          placeholder={t(locale, "onboarding.geminiPlaceholder")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[44px] flex-1 rounded-sm border border-line bg-surface px-3 text-ink"
        />
        <Button type="submit" variant="primary" disabled={draft.trim().length < 20}>
          {t(locale, "onboarding.geminiSave")}
        </Button>
        {hasKey ? <Button onClick={onClear}>{t(locale, "onboarding.geminiClear")}</Button> : null}
      </form>
    </Card>
  );
}

function CitySetupCard(p: {
  props: OnboardingProps;
  cityQuery: string;
  matches: CityMatch[];
  searchNote: string | null;
  selected: CityMatch;
  onQuery: (q: string) => void;
  onSearch: () => void;
  onPick: (m: CityMatch) => void;
}) {
  const locale = p.props.profile.locale;
  return (
    <Card>
      <h1 className="text-xl font-bold text-ink">{t(locale, "onboarding.title")}</h1>
      <p className="mt-1 text-sm text-ink-2">{t(locale, "onboarding.subtitle")}</p>
      <div className="mt-4 grid gap-3">
        <DemoPickers
          locale={locale}
          onSharma={p.props.onUseSharmaDemo}
          onAhmedabad={p.props.onUseAhmedabadDemo}
        />
        <CitySearchBar
          value={p.cityQuery}
          label={t(locale, "onboarding.cityLabel")}
          searchLabel={t(locale, "onboarding.search")}
          onChange={p.onQuery}
          onSearch={p.onSearch}
        />
        {p.searchNote ? (
          <p role="status" className="text-xs text-ink-2">
            {p.searchNote}
          </p>
        ) : null}
        <CityMatchesList matches={p.matches} selectedName={p.selected.name} onPick={p.onPick} />
        <Button
          variant="primary"
          onClick={() => p.props.onSaveProfile(buildSavedProfile(p.props.profile, p.selected))}
        >
          {t(locale, "onboarding.finish")}
        </Button>
        <Button onClick={p.props.onOpenTutorial}>{t(locale, "onboarding.replayTour")}</Button>
      </div>
    </Card>
  );
}

export function OnboardingView(p: OnboardingProps) {
  const locale = p.profile.locale;
  const searchSeqRef = useRef(0);
  const [cityQuery, setCityQuery] = useState(p.profile.cityName);
  const [matches, setMatches] = useState<CityMatch[]>([]);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [selected, setSelected] = useState<CityMatch>({
    name: p.profile.cityName,
    lat: p.profile.lat,
    lon: p.profile.lon,
  });
  const pick = (m: CityMatch) => {
    setSelected(m);
    setCityQuery(m.name);
    setMatches([]);
    setSearchNote(null);
  };
  const runSearch = async () => {
    const seq = ++searchSeqRef.current;
    setSearchNote(t(locale, "onboarding.searching"));
    const out = await fetchCityMatches(cityQuery, locale);
    if (seq !== searchSeqRef.current) return;
    setMatches(out.results);
    setSearchNote(out.note);
  };
  return (
    <div className="mx-auto grid max-w-xl gap-4">
      <CitySetupCard
        props={p}
        cityQuery={cityQuery}
        matches={matches}
        searchNote={searchNote}
        selected={selected}
        onQuery={setCityQuery}
        onSearch={runSearch}
        onPick={pick}
      />
      <GeminiKeyCard locale={locale} />
    </div>
  );
}
