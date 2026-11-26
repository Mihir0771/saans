"use client";

import React, { useState } from "react";
import {
  computeCommunityKit,
  type CommunityActionItem,
  type HourlyActivityDecision,
  type OrgType,
} from "@/engine/community";
import type { AirBundle, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { Button, Card } from "../ui/Primitives";

function GoNoGoTable({
  orgName,
  decisions,
  locale,
}: {
  orgName: string;
  decisions: HourlyActivityDecision[];
  locale: Locale;
}) {
  const statusText = (s: HourlyActivityDecision["status"]) =>
    s === "go"
      ? `✓ ${t(locale, "community.go")}`
      : s === "limit"
        ? `◐ ${t(locale, "community.limit")}`
        : `✕ ${t(locale, "community.avoid")}`;
  return (
    <Card>
      <h2 className="text-lg font-bold text-ink">{orgName} · 24h Go / No-Go</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-divider text-left text-ink-2">
              <th scope="col" className="py-1.5 pr-3">
                Hour
              </th>
              <th scope="col" className="py-1.5 pr-3">
                PM2.5
              </th>
              <th scope="col" className="py-1.5">
                Activity
              </th>
            </tr>
          </thead>
          <tbody>
            {decisions
              .filter((_, i) => i >= 6 && i <= 20)
              .map((d) => (
                <tr key={d.hour} className="border-b border-divider">
                  <td className="py-1 pr-3 font-num">{String(d.hour).padStart(2, "0")}:00</td>
                  <td className="py-1 pr-3 font-num">{d.pm25} µg/m³</td>
                  <td className="py-1 font-bold">{statusText(d.status)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function EvidenceActionsCard({
  actions,
  locale,
}: {
  actions: CommunityActionItem[];
  locale: Locale;
}) {
  return (
    <Card>
      <h2 className="text-lg font-bold text-ink">{t(locale, "community.actionsTitle")}</h2>
      <ul className="mt-3 grid gap-2">
        {actions.map((a) => (
          <li key={a.id} className="rounded-md border border-divider bg-surface-2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm text-ink">{t(locale, a.titleKey)}</strong>
              <span
                className={`rounded-pill px-2.5 py-0.5 text-xs font-bold ${a.evidenceTier === "high" ? "bg-brand-soft text-brand-ink" : "bg-surface text-warn"}`}
              >
                {a.evidenceTier === "high"
                  ? t(locale, "community.tierHigh")
                  : t(locale, "community.tierLow")}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-2">{t(locale, a.noteKey)}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function OrgTypeGroup({
  orgType,
  locale,
  onType,
}: {
  orgType: OrgType;
  locale: Locale;
  onType: (k: OrgType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t(locale, "community.orgType")}>
      {(["school", "rwa", "office"] as OrgType[]).map((kind) => (
        <Button key={kind} aria-pressed={orgType === kind} onClick={() => onType(kind)}>
          {t(locale, `community.${kind}`)}
        </Button>
      ))}
    </div>
  );
}

function CommunityWizardForm({
  orgType,
  orgName,
  headcount,
  locale,
  onType,
  onName,
  onHeadcount,
}: {
  orgType: OrgType;
  orgName: string;
  headcount: number;
  locale: Locale;
  onType: (k: OrgType) => void;
  onName: (n: string) => void;
  onHeadcount: (n: number) => void;
}) {
  return (
    <div className="grid gap-3">
      <OrgTypeGroup orgType={orgType} locale={locale} onType={onType} />
      <label className="text-sm font-semibold text-ink">
        {t(locale, "community.orgName")}
        <input
          value={orgName}
          onChange={(e) => onName(e.target.value)}
          className="mt-1 block min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 text-ink"
        />
      </label>
      <label className="text-sm font-semibold text-ink">
        {t(locale, "community.headcount")}
        <input
          type="number"
          min={10}
          max={5000}
          value={headcount}
          onChange={(e) => onHeadcount(Number(e.target.value) || 50)}
          className="mt-1 block min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 font-num text-ink"
        />
      </label>
    </div>
  );
}

function CommunityShareRow({
  copied,
  locale,
  onCopy,
}: {
  copied: boolean;
  locale: Locale;
  onCopy: () => void;
}) {
  return (
    <div className="no-print mt-3 flex flex-wrap gap-2">
      <Button variant="primary" onClick={onCopy}>
        {copied ? t(locale, "community.copied") : t(locale, "community.whatsappBtn")}
      </Button>
      <Button onClick={() => window.print()}>{t(locale, "community.printBtn")}</Button>
    </div>
  );
}

function CollectiveBanner({ low, high, locale }: { low: number; high: number; locale: Locale }) {
  return (
    <div className="mt-4 rounded-md bg-brand-soft p-3 text-sm text-brand-ink">
      <strong>{t(locale, "community.collective")}:</strong>{" "}
      <span className="font-num font-extrabold">
        {low}–{high} kg PM2.5/day
      </span>
    </div>
  );
}

function copyWhatsAppText(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard
    ?.writeText(text)
    .then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    })
    .catch(() => setCopied(false));
}

export function CommunityView({
  air,
  locale,
  cityName,
}: {
  air: AirBundle;
  locale: Locale;
  cityName?: string;
}) {
  const shortCity = (cityName ?? air.cityName ?? "Dwarka").split(",")[0]?.trim() || "Dwarka";
  const [orgType, setOrgType] = useState<OrgType>("school");
  const [orgName, setOrgName] = useState(`${shortCity} Public School`);
  const [headcount, setHeadcount] = useState(250);
  const [copied, setCopied] = useState(false);

  const kit = computeCommunityKit({ orgType, orgName, headcount, hours: air.hours }, locale);

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start">
      <div className="grid min-w-0 gap-4">
        <Card>
          <h1 className="text-lg font-bold text-ink">{t(locale, "community.title")}</h1>
          <p className="mb-3 text-sm text-ink-2">{t(locale, "community.subtitle")}</p>
          <CommunityWizardForm
            orgType={orgType}
            orgName={orgName}
            headcount={headcount}
            locale={locale}
            onType={setOrgType}
            onName={setOrgName}
            onHeadcount={setHeadcount}
          />
          <CollectiveBanner
            low={kit.collectiveDeltaKgLow}
            high={kit.collectiveDeltaKgHigh}
            locale={locale}
          />
          <CommunityShareRow
            copied={copied}
            locale={locale}
            onCopy={() => copyWhatsAppText(kit.whatsappText, setCopied)}
          />
        </Card>
        <EvidenceActionsCard actions={kit.actions} locale={locale} />
      </div>
      <GoNoGoTable orgName={orgName} decisions={kit.hourlyDecisions} locale={locale} />
    </div>
  );
}
