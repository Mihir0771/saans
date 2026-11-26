# Build Journal & Prompt Engineering Record — Saans

## 1. Agent-First Architecture & Workflow

Saans was built cleanly across specialized vertical slices wired together through shared Zod contracts (`src/engine/schema.ts`):

1. **Specification & Design Tokens:** Anchored on `docs/SPEC.md`, `docs/DESIGN.md`, `src/styles/tokens.css`, and three Architecture Decision Records (`docs/ADR/001-cpcb-aqi-units.md`, `002-shapley-attribution.md`, `003-isomorphic-pure-engine.md`).
2. **Pure TypeScript Physics & Exposure Engine (`src/engine/`):** Deterministic, zero-I/O simulation covering India CPCB AQI breakpoints, 24-hour indoor mass-balance trajectories (with low/central/high uncertainty bands), age- and activity-weighted breathing rates, commute exposure/CO2e/INR comparison, symmetric marginal attribution waterfall, smart ventilation windows, Delhi-NCR GRAP stages, and §6.5 hard safety blocks.
3. **Live Air & Caching APIs (`src/server/`, `src/app/api/`):** Open-Meteo CAMS air quality + weather + geocoding adapter with in-memory TTL cache, stale fallback, coarse 2-decimal coordinate privacy, and monitor calibration / smog-simulation query parameters.
4. **Grounded Gemini Integration (`prompts/`, `src/server/guard.ts`, `src/server/ai-service.ts`):** Implements **Engine computes · Gemini narrates · Server verifies**.

## 2. Production Prompts

| Prompt file          | Role                                   | Grounding & safety rules                                                                                                                                                                                   |
| -------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompts/system.md`  | Shared system instruction for Saans AI | Enforces `{{fact:id}}` slot-only numbers, §6.5 safety blocks (no ozone generators, no room sealing with indoor combustion, no masks < 2 yr, no medical diagnosis), and data-vs-instruction separation.     |
| `prompts/explain.md` | Plain-language Today / Plan narration  | Explains the top 3 household actions and Breath Budget delta in EN or HI using only provided FactSheet slot keys.                                                                                          |
| `prompts/chat.md`    | Multi-turn conversational advisor      | Guides `@google/genai` function calling (`simulate_action`, `compare_commutes`, `indoor_window`, `explain_grap`) and keeps advice concise and actionable.                                                  |
| `prompts/vision.md`  | Purifier / filter label reader         | Extracts structured JSON (`brand`, `model`, `cadr_m3h`, `cadr_cfm`, `hepa_grade`, `ozone_free_claim`, `notes`) from user-uploaded label photos for explicit user confirmation before applying to Home Lab. |

## 3. Visual & Verification Artifacts

- `docs/build-journal/e2e-today-mobile.png`: Playwright mobile (`360x800`, light EN) verification capture showing CPCB badge, 24h strip with chart/table toggle, and action cards.
- `docs/build-journal/e2e-ask-hi-dark.png`: Playwright desktop (`1280x800`, dark HI) verification capture showing Devanagari navigation, verified/offline response badges, and suggested prompts.
- `VERIFICATION_REPORT.md`: Reproducible output of `npm run verify`.
