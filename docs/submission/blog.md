# Building Saans (सांस): How to Make GenAI Air Quality Advice Honest, Mathematical, and Accessible

_Google Virtual Prompt Wars — Challenge 6 Submission_

---

## Why "AQI 323" Doesn't Help a Family Decide What to Do at 7 AM

Every winter across northern India, households wake up to a single headline AQI number. That number does not tell a grandmother with heart disease how her indoor dose compares to a 7-year-old child riding in an open auto-rickshaw to school. And it never quantifies whether sealing door gaps, skipping peak frying, or running a ₹2,000 DIY Corsi-Rosenthal filter box actually moves the needle.

For **Saans (सांस)**, I inverted the typical wrapper design: instead of asking an LLM to guess pollution advice, we treat every day's pollution exposure like a **Breath Budget** computed in pure TypeScript — and restrict Gemini strictly to grounded, multi-lingual explanation.

## Architecture: Engine Computes · Gemini Narrates · Server Verifies

1. **Pure TypeScript Physics & Exposure Engine (`src/engine/`):**
   - Computes India's official **CPCB AQI** breakpoints directly from PM2.5 and PM10 (because global feeds default to US/EU indices).
   - Solves a 24-hour well-mixed indoor mass-balance trajectory (`simulateIndoor24h`) with low, central, and high uncertainty bands around published residential infiltration, deposition, cooking, incense, and CADR filter parameters (`docs/ASSUMPTIONS.md`).
   - Integrates member-specific breathing rates (from toddlers to elders 65+), hourly microenvironment schedules, commute modes (`wfh`, `metro`, `bus`, `car`, `auto`, `two_wheeler`, `walk`), and marginal waterfall attribution so toggling any action recomputes exact savings.
   - Enforces hard safety rules in code (`src/engine/actions/rules.ts`): never recommends ozone purifiers, never advises sealing rooms when solid fuel / _angeethi_ / unvented combustion is present, never suggests masks under age 2, and never issues medical diagnoses.

2. **Anti-Hallucination Number Guard (`src/server/guard.ts`):**
   - Gemini receives a structured `FactSheet` of engine-computed IDs and writes prose using placeholders like `{{fact:dose_saved_pct}}`.
   - The server substitutes real numbers, rejects any unslotted digit or safety rule violation, retries once if needed, and falls back deterministically to curated EN/HI guidance if offline or out of quota.
   - Gemini Vision (`Snap & Confirm`) reads purifier/filter label photos in memory without storing images and lets the user confirm or edit the extracted CADR before applying it to Home Lab.

3. **Accessible First (`WCAG 2.2 AA`):**
   - Tokenized warm-paper light and pine-charcoal dark themes (`src/styles/tokens.css`).
   - Colour is never the only signal: CPCB chips pair shape (`● ◆ ▲ ■ ⬟ ⯃`), colour, and text; dose charts pair dashed vs solid lines with inline HTML `<table role="table">` views (`View as table`).
   - Full English & Hindi (Devanagari, `line-height: 1.75`) navigation across `360px` mobile and `1280px` desktop.

## Verification Highlights

From `VERIFICATION_REPORT.md` (`npm run verify` — **PASS**):

- **Unit, property & contract suite:** `159/159` tests passing across `18` files (`99.88%` statements, `90.62%` branches, `100%` functions)
- **Offline AI safety evals:** `41/41` passing (covering prompt injection, unslotted digit rejection, banned ozone/combustion/child-mask blocks, and EN/HI fallbacks)
- **Playwright E2E:** `2/2` passing across `mobile-360` (`360x800`) and `desktop-1280` (`1280x800`), `0` console errors, `0` horizontal overflow
- **Axe WCAG 2.2 AA:** `2/2` passing across `mobile-360` and `desktop-1280` on Welcome Tour, Today, Plan, Home Lab, Ask, Community, Proof, and `/design` (`0` serious/critical violations)
- **Interactive & Multi-City:** Clickable/scrubbable 24-hour charts on Today, Plan, and Home Lab; 1-click Delhi (Sharma) & Ahmedabad (Patel) winter simulations alongside live Open-Meteo geocoding; First-Time Welcome Tour with `"Do not show this again"`; and optional BYOK Gemini key in Setup (header-only `x-gemini-api-key`, never logged or stored on server).
- **Live deployment:** `https://saans-jet.vercel.app` (verified via `npm run smoke`)
