"use client";

import React from "react";
import type { Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { Button, Card } from "../ui/Primitives";
import { WalkthroughPlayer } from "../ui/WalkthroughPlayer";

interface WhatIsThisProps {
  locale: Locale;
  autoPlay?: boolean;
  onTrySharma: () => void;
  onTryAhmedabad: () => void;
  onOpenAsk: () => void;
  onOpenSetup: () => void;
}

function ExplainerGrid({ locale }: { locale: Locale }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-lg font-bold text-ink">{t(locale, "what.whyTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{t(locale, "what.whyBody")}</p>
      </Card>
      <Card>
        <h2 className="text-lg font-bold text-ink">{t(locale, "what.howEngineTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{t(locale, "what.howEngineBody")}</p>
      </Card>
    </div>
  );
}

function QuickGuideCard(p: WhatIsThisProps) {
  const keys = ["what.howUseList1", "what.howUseList2", "what.howUseList3", "what.howUseList4"];
  return (
    <Card>
      <h2 className="text-lg font-bold text-ink">{t(p.locale, "what.howUseTitle")}</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-2">
        {keys.map((k) => (
          <li key={k}>{t(p.locale, k)}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" onClick={p.onTrySharma}>
          {t(p.locale, "what.tryDelhiBtn")}
        </Button>
        <Button onClick={p.onTryAhmedabad}>{t(p.locale, "what.tryAhmBtn")}</Button>
        <Button onClick={p.onOpenAsk}>{t(p.locale, "what.tryAskBtn")}</Button>
        <Button onClick={p.onOpenSetup}>{t(p.locale, "what.trySetupBtn")}</Button>
      </div>
    </Card>
  );
}

export function WhatIsThisView(p: WhatIsThisProps) {
  return (
    <div className="grid min-w-0 gap-4">
      <Card>
        <span className="inline-block rounded-pill bg-brand-soft px-3 py-0.5 text-xs font-bold text-brand-ink">
          {t(p.locale, "what.badge")}
        </span>
        <h1 className="mt-2 text-xl font-bold text-ink">{t(p.locale, "what.title")}</h1>
        <p className="mb-3 mt-1 text-sm text-ink-2">{t(p.locale, "what.subtitle")}</p>
        <WalkthroughPlayer locale={p.locale} autoPlay={p.autoPlay} />
      </Card>
      <ExplainerGrid locale={p.locale} />
      <QuickGuideCard {...p} />
    </div>
  );
}
