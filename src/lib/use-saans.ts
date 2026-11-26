"use client";

import { useEffect, useState } from "react";
import type { AirBundle, HouseholdProfile, Locale } from "@/engine/schema";
import { AHMEDABAD_DEMO_AIR, AHMEDABAD_PROFILE, type DemoKind } from "@/lib/ahmedabad-fixture";
import { SHARMA_DEMO_AIR, SHARMA_PROFILE } from "@/lib/sharma-fixture";
import {
  loadStoredActions,
  loadStoredFocusMember,
  loadStoredLocale,
  loadStoredProfile,
  saveStoredActions,
  saveStoredFocusMember,
  saveStoredLocale,
  saveStoredProfile,
  type ThemeMode,
} from "@/lib/storage";
import type { AppTab } from "@/components/ui/AppShell";
import type { MathDetail } from "@/components/ui/MathDrawer";

const DEFAULT_ACTIONS = [
  "cr_box",
  "commute_metro",
  "seal_gaps",
  "close_peak_windows",
  "cook_hood_shift",
];

export function applyThemeToDom(mode: ThemeMode) {
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (mode === "system") {
    root.removeAttribute("data-theme");
    if (meta) meta.setAttribute("content", "light dark");
    window.localStorage.removeItem("color-scheme");
    return;
  }
  root.setAttribute("data-theme", mode);
  if (meta) meta.setAttribute("content", mode);
  window.localStorage.setItem("color-scheme", mode);
}

export function useAirData(
  profile: HouseholdProfile,
  demoKind: DemoKind | false,
  calibratePm?: number,
  simMean?: number,
) {
  const fallbackAir = demoKind === "ahmedabad" ? AHMEDABAD_DEMO_AIR : SHARMA_DEMO_AIR;
  const [air, setAir] = useState<AirBundle>(fallbackAir);
  const [loadingAir, setLoadingAir] = useState<boolean>(!demoKind);

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams({
      lat: String(profile.lat),
      lon: String(profile.lon),
      city: profile.cityName,
    });
    if (demoKind) q.set("demo", demoKind);
    if (calibratePm !== undefined) q.set("calibratePm25", String(calibratePm));
    if (simMean !== undefined) q.set("simMean", String(simMean));
    setLoadingAir(true);
    fetch(`/api/air?${q.toString()}`)
      .then((res) => res.json() as Promise<AirBundle>)
      .then((d) => !cancelled && Array.isArray(d.hours) && setAir(d))
      .catch(() => !cancelled && setAir({ ...fallbackAir, source: "offline-sample", stale: true }))
      .finally(() => !cancelled && setLoadingAir(false));
    return () => {
      cancelled = true;
    };
  }, [profile.lat, profile.lon, profile.cityName, demoKind, calibratePm, simMean, fallbackAir]);

  return { air, loadingAir };
}

function buildDemoActivator(
  setTab: React.Dispatch<React.SetStateAction<AppTab>>,
  setProfile: React.Dispatch<React.SetStateAction<HouseholdProfile>>,
  setDemoKind: React.Dispatch<React.SetStateAction<DemoKind | false>>,
  setFocusMemberId: React.Dispatch<React.SetStateAction<string>>,
  setCalibratePm: React.Dispatch<React.SetStateAction<number | undefined>>,
  setSimMean: React.Dispatch<React.SetStateAction<number | undefined>>,
) {
  return (kind: DemoKind) => {
    const nextProfile = kind === "ahmedabad" ? AHMEDABAD_PROFILE : SHARMA_PROFILE;
    const firstId = nextProfile.members[0]?.id ?? "aarav";
    setDemoKind(kind);
    setCalibratePm(undefined);
    setSimMean(undefined);
    setProfile((p) => {
      const updated = { ...nextProfile, locale: p.locale };
      saveStoredProfile(updated);
      return updated;
    });
    setFocusMemberId(firstId);
    saveStoredFocusMember(firstId);
    setTab("today");
  };
}

function buildControllerActions(
  setTab: React.Dispatch<React.SetStateAction<AppTab>>,
  setProfile: React.Dispatch<React.SetStateAction<HouseholdProfile>>,
  setDemoKind: React.Dispatch<React.SetStateAction<DemoKind | false>>,
  setFocusMemberId: React.Dispatch<React.SetStateAction<string>>,
  setActiveActionIds: React.Dispatch<React.SetStateAction<string[]>>,
  setCalibratePm: React.Dispatch<React.SetStateAction<number | undefined>>,
  setSimMean: React.Dispatch<React.SetStateAction<number | undefined>>,
  setTheme: React.Dispatch<React.SetStateAction<ThemeMode>>,
) {
  const activateDemo = buildDemoActivator(
    setTab,
    setProfile,
    setDemoKind,
    setFocusMemberId,
    setCalibratePm,
    setSimMean,
  );
  return {
    activateSharmaDemo: () => activateDemo("sharma"),
    activateAhmedabadDemo: () => activateDemo("ahmedabad"),
    selectMember: (id: string) => {
      setFocusMemberId(id);
      saveStoredFocusMember(id);
    },
    toggleAction: (id: string) =>
      setActiveActionIds((p) => {
        const next = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
        saveStoredActions(next);
        return next;
      }),
    changeLocale: (loc: Locale) => {
      saveStoredLocale(loc);
      setProfile((p) => ({ ...p, locale: loc }));
      document.documentElement.lang = loc;
    },
    changeTheme: (m: ThemeMode) => {
      setTheme(m);
      applyThemeToDom(m);
    },
    updateHome: (patch: Partial<HouseholdProfile["home"]>) =>
      setProfile((p) => {
        const next = { ...p, home: { ...p.home, ...patch } };
        saveStoredProfile(next);
        return next;
      }),
  };
}

function resolveInitialDemo(
  stored: HouseholdProfile | null,
  initialDemo: DemoKind | false,
): DemoKind | false {
  if (initialDemo) return initialDemo;
  if (!stored) return "sharma";
  if (stored.id === "sharma" || stored.id === "ahmedabad") return stored.id;
  return false;
}

function useControllerState(initialDemo: DemoKind | false) {
  const startProfile = initialDemo === "ahmedabad" ? AHMEDABAD_PROFILE : SHARMA_PROFILE;
  const [tab, setTab] = useState<AppTab>("today");
  const [profile, setProfile] = useState<HouseholdProfile>(() => ({ ...startProfile }));
  const [demoKind, setDemoKind] = useState<DemoKind | false>(initialDemo);
  const [focusMemberId, setFocusMemberId] = useState<string>(
    startProfile.members[0]?.id ?? "aarav",
  );
  const [activeActionIds, setActiveActionIds] = useState<string[]>(DEFAULT_ACTIONS);
  const [calibratePm, setCalibratePm] = useState<number | undefined>(undefined);
  const [simMean, setSimMean] = useState<number | undefined>(undefined);
  const [mathDetail, setMathDetail] = useState<MathDetail | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = loadStoredProfile();
    const active = stored && !initialDemo ? stored : startProfile;
    setProfile({ ...active, locale: loadStoredLocale() });
    setDemoKind(resolveInitialDemo(stored, initialDemo));
    setActiveActionIds(loadStoredActions(DEFAULT_ACTIONS));
    const memberId = loadStoredFocusMember(active.members[0]?.id ?? "aarav");
    if (active.members.some((m) => m.id === memberId)) setFocusMemberId(memberId);
    const saved = window.localStorage.getItem("color-scheme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, [initialDemo, startProfile]);

  return {
    tab,
    setTab,
    profile,
    setProfile,
    demoKind,
    setDemoKind,
    focusMemberId,
    setFocusMemberId,
    activeActionIds,
    setActiveActionIds,
    calibratePm,
    setCalibratePm,
    simMean,
    setSimMean,
    mathDetail,
    setMathDetail,
    theme,
    setTheme,
  };
}

export function useSaansController(initialDemo: DemoKind | false) {
  const st = useControllerState(initialDemo);
  const actions = buildControllerActions(
    st.setTab,
    st.setProfile,
    st.setDemoKind,
    st.setFocusMemberId,
    st.setActiveActionIds,
    st.setCalibratePm,
    st.setSimMean,
    st.setTheme,
  );
  return { ...st, ...actions };
}
