"use client";

import React, { useEffect, useRef } from "react";
import type { FactItem, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
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
        <h1 id="math-drawer-title" className="text-lg font-bold text-ink">
          {detail.title}
        </h1>
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

export function MathDrawer({
  detail,
  locale,
  onClose,
}: {
  detail: MathDetail | null;
  locale: Locale;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (detail && !dlg.open) dlg.showModal();
    else if (!detail && dlg.open) dlg.close();
  }, [detail]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg || "closedBy" in HTMLDialogElement.prototype) return undefined;
    const onPointerDown = (e: MouseEvent) => {
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right)
        dlg.close();
    };
    dlg.addEventListener("click", onPointerDown);
    return () => dlg.removeEventListener("click", onPointerDown);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, string>)}
      aria-labelledby="math-drawer-title"
      onClose={onClose}
      className="m-auto w-[min(460px,calc(100vw-24px))] rounded-lg border border-divider bg-surface p-5 text-ink shadow-[var(--shadow-2)]"
    >
      {detail ? <MathContent detail={detail} locale={locale} onClose={onClose} /> : null}
    </dialog>
  );
}
