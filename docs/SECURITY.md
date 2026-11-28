# Security & Privacy Architecture — Saans

Saans is built for urban health literacy with strict boundaries between user data, deterministic math, external feeds, and generative AI.

## 1. Threat Model & Trust Boundaries

| Boundary                                           | Control                                                                                                                                                                                                                                          | Implementation                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Browser ↔ Client Storage                           | No user accounts, no tracking cookies, no third-party analytics. Profile stored solely in `localStorage` under explicit key with one-tap deletion (`Delete my data`).                                                                            | `src/lib/storage.ts`, `src/lib/use-saans.ts`                                        |
| Browser ↔ `/api/air`                               | Coarse coordinates (`2` decimal places, ~1 km cell) + bounded numeric calibration/simulation params checked with Zod.                                                                                                                            | `src/app/api/air/route.ts`, `src/server/openmeteo.ts`                               |
| Browser ↔ `/api/plan`, `/api/explain`, `/api/chat` | Strict Zod schemas reject malformed profiles, negative durations, oversized strings (`message <= 500` chars), or out-of-range coordinates.                                                                                                       | `src/engine/schema.ts`, `src/app/api/chat/route.ts`, `src/app/api/explain/route.ts` |
| Browser ↔ `/api/vision`                            | Multipart file upload validated via magic bytes (`image/jpeg`, `image/png`, `image/webp`) and byte limit (`<= 4 MB`); processed in memory and discarded immediately without disk or DB persistence.                                              | `src/server/vision.ts`, `src/app/api/vision/route.ts`                               |
| Server ↔ Gemini (`@google/genai`)                  | `GEMINI_API_KEY` read strictly from server environment (`process.env.GEMINI_API_KEY`), with optional user BYOK key stored only in browser `localStorage` and forwarded per-request via `x-gemini-api-key` without server persistence or logging. | `src/server/gemini.ts`, `src/server/guard.ts`, `src/lib/storage.ts`                 |
| Abuse / Cost Protection                            | Per-IP sliding-window rate limiter on API routes.                                                                                                                                                                                                | `src/server/ratelimit.ts`                                                           |

## 2. HTTP Security Headers (`next.config.ts`)

Every route serves hardened response headers configured in `next.config.ts`:

- `Content-Security-Policy`: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options`: `nosniff`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Permissions-Policy`: `geolocation=(self), microphone=(self), camera=()`
- `X-Frame-Options`: `DENY`
- `poweredByHeader: false`

## 3. GenAI Safety & Anti-Hallucination Controls (`guard.ts`)

1. **Zero invented numbers:** Gemini prompts instruct the model to reference facts exclusively via `{{fact:id}}` placeholders from the computed `FactSheet`.
2. **Server slot substitution & digit scan:** `guard.ts` resolves every valid placeholder with engine values, rejects unknown slot IDs, and rejects any unslotted digits (ignoring harmless markdown numbering/dates only where permitted by the guard contract).
3. **Hard §6.5 safety blocks:** Regex + keyword guards reject responses recommending ozone generators, sealing rooms during indoor combustion (`angeethi`, `chulha`, kerosene, coal), masks/N95 respirators for children `< 2` years, or clinical diagnosis claims.
4. **Retry-once + deterministic fallback:** On a first guard violation, the server retries once with an explicit correction instruction; on a second failure or API outage, `src/server/fallbacks.ts` returns verified EN/HI templates directly from the engine.
5. **Offline & red-team evals:** Verified across `41` offline test cases (`tests/ai-evals/offline.eval.test.ts`), including prompt-injection and banned-advice probes.

## 4. Secrets & Repository Hygiene

- `.gitignore` excludes `.env*` (keeping only `.env.example`), `.next/`, `node_modules/`, and private scratch files.
- `npm run guard` (`scripts/repo-guard.mjs`) checks branch name (`main`), repository byte budget (`< 10 MB`), max single file size (`< 500 KB`), and regex secret patterns before every commit/push.
