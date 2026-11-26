import type { Locale } from "@/engine/schema";
import { sceneCaption, TOTAL_WALKTHROUGH_SEC, WALKTHROUGH_SCENES } from "./walkthrough-scenes";

export function speakChapter(idx: number, locale: Locale, enabled: boolean) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  if (!enabled) return;
  const sc = WALKTHROUGH_SCENES[idx];
  if (!sc) return;
  const utter = new SpeechSynthesisUtterance(sceneCaption(sc, locale));
  utter.lang = locale === "hi" ? "hi-IN" : "en-IN";
  window.speechSynthesis.speak(utter);
}

export function recordWebmFromCanvas(
  canvas: HTMLCanvasElement,
  onStart: () => void,
  onStop: () => void,
  onResetPlay: () => void,
) {
  if (typeof MediaRecorder === "undefined" || !canvas.captureStream) return;
  const stream = canvas.captureStream(60);
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  recorder.ondataavailable = (ev) => {
    if (ev.data.size > 0) chunks.push(ev.data);
  };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saans-walkthrough-60fps.webm";
    a.click();
    URL.revokeObjectURL(url);
    onStop();
  };
  onStart();
  onResetPlay();
  recorder.start(250);
  window.setTimeout(() => {
    if (recorder.state === "recording") recorder.stop();
  }, TOTAL_WALKTHROUGH_SEC * 1000);
}
