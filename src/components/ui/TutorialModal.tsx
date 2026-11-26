"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { Button } from "./Primitives";

interface TutorialModalProps {
  open: boolean;
  locale: Locale;
  onClose: (dontShowAgain: boolean) => void;
  onPickWhat: (dontShowAgain: boolean) => void;
  onPickSharma: (dontShowAgain: boolean) => void;
  onPickAhmedabad: (dontShowAgain: boolean) => void;
  onPickCity: (dontShowAgain: boolean) => void;
}

const STEP_KEYS = [
  { title: "tutorial.step1Title", body: "tutorial.step1Body" },
  { title: "tutorial.step2Title", body: "tutorial.step2Body" },
  { title: "tutorial.step3Title", body: "tutorial.step3Body" },
  { title: "tutorial.step4Title", body: "tutorial.step4Body" },
] as const;

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: total }, (_, idx) => (
        <span
          key={idx}
          className={`h-2 rounded-pill transition-all ${
            idx === step ? "w-6 bg-brand" : "w-2 bg-line"
          }`}
        />
      ))}
    </div>
  );
}

function Step4Actions({
  locale,
  dontShow,
  onSharma,
  onAhmedabad,
  onCity,
}: {
  locale: Locale;
  dontShow: boolean;
  onSharma: (d: boolean) => void;
  onAhmedabad: (d: boolean) => void;
  onCity: (d: boolean) => void;
}) {
  return (
    <div className="mt-3 grid gap-2">
      <Button variant="primary" onClick={() => onSharma(dontShow)}>
        {t(locale, "onboarding.useSharma")}
      </Button>
      <Button onClick={() => onAhmedabad(dontShow)}>{t(locale, "onboarding.useAhmedabad")}</Button>
      <Button onClick={() => onCity(dontShow)}>{t(locale, "tutorial.setupCity")}</Button>
    </div>
  );
}

function TutorialNavButtons({
  step,
  total,
  locale,
  onPrev,
  onNext,
  onWatchVideo,
  onSkip,
}: {
  step: number;
  total: number;
  locale: Locale;
  onPrev: () => void;
  onNext: () => void;
  onWatchVideo: () => void;
  onSkip: () => void;
}) {
  const isLast = step === total - 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <StepDots step={step} total={total} />
      <div className="flex flex-wrap items-center gap-2">
        {step > 0 ? <Button onClick={onPrev}>{t(locale, "tutorial.back")}</Button> : null}
        {isLast ? (
          <>
            <Button onClick={onSkip}>{t(locale, "tutorial.skipToApp")}</Button>
            <Button variant="primary" onClick={onWatchVideo}>
              {t(locale, "tutorial.done")}
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={onNext}>
            {t(locale, "tutorial.next")}
          </Button>
        )}
      </div>
    </div>
  );
}

function TutorialFooter(p: {
  step: number;
  total: number;
  locale: Locale;
  dontShow: boolean;
  onToggleDontShow: (v: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  onWatchVideo: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="mt-4 grid gap-3 border-t border-divider pt-3">
      <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
        <input
          type="checkbox"
          checked={p.dontShow}
          onChange={(e) => p.onToggleDontShow(e.target.checked)}
          className="h-5 w-5 accent-[var(--brand)]"
        />
        <span>{t(p.locale, "tutorial.dontShow")}</span>
      </label>
      <TutorialNavButtons
        step={p.step}
        total={p.total}
        locale={p.locale}
        onPrev={p.onPrev}
        onNext={p.onNext}
        onWatchVideo={p.onWatchVideo}
        onSkip={p.onSkip}
      />
    </div>
  );
}

function TutorialHeader({
  step,
  total,
  locale,
  onClose,
}: {
  step: number;
  total: number;
  locale: Locale;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <span className="inline-block rounded-pill bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand-ink">
          {t(locale, "tutorial.badge")} · {step + 1}/{total}
        </span>
        <h1 id="tutorial-title" className="mt-2 text-lg font-bold text-ink">
          {t(locale, "tutorial.welcome")}
        </h1>
      </div>
      <Button variant="ghost" onClick={onClose} aria-label={t(locale, "app.close")}>
        ✕
      </Button>
    </div>
  );
}

function TutorialStepCard({
  step,
  locale,
  dontShow,
  onPickSharma,
  onPickAhmedabad,
  onPickCity,
}: {
  step: number;
  locale: Locale;
  dontShow: boolean;
  onPickSharma: (d: boolean) => void;
  onPickAhmedabad: (d: boolean) => void;
  onPickCity: (d: boolean) => void;
}) {
  const current = STEP_KEYS[step] ?? STEP_KEYS[0];
  return (
    <div className="mt-3 rounded-md bg-surface-2 p-3.5">
      <h2 className="text-base font-bold text-ink">{t(locale, current.title)}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{t(locale, current.body)}</p>
      {step === STEP_KEYS.length - 1 ? (
        <Step4Actions
          locale={locale}
          dontShow={dontShow}
          onSharma={onPickSharma}
          onAhmedabad={onPickAhmedabad}
          onCity={onPickCity}
        />
      ) : null}
    </div>
  );
}

export function TutorialModal(p: TutorialModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (p.open && !dlg.open) {
      setStep(0);
      dlg.showModal();
    } else if (!p.open && dlg.open) {
      dlg.close();
    }
  }, [p.open]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, string>)}
      aria-labelledby="tutorial-title"
      onClose={() => p.onClose(dontShow)}
      className="m-auto w-[min(500px,calc(100vw-24px))] rounded-lg border border-divider bg-surface p-5 text-ink shadow-[var(--shadow-2)]"
    >
      <TutorialHeader
        step={step}
        total={STEP_KEYS.length}
        locale={p.locale}
        onClose={() => p.onClose(dontShow)}
      />
      <TutorialStepCard
        step={step}
        locale={p.locale}
        dontShow={dontShow}
        onPickSharma={p.onPickSharma}
        onPickAhmedabad={p.onPickAhmedabad}
        onPickCity={p.onPickCity}
      />
      <TutorialFooter
        step={step}
        total={STEP_KEYS.length}
        locale={p.locale}
        dontShow={dontShow}
        onToggleDontShow={setDontShow}
        onPrev={() => setStep((s) => Math.max(0, s - 1))}
        onNext={() => setStep((s) => Math.min(STEP_KEYS.length - 1, s + 1))}
        onWatchVideo={() => p.onPickWhat(dontShow)}
        onSkip={() => p.onClose(dontShow)}
      />
    </dialog>
  );
}
