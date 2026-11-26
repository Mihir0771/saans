"use client";

import React from "react";

const BOX = { l: 34, r: 326, t: 14, b: 156 };

function LabGrid({ maxY, y }: { maxY: number; y: (v: number) => number }) {
  return (
    <>
      {[0, 0.5, 1].map((frac) => {
        const val = Math.round(maxY * frac);
        const yy = y(val);
        return (
          <g key={frac}>
            <line x1={BOX.l} x2={BOX.r} y1={yy} y2={yy} stroke="var(--divider)" strokeWidth="1" />
            <text x={BOX.l - 6} y={yy + 4} textAnchor="end" className="fill-ink-2 text-[11px]">
              {val}
            </text>
          </g>
        );
      })}
    </>
  );
}

function LabEndLabels({ outY, inY }: { outY: number; inY: number }) {
  return (
    <>
      <text
        x={BOX.r}
        y={Math.max(20, outY - 6)}
        textAnchor="end"
        className="text-[11px] font-bold"
        fill="var(--typical)"
      >
        Outdoor
      </text>
      <text
        x={BOX.r}
        y={Math.min(BOX.b - 4, inY + 14)}
        textAnchor="end"
        className="text-[11px] font-bold"
        fill="var(--plan)"
      >
        Indoor
      </text>
    </>
  );
}

export function IndoorBandSvg({
  outdoor,
  low,
  central,
  high,
}: {
  outdoor: number[];
  low: number[];
  central: number[];
  high: number[];
}) {
  const maxY = Math.max(200, ...outdoor, ...high);
  const x = (h: number) => BOX.l + ((BOX.r - BOX.l) * h) / 23;
  const y = (v: number) => BOX.b - ((BOX.b - BOX.t) * v) / maxY;
  const poly = `${high.map((v, h) => `${x(h)},${y(v)}`).join(" ")} ${[...low]
    .reverse()
    .map((v, i) => `${x(23 - i)},${y(v)}`)
    .join(" ")}`;
  const line = (arr: number[]) => arr.map((v, h) => `${x(h)},${y(v)}`).join(" ");
  return (
    <svg
      className="block h-auto w-full"
      viewBox="0 0 336 184"
      role="img"
      aria-label="24-hour indoor vs outdoor PM2.5 simulation"
    >
      <LabGrid maxY={maxY} y={y} />
      <polygon points={poly} fill="var(--brand-soft)" opacity="0.7" />
      <polyline
        points={line(outdoor)}
        fill="none"
        stroke="var(--typical)"
        strokeWidth="2.5"
        strokeDasharray="6 4"
      />
      <polyline points={line(central)} fill="none" stroke="var(--plan)" strokeWidth="3" />
      <LabEndLabels outY={y(outdoor[23] ?? 0)} inY={y(central[23] ?? 0)} />
    </svg>
  );
}
