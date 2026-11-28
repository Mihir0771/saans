"use client";

import React from "react";
import type { FactItem, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { DialogFrame } from "./DialogFrame";
import { Button } from "./Primitives";

export interface MathDetail {
  title: string;
  formula: string;
  inputs: string[];
  source: string;
  confidence: "A" | "B" | "C";
  fact?: FactItem;
}

function MathContent({
  detail,
  locale,
  onClose,
}: {
  detail: MathDetail;
  locale: Locale;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h2 id="math-drawer-title" className="text-lg font-bold text-ink">
          {detail.title}
        </h2>
        <Button variant="ghost" onClick={onClose} aria-label={t(locale, "app.close")}>
          ✕
        </Button>
      </div>
      <div className="rounded-md bg-surface-2 p-3 font-mono text-sm text-ink">{detail.formula}</div>
      <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
        {detail.inputs.map((inp) => (
          <li key={inp}>{inp}</li>
        ))}
      </ul>
      <p className="text-xs text-ink-3">
        Confidence: <strong>{detail.confidence}</strong> · {detail.source}
      </p>
    </div>
  );
}

/** Accessible modal drawer explaining engine formulas and data sources. */
export function MathDrawer({
  detail,
  locale,
  onClose,
}: {
  detail: MathDetail | null;
  locale: Locale;
  onClose: () => void;
}) {
  return (
    <DialogFrame
      open={Boolean(detail)}
      labelledBy="math-drawer-title"
      onClose={onClose}
      className="m-auto w-[min(460px,calc(100vw-24px))] rounded-lg border border-divider bg-surface p-5 text-ink shadow-[var(--shadow-2)]"
    >
      {detail ? <MathContent detail={detail} locale={locale} onClose={onClose} /> : null}
    </DialogFrame>
  );
}
