"use client";

import React from "react";
import type { CpcbBand, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";

const BAND_VARS: Record<CpcbBand, { fill: string; ink: string; edge: string }> = {
  good: { fill: "var(--aqi-good-fill)", ink: "var(--aqi-good-ink)", edge: "var(--aqi-good-edge)" },
  sat: { fill: "var(--aqi-sat-fill)", ink: "var(--aqi-sat-ink)", edge: "var(--aqi-sat-edge)" },
  mod: { fill: "var(--aqi-mod-fill)", ink: "var(--aqi-mod-ink)", edge: "var(--aqi-mod-edge)" },
  poor: { fill: "var(--aqi-poor-fill)", ink: "var(--aqi-poor-ink)", edge: "var(--aqi-poor-edge)" },
  vpoor: {
    fill: "var(--aqi-vpoor-fill)",
    ink: "var(--aqi-vpoor-ink)",
    edge: "var(--aqi-vpoor-edge)",
  },
  severe: {
    fill: "var(--aqi-severe-fill)",
    ink: "var(--aqi-severe-ink)",
    edge: "var(--aqi-severe-edge)",
  },
};

export function BandShapeIcon({ band, size = 14 }: { band: CpcbBand; size?: number }) {
  const color = BAND_VARS[band].edge;
  const shapes: Record<CpcbBand, React.ReactNode> = {
    good: <circle cx="8" cy="8" r="6.5" fill={color} />,
    sat: <path d="M8 1.5L14.5 8L8 14.5L1.5 8z" fill={color} />,
    mod: <path d="M8 1.5L15 14H1z" fill={color} />,
    poor: <rect x="2" y="2" width="12" height="12" rx="1.5" fill={color} />,
    vpoor: <path d="M8 1.5L14.5 6.2L12 14H4L1.5 6.2z" fill={color} />,
    severe: <path d="M5.2 1.5h5.6L14.5 5.2v5.6L10.8 14.5H5.2L1.5 10.8V5.2z" fill={color} />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      {shapes[band]}
    </svg>
  );
}

export function AQIChip({ aqi, band, locale }: { aqi: number; band: CpcbBand; locale: Locale }) {
  const v = BAND_VARS[band];
  const label = t(locale, `aqiBands.${band}`);
  return (
    <span
      className="inline-flex min-h-[36px] items-center gap-2 rounded-pill border-2 px-3 font-bold"
      style={{ backgroundColor: v.fill, color: v.ink, borderColor: v.edge }}
    >
      <BandShapeIcon band={band} size={16} />
      <span className="font-num">
        {aqi} · {label}
      </span>
    </span>
  );
}
