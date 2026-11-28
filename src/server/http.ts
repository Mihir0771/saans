import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { checkRateLimit, clientIpFromHeaders } from "./ratelimit";

/**
 * Standard no-store headers for dynamic, user-scoped, or AI-generated API responses.
 */
export const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

/**
 * Returns a typed JSON error response with consistent shape and `Cache-Control: no-store`.
 */
export function apiError(message: string, status: number, extraHeaders?: Record<string, string>) {
  return NextResponse.json(
    { error: message },
    { status, headers: { ...NO_STORE_HEADERS, ...extraHeaders } },
  );
}

/**
 * Returns a JSON response explicitly marked non-cacheable for private or mutable API results.
 */
export function jsonNoStore<T>(payload: T, status = 200) {
  return NextResponse.json(payload, { status, headers: NO_STORE_HEADERS });
}

/**
 * Enforces a per-IP sliding-window limit on an API route and returns a 429 response if exceeded.
 */
export function enforceRouteRateLimit(
  req: NextRequest,
  routePrefix: string,
  limitPerMin: number,
): NextResponse | null {
  const ip = clientIpFromHeaders(req.headers);
  if (checkRateLimit(`${routePrefix}:${ip}`, limitPerMin)) return null;
  return apiError("Rate limit exceeded", 429, { "Retry-After": "60" });
}

/**
 * Parses a JSON request body and validates it against the supplied Zod schema.
 */
export async function parseJsonRequest<S extends z.ZodTypeAny>(
  req: NextRequest,
  schema: S,
  invalidMessage: string,
): Promise<{ ok: true; data: z.output<S> } | { ok: false; response: NextResponse }> {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, response: apiError(invalidMessage, 400) };
  }
  return { ok: true, data: parsed.data as z.output<S> };
}
