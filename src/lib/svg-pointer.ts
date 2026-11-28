"use client";

import type React from "react";

/**
 * Computes normalized `[0, 1]` horizontal pointer ratio inside an SVG element,
 * guarding against zero-width renders before layout completes.
 */
export function pointerRatioInSvg(
  e: React.PointerEvent<SVGSVGElement>,
  viewBoxWidth = 336,
  leftBound = 0,
  rightBound = viewBoxWidth,
): number {
  const rect = e.currentTarget.getBoundingClientRect();
  if (rect.width <= 0 || rightBound <= leftBound) return 0;
  const svgX = ((e.clientX - rect.left) / rect.width) * viewBoxWidth;
  const clamped = Math.max(leftBound, Math.min(rightBound, svgX));
  return (clamped - leftBound) / (rightBound - leftBound);
}
