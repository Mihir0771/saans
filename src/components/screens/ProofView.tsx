"use client";

import React, { useEffect, useState } from "react";
import {
  CR_BOX_CADR_M3H,
  INDOOR_DEPOSITION_H,
  INDOOR_PENETRATION,
  MASK_PROTECTION,
  WHO_PM25_24H_GUIDELINE,
} from "@/engine/params";
import type { Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { MYTH_CARDS } from "@/lib/myths";
import { Button, Card } from "../ui/Primitives";

const ASSUMPTION_ROWS = [
  { name: "WHO 24-h PM2.5 Guideline", spec: WHO_PM25_24H_GUIDELINE },
  { name: "Indoor Penetration (P)", spec: INDOOR_PENETRATION },
  { name: "Indoor Deposition (k)", spec: INDOOR_DEPOSITION_H },
  { name: "CR Box CADR", spec: CR_BOX_CADR_M3H },
  { name: "Real-World N95/FFP2 Fit", spec: MASK_PROTECTION.n95 },
  { name: "Real-World Cloth Mask", spec: MASK_PROTECTION.cloth },
];

function AssumptionsCard({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState("");
  const filtered = ASSUMPTION_ROWS.filter((r) =>
    `${r.name} ${r.spec.source}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Card>
      <h1 className="text-lg font-bold text-ink">{t(locale, "proof.title")}</h1>
      <p className="mb-3 text-sm text-ink-2">{t(locale, "proof.subtitle")}</p>
      <input
        aria-label={t(locale, "proof.searchAssumptions")}
        placeholder={t(locale, "proof.searchAssumptions")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 text-ink"
      />
      <ul className="grid gap-2">
        {filtered.map((row) => (
          <li key={row.name} className="rounded-md bg-surface-2 p-3 text-sm">
            <div className="flex justify-between gap-2">
              <strong className="text-ink">{row.name}</strong>
              <span className="font-num font-bold text-brand-ink">
                {row.spec.low}–{row.spec.high} {row.spec.unit} (Conf. {row.spec.confidence})
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-2">{row.spec.source}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ReportCard({ locale, reportMd }: { locale: Locale; reportMd: string }) {
  return (
    <Card>
      <h2 className="text-lg font-bold text-ink">{t(locale, "proof.reportTitle")}</h2>
      <pre className="mt-2 whitespace-pre-wrap rounded-md bg-surface-2 p-3 text-xs text-ink-2">
        {reportMd || t(locale, "proof.reportEmpty")}
      </pre>
    </Card>
  );
}

function MythsAndReportColumn({ locale, reportMd }: { locale: Locale; reportMd: string }) {
  return (
    <div className="grid gap-4">
      <Card>
        <h2 className="text-lg font-bold text-ink">{t(locale, "proof.mythsTitle")}</h2>
        <div className="mt-3 grid gap-3">
          {MYTH_CARDS.map((card) => (
            <article
              key={card.id}
              className="rounded-md border border-divider bg-surface-2 p-3 text-sm"
            >
              <span className="inline-block rounded-pill bg-surface px-2 py-0.5 text-xs font-bold uppercase text-brand-ink">
                {card.verdict}
              </span>
              <h3 className="mt-1 font-bold text-ink">
                {locale === "hi" ? card.claimHi : card.claimEn}
              </h3>
              <p className="mt-1 text-ink-2">{locale === "hi" ? card.realityHi : card.realityEn}</p>
              <p className="mt-1 text-xs text-ink-3">{card.source}</p>
            </article>
          ))}
        </div>
      </Card>
      <ReportCard locale={locale} reportMd={reportMd} />
    </div>
  );
}

function PrivacyDeleteCard({ locale, onDelete }: { locale: Locale; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <Card>
      <h2 className="text-lg font-bold text-ink">{t(locale, "proof.privacyTitle")}</h2>
      <p className="mt-1 text-sm text-ink-2">{t(locale, "onboarding.subtitle")}</p>
      {confirming ? (
        <div className="mt-3 flex flex-wrap items-center gap-2" role="alert">
          <span className="text-xs font-semibold text-ink">{t(locale, "app.resetConfirm")}</span>
          <Button
            variant="primary"
            onClick={() => {
              setConfirming(false);
              onDelete();
            }}
          >
            {t(locale, "app.reset")}
          </Button>
          <Button onClick={() => setConfirming(false)}>{t(locale, "app.cancel")}</Button>
        </div>
      ) : (
        <Button className="mt-3" onClick={() => setConfirming(true)}>
          {t(locale, "app.reset")}
        </Button>
      )}
    </Card>
  );
}

/** Evidence registry, myth-busting cards, privacy data reset, and live repository verification report. */
export function ProofView({
  locale,
  onDeleteAllData,
}: {
  locale: Locale;
  onDeleteAllData: () => void;
}) {
  const [reportMd, setReportMd] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/verify-report", { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { markdown?: string }) => {
        if (d.markdown) setReportMd(d.markdown);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <div className="grid gap-4">
        <AssumptionsCard locale={locale} />
        <PrivacyDeleteCard locale={locale} onDelete={onDeleteAllData} />
      </div>
      <MythsAndReportColumn locale={locale} reportMd={reportMd} />
    </div>
  );
}
