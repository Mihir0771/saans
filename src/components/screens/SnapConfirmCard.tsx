"use client";

import React, { useState } from "react";
import type { Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { loadUserGeminiKey } from "@/lib/storage";
import type { VisionSpecs } from "@/server/vision";
import { Button, Card } from "../ui/Primitives";

function SnapPreviewForm({
  specs,
  cadrEdit,
  locale,
  onCadr,
  onApply,
}: {
  specs: VisionSpecs;
  cadrEdit: string;
  locale: Locale;
  onCadr: (v: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="mt-3 grid gap-2 rounded-md bg-surface-2 p-3 text-sm">
      <p className="text-ink-2">{specs.notes}</p>
      <div className="flex items-center gap-2">
        <label htmlFor="snap-cadr" className="font-semibold text-ink">
          CADR (m³/h)
        </label>
        <input
          id="snap-cadr"
          type="number"
          value={cadrEdit}
          onChange={(e) => onCadr(e.target.value)}
          className="min-h-[44px] w-28 rounded-sm border border-line bg-surface px-2 font-num"
        />
        <Button variant="primary" onClick={onApply}>
          {t(locale, "lab.snapApply")}
        </Button>
      </div>
    </div>
  );
}

async function uploadLabelPhoto(
  file: File,
  locale: Locale,
): Promise<{ specs: VisionSpecs | null; err: string | null }> {
  const fd = new FormData();
  fd.append("image", file);
  const userKey = loadUserGeminiKey();
  const headers: Record<string, string> = userKey ? { "x-gemini-api-key": userKey } : {};
  const res = await fetch("/api/vision", { method: "POST", headers, body: fd });
  const data = (await res.json().catch(() => ({}))) as { specs?: VisionSpecs; error?: string };
  if (!res.ok || !data.specs) {
    return { specs: null, err: data.error ?? t(locale, "lab.snapError") };
  }
  return { specs: data.specs, err: null };
}

function SnapUploadInput({
  busy,
  locale,
  onFile,
}: {
  busy: boolean;
  locale: Locale;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <label className="mt-3 inline-flex min-h-[44px] cursor-pointer items-center rounded-pill border border-line bg-surface-2 px-4 text-sm font-semibold text-ink">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {busy ? t(locale, "lab.snapBusy") : t(locale, "lab.snapUpload")}
    </label>
  );
}

async function processSnapUpload(
  file: File,
  locale: Locale,
  setBusy: (b: boolean) => void,
  setErrorMsg: (e: string | null) => void,
  setSpecs: (s: VisionSpecs | null) => void,
  setCadrEdit: (c: string) => void,
) {
  setBusy(true);
  setErrorMsg(null);
  try {
    const { specs: next, err } = await uploadLabelPhoto(file, locale);
    if (next) {
      setSpecs(next);
      setCadrEdit(String(next.cadr_m3h ?? Math.round((next.cadr_cfm ?? 200) * 1.7)));
    } else setErrorMsg(err ?? t(locale, "lab.snapError"));
  } catch {
    setErrorMsg(t(locale, "lab.snapError"));
  } finally {
    setBusy(false);
  }
}

export function SnapConfirmCard({
  locale,
  onApplyCadr,
}: {
  locale: Locale;
  onApplyCadr: (cadr: number) => void;
}) {
  const [specs, setSpecs] = useState<VisionSpecs | null>(null);
  const [cadrEdit, setCadrEdit] = useState("350");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (file) void processSnapUpload(file, locale, setBusy, setErrorMsg, setSpecs, setCadrEdit);
  };

  return (
    <Card aria-labelledby="snap-heading">
      <h2 id="snap-heading" className="text-lg font-bold text-ink">
        {t(locale, "lab.snapTitle")}
      </h2>
      <p className="mt-1 text-sm text-ink-2">{t(locale, "lab.snapSub")}</p>
      <SnapUploadInput busy={busy} locale={locale} onFile={handleFile} />
      {errorMsg ? (
        <p role="alert" className="mt-2 text-xs font-semibold text-danger">
          {errorMsg}
        </p>
      ) : null}
      {specs ? (
        <SnapPreviewForm
          specs={specs}
          cadrEdit={cadrEdit}
          locale={locale}
          onCadr={setCadrEdit}
          onApply={() => onApplyCadr(Number(cadrEdit) || 350)}
        />
      ) : null}
    </Card>
  );
}
