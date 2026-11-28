import type { NextRequest } from "next/server";
import { extractUserGeminiKey } from "@/server/gemini";
import { apiError, enforceRouteRateLimit, jsonNoStore } from "@/server/http";
import {
  analyzePurifierImage,
  detectImageMime,
  MAX_IMAGE_BYTES,
  offlineVisionFallback,
} from "@/server/vision";

/**
 * Extracts structured purifier/filter CADR & MERV metadata in memory from a
 * validated JPEG, PNG, or WebP upload without persisting image bytes.
 */
export async function POST(req: NextRequest) {
  const blocked = enforceRouteRateLimit(req, "vision", 10);
  if (blocked) return blocked;

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) return apiError("Missing image upload", 400);

  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    return apiError("Image must be under 4 MB", 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = detectImageMime(bytes);
  if (!mime) return apiError("Unsupported image format (use JPEG, PNG, or WebP)", 400);

  try {
    const specs = await analyzePurifierImage(bytes, mime, extractUserGeminiKey(req.headers));
    return jsonNoStore({ specs, offlineFallback: false });
  } catch {
    return jsonNoStore({ specs: offlineVisionFallback(), offlineFallback: true });
  }
}
