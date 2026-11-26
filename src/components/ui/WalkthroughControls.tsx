"use client";

import React from "react";
import type { Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import { sceneTitle, TOTAL_WALKTHROUGH_SEC, WALKTHROUGH_SCENES } from "@/lib/walkthrough-scenes";
import { Button } from "./Primitives";

export function PlayerControls({
  playing,
  voiceOn,
  recording,
  locale,
  onTogglePlay,
  onReplay,
  onToggleVoice,
  onDownload,
}: {
  playing: boolean;
  voiceOn: boolean;
  recording: boolean;
  locale: Locale;
  onTogglePlay: () => void;
  onReplay: () => void;
  onToggleVoice: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button variant="primary" onClick={onTogglePlay}>
        {playing ? t(locale, "what.pause") : t(locale, "what.play")}
      </Button>
      <Button onClick={onReplay}>{t(locale, "what.replay")}</Button>
      <Button aria-pressed={voiceOn} onClick={onToggleVoice}>
        {voiceOn ? t(locale, "what.voiceOn") : t(locale, "what.voiceOff")}
      </Button>
      <Button disabled={recording} onClick={onDownload}>
        {recording ? t(locale, "what.recordingWebm") : t(locale, "what.downloadWebm")}
      </Button>
    </div>
  );
}

export function ChapterPills({
  activeChapter,
  locale,
  onJump,
}: {
  activeChapter: number;
  locale: Locale;
  onJump: (idx: number) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Walkthrough chapters">
      {WALKTHROUGH_SCENES.map((sc, idx) => (
        <Button
          key={sc.id}
          aria-pressed={idx === activeChapter}
          onClick={() => onJump(idx)}
          className="!min-h-[36px] !px-3 text-xs"
        >
          {sceneTitle(sc, locale).split("—")[0]?.trim()}
        </Button>
      ))}
    </div>
  );
}

export function PlayerScrubber({
  sec,
  locale,
  onSeek,
}: {
  sec: number;
  locale: Locale;
  onSeek: (val: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={TOTAL_WALKTHROUGH_SEC}
        step={0.1}
        value={sec}
        aria-label={t(locale, "what.badge")}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="h-6 flex-1 accent-[var(--brand)]"
      />
      <span className="font-num text-xs font-bold text-ink-2">
        {Math.floor(sec)}s / {TOTAL_WALKTHROUGH_SEC}s
      </span>
    </div>
  );
}
