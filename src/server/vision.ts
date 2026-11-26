import { z } from "zod";
import { extractInteractionText, loadPromptFile, runWithModelFallback } from "./gemini";

export const VisionSpecsSchema = z.object({
  kind: z.enum(["purifier", "filter", "room", "other"]),
  brand: z.string().max(60).optional(),
  model: z.string().max(80).optional(),
  cadr_m3h: z.number().min(20).max(2000).optional(),
  cadr_cfm: z.number().min(10).max(1200).optional(),
  merv: z.string().max(24).optional(),
  filterType: z.string().max(60).optional(),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string().max(300),
});

export type VisionSpecs = z.infer<typeof VisionSpecsSchema>;

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function hasBytes(bytes: Uint8Array, offset: number, sig: number[]): boolean {
  return sig.every((val, idx) => bytes[offset + idx] === val);
}

export function detectImageMime(
  bytes: Uint8Array,
): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length < 12) return null;
  if (hasBytes(bytes, 0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (hasBytes(bytes, 0, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (
    hasBytes(bytes, 0, [0x52, 0x49, 0x46, 0x46]) &&
    hasBytes(bytes, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return "image/webp";
  }
  return null;
}

export function offlineVisionFallback(): VisionSpecs {
  return {
    kind: "purifier",
    cadr_m3h: 350,
    filterType: "HEPA H13",
    confidence: "low",
    notes:
      "Offline template estimate — verify or edit CADR from your purifier label before applying.",
  };
}

export async function analyzePurifierImage(
  bytes: Uint8Array,
  mime: string,
  apiKey?: string,
): Promise<VisionSpecs> {
  const prompt = `${loadPromptFile("system")}\n\n${loadPromptFile("vision")}`;
  const b64 = Buffer.from(bytes).toString("base64");

  return runWithModelFallback(async (client, model) => {
    const interaction = await client.interactions.create({
      model,
      input: [
        { type: "text", text: prompt },
        { type: "image", data: b64, mime_type: mime as "image/jpeg" | "image/png" | "image/webp" },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["purifier", "filter", "room", "other"] },
            brand: { type: "string" },
            model: { type: "string" },
            cadr_m3h: { type: "number" },
            cadr_cfm: { type: "number" },
            merv: { type: "string" },
            filterType: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            notes: { type: "string" },
          },
          required: ["kind", "confidence", "notes"],
        },
      },
      store: false,
    });
    const rawText = extractInteractionText(interaction.outputs);
    return VisionSpecsSchema.parse(JSON.parse(rawText));
  }, apiKey);
}
