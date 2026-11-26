import { NextResponse } from "next/server";
import { getGeminiModels, isGeminiConfigured } from "@/server/gemini";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "saans",
    geminiConfigured: isGeminiConfigured(),
    models: getGeminiModels(),
    timestamp: new Date().toISOString(),
  });
}
