import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { LruCache } from "./cache";

const responseCache = new LruCache<string>(200, 30 * 60 * 1000);
let dailyCalls = 0;
let dailyResetDate = "";

export function getGeminiModels(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  const fallbacks = (
    process.env.GEMINI_FALLBACK_MODELS ?? "gemini-3.5-flash-lite,gemini-3.1-flash-lite"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set([primary, ...fallbacks]));
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10);
}

export function checkDailyGeminiBudget(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyResetDate) {
    dailyResetDate = today;
    dailyCalls = 0;
  }
  const max = Number(process.env.GEMINI_DAILY_BUDGET ?? 1000);
  if (dailyCalls >= max) return false;
  dailyCalls += 1;
  return true;
}

export function loadPromptFile(name: "system" | "explain" | "chat" | "vision"): string {
  const full = path.resolve("prompts", `${name}.md`);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
}

export function cacheKeyForPayload(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 24);
}

export function getCachedAiResponse(key: string): string | undefined {
  return responseCache.get(key);
}

export function setCachedAiResponse(key: string, val: string): void {
  responseCache.set(key, val);
}

export function createGeminiClient(): GoogleGenAI | null {
  if (!isGeminiConfigured()) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export function extractInteractionText(outputs?: Array<{ type?: string; text?: string }>): string {
  if (!outputs) return "";
  return outputs
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text ?? "")
    .join("");
}

export async function runWithModelFallback<T>(
  fn: (client: GoogleGenAI, model: string) => Promise<T>,
): Promise<T> {
  const client = createGeminiClient();
  if (!client) throw new Error("GEMINI_API_KEY not configured");
  if (!checkDailyGeminiBudget()) throw new Error("Daily Gemini budget reached");

  const models = getGeminiModels();
  let lastError: unknown;
  for (const model of models) {
    try {
      return await fn(client, model);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
