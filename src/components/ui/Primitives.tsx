"use client";

import React from "react";

export function Button({
  variant = "secondary",
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-pill font-semibold cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: "min-h-[48px] px-5 bg-brand text-on-brand border border-brand hover:opacity-95",
    secondary:
      "min-h-[44px] px-4 bg-surface text-ink border border-line hover:bg-surface-2 aria-[pressed=true]:border-brand aria-[pressed=true]:bg-brand-soft aria-[pressed=true]:text-brand-ink",
    ghost:
      "min-h-[44px] px-3 bg-transparent text-brand-ink border border-transparent hover:bg-brand-soft",
  };
  return (
    <button type="button" className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Card({ children, className = "", ...rest }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={`min-w-0 bg-surface border border-divider rounded-lg p-4 shadow-[var(--shadow-1)] ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

export function Banner({
  label,
  text,
  actionLabel,
  onAction,
}: {
  label: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      role="note"
      className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-dashed border-warn bg-surface px-3 py-2 text-sm text-ink"
    >
      <div className="flex items-start gap-2">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        >
          <circle cx="12" cy="12" r="10" fill="none" stroke="var(--warn)" strokeWidth="2" />
          <path d="M12 7v6M12 16.5v.5" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>
          <strong className="text-warn">{label}</strong> {text}
        </span>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="min-h-[44px] px-3 font-bold text-brand-ink underline underline-offset-4"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function StatTile({
  value,
  label,
  tone = "neutral",
}: {
  value: string;
  label: string;
  tone?: "neutral" | "save";
}) {
  return (
    <div className="rounded-md bg-surface-2 p-3 text-center">
      <b
        className={`block font-num text-xl leading-tight ${tone === "save" ? "text-save" : "text-ink"}`}
      >
        {value}
      </b>
      <span className="text-xs text-ink-2">{label}</span>
    </div>
  );
}

/** Animated placeholder block shown while air data loads. */
export function SkeletonCard({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="rounded-lg border border-divider bg-surface p-4"
      aria-busy="true"
      aria-label={label}
    >
      <div className="h-4 w-28 rounded bg-surface-2" />
      <div className="mt-3 h-24 w-full rounded-md bg-surface-2" />
    </div>
  );
}
