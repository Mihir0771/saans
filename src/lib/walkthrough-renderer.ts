import type { Locale } from "@/engine/schema";
import {
  sceneAtTime,
  sceneCaption,
  sceneTitle,
  TOTAL_WALKTHROUGH_SEC,
  type WalkthroughScene,
} from "./walkthrough-scenes";

interface ThemePalette {
  brand: string;
  onBrand: string;
  accent: string;
  darkBg: string;
  lightText: string;
}

function readPalette(canvas: HTMLCanvasElement): ThemePalette {
  const cs = typeof window !== "undefined" ? getComputedStyle(canvas) : null;
  const v = (name: string, fb: string) => cs?.getPropertyValue(name).trim() || fb;
  return {
    brand: v("--brand", "rgb(14, 107, 99)"),
    onBrand: v("--on-brand", "rgb(255, 255, 255)"),
    accent: v("--brand-ink", "rgb(143, 224, 212)"),
    darkBg: "rgb(11, 21, 19)",
    lightText: "rgb(234, 242, 239)",
  };
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function drawFocusSpotlight(
  ctx: CanvasRenderingContext2D,
  scene: WalkthroughScene,
  progress: number,
  pal: ThemePalette,
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const pulse = 1 + 0.03 * Math.sin(progress * Math.PI * 6);
  ctx.save();
  ctx.strokeStyle = pal.brand;
  ctx.lineWidth = 4;
  ctx.shadowColor = pal.accent;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.roundRect(
    scene.focusX * w,
    scene.focusY * h,
    scene.focusW * w * pulse,
    scene.focusH * h * pulse,
    16,
  );
  ctx.stroke();

  const tMove = easeOutCubic(Math.min(1, progress * 1.4));
  const curX = (0.12 + (scene.focusX + scene.focusW * 0.5 - 0.12) * tMove) * w;
  const curY = (0.8 + (scene.focusY + scene.focusH * 0.45 - 0.8) * tMove) * h;
  ctx.fillStyle = pal.lightText;
  ctx.strokeStyle = pal.darkBg;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(curX, curY);
  ctx.lineTo(curX + 18, curY + 11);
  ctx.lineTo(curX + 8, curY + 13);
  ctx.lineTo(curX + 4, curY + 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawOverlays(
  ctx: CanvasRenderingContext2D,
  scene: WalkthroughScene,
  sec: number,
  locale: Locale,
  fps: number,
  pal: ThemePalette,
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const grad = ctx.createLinearGradient(0, h - 185, 0, h);
  grad.addColorStop(0, "rgba(11, 21, 19, 0)");
  grad.addColorStop(0.32, "rgba(11, 21, 19, 0.88)");
  grad.addColorStop(1, "rgba(11, 21, 19, 0.96)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - 185, w, 185);

  ctx.fillStyle = pal.brand;
  ctx.beginPath();
  ctx.roundRect(28, 22, 124, 32, 16);
  ctx.fill();
  ctx.fillStyle = pal.onBrand;
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.fillText(`SAANS · ${fps} FPS`, 40, 43);

  ctx.fillStyle = pal.accent;
  ctx.font = "700 22px system-ui, sans-serif";
  ctx.fillText(sceneTitle(scene, locale), 32, h - 102);

  ctx.fillStyle = pal.lightText;
  ctx.font = "500 18px system-ui, sans-serif";
  wrapLines(ctx, sceneCaption(scene, locale), w - 64).forEach((ln, idx) =>
    ctx.fillText(ln, 32, h - 66 + idx * 26),
  );

  const pct = Math.min(1, Math.max(0, sec / TOTAL_WALKTHROUGH_SEC));
  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  ctx.fillRect(32, h - 18, w - 64, 6);
  ctx.fillStyle = pal.brand;
  ctx.fillRect(32, h - 18, (w - 64) * pct, 6);
}

export function renderWalkthroughFrame(
  ctx: CanvasRenderingContext2D,
  images: Record<string, HTMLImageElement>,
  sec: number,
  locale: Locale,
  fps: number,
): number {
  const pal = readPalette(ctx.canvas);
  const { scene, index, progress } = sceneAtTime(sec);
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.fillStyle = pal.darkBg;
  ctx.fillRect(0, 0, w, h);

  const img = images[scene.image];
  if (img && img.complete && img.naturalWidth > 0) {
    const zoom = 1 + 0.04 * easeOutCubic(progress);
    ctx.drawImage(img, (w - w * zoom) / 2, (h - h * zoom) / 2, w * zoom, h * zoom);
  }

  drawFocusSpotlight(ctx, scene, progress, pal);
  drawOverlays(ctx, scene, sec, locale, fps, pal);
  return index;
}
