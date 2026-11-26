import { NextRequest, NextResponse } from "next/server";
import { extractUserGeminiKey } from "@/server/gemini";
import { checkRateLimit, clientIpFromHeaders } from "@/server/ratelimit";
import {
  analyzePurifierImage,
  detectImageMime,
  MAX_IMAGE_BYTES,
  offlineVisionFallback,
} from "@/server/vision";

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers);
  if (!checkRateLimit(`vision:${ip}`, 10)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image upload" }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image must be under 4 MB" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = detectImageMime(bytes);
  if (!mime) {
    return NextResponse.json(
      { error: "Unsupported image format (use JPEG, PNG, or WebP)" },
      { status: 400 },
    );
  }

  try {
    const specs = await analyzePurifierImage(bytes, mime, extractUserGeminiKey(req.headers));
    return NextResponse.json({ specs, offlineFallback: false });
  } catch {
    return NextResponse.json({ specs: offlineVisionFallback(), offlineFallback: true });
  }
}
