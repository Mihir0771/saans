"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Locale } from "@/engine/schema";
import { recordWebmFromCanvas, speakChapter } from "@/lib/walkthrough-media";
import { renderWalkthroughFrame } from "@/lib/walkthrough-renderer";
import {
  sceneAtTime,
  sceneStartTime,
  TOTAL_WALKTHROUGH_SEC,
  WALKTHROUGH_SCENES,
} from "@/lib/walkthrough-scenes";
import { ChapterPills, PlayerControls, PlayerScrubber } from "./WalkthroughControls";

function usePreloadWalkthroughImages() {
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  useEffect(() => {
    for (const sc of WALKTHROUGH_SCENES) {
      if (!imagesRef.current[sc.image]) {
        const im = new Image();
        im.src = sc.image;
        imagesRef.current[sc.image] = im;
      }
    }
  }, []);
  return imagesRef;
}

function useWalkthroughLoop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  playing: boolean,
  secRef: React.MutableRefObject<number>,
  locale: Locale,
  voiceOn: boolean,
  setSec: (s: number) => void,
  setPlaying: (v: boolean) => void,
) {
  const imagesRef = usePreloadWalkthroughImages();
  const lastChRef = useRef<number>(-1);
  const fpsRef = useRef<number>(60);

  useEffect(() => {
    let raf = 0;
    let lastTs = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;
      if (dt > 0) fpsRef.current = Math.min(60, Math.max(30, Math.round(1 / dt)));
      if (playing) {
        secRef.current = Math.min(TOTAL_WALKTHROUGH_SEC, secRef.current + dt);
        if (secRef.current >= TOTAL_WALKTHROUGH_SEC) setPlaying(false);
        setSec(secRef.current);
      }
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        const ch = renderWalkthroughFrame(
          ctx,
          imagesRef.current,
          secRef.current,
          locale,
          fpsRef.current,
        );
        if (playing && ch !== lastChRef.current) {
          lastChRef.current = ch;
          speakChapter(ch, locale, voiceOn);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, locale, voiceOn, canvasRef, secRef, setSec, setPlaying, imagesRef]);
}

function WalkthroughStage({
  canvasRef,
  sec,
  locale,
  onTogglePlay,
  onSeek,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  sec: number;
  locale: Locale;
  onTogglePlay: () => void;
  onSeek: (val: number) => void;
}) {
  return (
    <>
      <div className="overflow-hidden rounded-lg border border-divider bg-surface-2 shadow-[var(--shadow-2)]">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          onClick={onTogglePlay}
          className="block aspect-video w-full cursor-pointer"
        />
      </div>
      <PlayerScrubber sec={sec} locale={locale} onSeek={onSeek} />
    </>
  );
}

function useWalkthroughController(locale: Locale, autoPlay: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const secRef = useRef<number>(0);
  const [sec, setSec] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [voiceOn, setVoiceOn] = useState(false);
  const [recording, setRecording] = useState(false);

  useWalkthroughLoop(canvasRef, playing, secRef, locale, voiceOn, setSec, setPlaying);
  useEffect(() => {
    if (!playing && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [playing]);

  const jumpTo = (tSec: number, playNow: boolean) => {
    secRef.current = tSec;
    setSec(tSec);
    setPlaying(playNow);
    if (playNow) speakChapter(sceneAtTime(tSec).index, locale, voiceOn);
  };
  const togglePlay = () => {
    if (!playing && secRef.current >= TOTAL_WALKTHROUGH_SEC - 0.05) {
      jumpTo(0, true);
      return;
    }
    setPlaying((v) => !v);
  };
  const onDownload = () =>
    canvasRef.current &&
    recordWebmFromCanvas(
      canvasRef.current,
      () => setRecording(true),
      () => setRecording(false),
      () => jumpTo(0, true),
    );
  return {
    canvasRef,
    sec,
    playing,
    togglePlay,
    voiceOn,
    setVoiceOn,
    recording,
    jumpTo,
    onDownload,
  };
}

export function WalkthroughPlayer({
  locale,
  autoPlay = false,
}: {
  locale: Locale;
  autoPlay?: boolean;
}) {
  const c = useWalkthroughController(locale, autoPlay);
  return (
    <div>
      <WalkthroughStage
        canvasRef={c.canvasRef}
        sec={c.sec}
        locale={locale}
        onTogglePlay={c.togglePlay}
        onSeek={(val) => c.jumpTo(val, c.playing)}
      />
      <PlayerControls
        playing={c.playing}
        voiceOn={c.voiceOn}
        recording={c.recording}
        locale={locale}
        onTogglePlay={c.togglePlay}
        onReplay={() => c.jumpTo(0, true)}
        onToggleVoice={() => c.setVoiceOn((v) => !v)}
        onDownload={c.onDownload}
      />
      <ChapterPills
        activeChapter={sceneAtTime(c.sec).index}
        locale={locale}
        onJump={(idx) => c.jumpTo(sceneStartTime(idx), true)}
      />
    </div>
  );
}
