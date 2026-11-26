import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = Number.parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseTokens(css: string, blockSelector: string): Record<string, string> {
  const start = css.indexOf(blockSelector);
  const open = css.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const block = css.slice(open, end);
  const map: Record<string, string> = {};
  const rx = /(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})/g;
  for (const match of block.matchAll(rx)) {
    const key = match[1];
    const val = match[2];
    if (key && val) map[key] = val;
  }
  return map;
}

function walkSrcFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkSrcFiles(full));
    else if (/\.(ts|tsx|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

describe("Design tokens & WCAG contrast", () => {
  const tokensCss = fs.readFileSync(path.resolve("src/styles/tokens.css"), "utf8");
  const light = parseTokens(tokensCss, ":root {");
  const dark = parseTokens(tokensCss, ':root[data-theme="dark"] {');

  const textPairs: Array<[string, string, number]> = [
    ["--ink", "--bg", 4.5],
    ["--ink", "--surface", 4.5],
    ["--ink-2", "--bg", 4.5],
    ["--ink-2", "--surface", 4.5],
    ["--ink-3", "--surface", 4.5],
    ["--brand-ink", "--surface", 4.5],
    ["--on-brand", "--brand", 4.5],
    ["--danger", "--surface", 4.5],
    ["--warn", "--surface", 4.5],
    ["--save", "--surface", 4.5],
    ["--typical", "--surface", 4.5],
  ];

  const aqiBands = ["good", "sat", "mod", "poor", "vpoor", "severe"];

  it("passes WCAG AA text contrast in light and dark themes", () => {
    for (const [fg, bg, min] of textPairs) {
      expect(contrastRatio(light[fg] ?? "", light[bg] ?? "")).toBeGreaterThanOrEqual(min);
      expect(contrastRatio(dark[fg] ?? "", dark[bg] ?? "")).toBeGreaterThanOrEqual(min);
    }
  });

  it("passes WCAG AA contrast for all AQI bands (ink on fill >= 4.5, edge on surface >= 3.0)", () => {
    for (const band of aqiBands) {
      expect(
        contrastRatio(light[`--aqi-${band}-ink`] ?? "", light[`--aqi-${band}-fill`] ?? ""),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(dark[`--aqi-${band}-ink`] ?? "", dark[`--aqi-${band}-fill`] ?? ""),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(light[`--aqi-${band}-edge`] ?? "", light["--surface"] ?? ""),
      ).toBeGreaterThanOrEqual(3.0);
      expect(
        contrastRatio(dark[`--aqi-${band}-edge`] ?? "", dark["--surface"] ?? ""),
      ).toBeGreaterThanOrEqual(3.0);
    }
  });

  it("passes component border contrast (--line on --surface >= 3.0)", () => {
    expect(contrastRatio(light["--line"] ?? "", light["--surface"] ?? "")).toBeGreaterThanOrEqual(
      3.0,
    );
    expect(contrastRatio(dark["--line"] ?? "", dark["--surface"] ?? "")).toBeGreaterThanOrEqual(
      3.0,
    );
  });

  it("forbids raw hex colours outside src/styles/tokens.css", () => {
    const srcFiles = walkSrcFiles(path.resolve("src"));
    const hexRx = /#[0-9a-fA-F]{3,8}\b/g;
    const violations: string[] = [];
    for (const file of srcFiles) {
      if (file.endsWith(path.join("styles", "tokens.css"))) continue;
      const content = fs.readFileSync(file, "utf8");
      const matches = content.match(hexRx);
      if (matches) violations.push(`${file}: ${matches.join(", ")}`);
    }
    expect(violations).toEqual([]);
  });
});
