# Saans — Design System & UI/UX Contract

Place at `docs/DESIGN.md`. Companion files: `src/styles/tokens.css` (locked tokens) and `docs/reference/reference-prototype.html` (visual north star, open it in a browser).

**Status of this document:** it defines the **minimum optimal state**. Agents MUST reach it, and MAY upgrade beyond it, but never below it and never by replacing it. If you disagree with a rule, write an ADR with before/after screenshots; do not silently change it.

---

## 0. The one-sentence design brief

_A calm, trustworthy, instantly legible health companion: one hero number per person, one obvious next action, and proof one tap away._ On first glance a judge should think "this is a real product", not "this is a hackathon demo".

### Three design principles (use them to settle any argument)

1. **Calm, not alarming.** Smog is scary enough. Use warm paper backgrounds, deep teal, generous space. Colour severity appears only in AQI chips/bars, never as full-screen red. Every alarming state ends with a concrete next step.
2. **One hero, one action.** Each screen has a single focal element (gauge, dose chart, chat) and one primary action. No competing cards of equal weight.
3. **Show the proof.** Every number has "Show the math" within one tap. Every non-live number is labelled (Demo, Simulation, Model estimate, Stale, Calibrated). Trust is the product.

---

## 1. What the reference prototype fixes (do not regress)

Open `reference-prototype.html` (3 screens: Today, Plan, Ask; light/dark; EN/HI). These are the locked decisions:

| Area         | Locked decision                                                                                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout       | Mobile-first 360–430 px; single column; 16 px gutters; cards radius 24 px; 4-pt spacing scale                                                                                       |
| Navigation   | Bottom tab bar, 4 items (Today · Plan · Home Lab · Ask), 64 px + safe-area; Community and Proof in a "More" sheet reached from the top bar                                          |
| Hero         | **Breath Budget gauge**: outer thin ring = typical day (orange, dashed in text legend), inner thick ring = with Saans plan (teal), black tick = 1× WHO guideline, big centre number |
| Colour       | Warm paper `--bg`, white cards, deep teal brand, orange for "typical", green only for "saved" deltas                                                                                |
| AQI          | Six CPCB-style bands; each has fill + ink + edge **and a unique shape** (● ◆ ▲ ■ ⬟ ⯃). Never colour alone                                                                           |
| Charts       | Hand-written SVG; direct labels on lines; typical = dashed orange, plan = solid teal; "View as table" under every chart                                                             |
| Actions      | Numbered cards: title → one-line why → chips (saving, ₹ cost, effort dots) → "Show the math"                                                                                        |
| Waterfall    | Row per action with switch, label, −Δ value and a bar; typical total at top, plan total at bottom; toggling recomputes everything instantly                                         |
| Chat         | User bubble teal; AI bubble white with border; numbers rendered as dotted-underline "slot" chips; "✓ Numbers verified by engine" chip; suggestion chips; composer with mic + send   |
| Trust footer | Data source, fetch time, grid resolution, non-medical disclaimer on every data screen                                                                                               |
| Banners      | Dashed amber banner for Demo/Simulation/Stale/Offline, always above content                                                                                                         |

---

## 2. Research basis (what the rules below come from)

- **WCAG 2.2 AA** (W3C Recommendation): new criteria include Target Size Minimum 24×24 CSS px (2.5.8), Dragging Movements need a non-drag alternative (2.5.7), Focus Not Obscured (2.4.11), Consistent Help (3.2.6), Redundant Entry (3.3.7). We exceed target size with 44/48 px.
- **Platform ergonomics:** Apple HIG 44×44 pt; Material 48×48 dp; bottom navigation for 3–5 destinations; primary actions in the lower thumb zone; large phones have a hard-to-reach top 40%.
- **Colour-vision accessibility for AQI:** U.S. EPA and South Coast AQMD piloted a modified AQI colour scale because adjacent AQI colours are hard to tell apart for people with colour-vision deficiency; accessibility guidance (Smashing Magazine and others) says never rely on colour alone, use labels, icons and shapes. Hence our per-band shapes and numbers.
- **Accessible data visualisation** (public-health and government guidance: Oregon Health Authority, Mass.gov, UK Analysis Function, Chartability): label charts directly, give a summary, provide a data table alternative, keyboard access, ≥3:1 for graphics.
- **Health dashboards** (published survey of 218 respondents, JMIR-style top-15 attributes): clear thresholds, tabulated data alongside charts, comprehensible summaries.
- **Devanagari typography:** India's UX4G government design system recommends Noto Sans, body line-height ≥1.5 (WCAG 1.4.12) and about 1.8 for Hindi; W3C Devanagari layout notes flag baseline and line-height issues. We use 1.75 for `:lang(hi)`.
- **India's CPCB index** is "one number, one colour, one description" with six categories, which we keep, adding shape.

---

## 3. Visual language

### 3.1 Colour (tokens in `tokens.css`; never hard-code)

- **Brand teal** `--brand` (#0E6B63 light / #4FC3B5 dark) for primary buttons, plan series, active nav.
- **Typical orange** `--typical`, **save green** `--save`, **focus blue** `--focus`, **danger** `--danger`, **warn amber** `--warn`.
- **AQI bands:** use `--aqi-{good|sat|mod|poor|vpoor|severe}-{fill|ink|edge}` only.
- Dark mode is a separate tonal system (deep green-black surfaces), not an inversion. Follow `prefers-color-scheme` by default, with a manual override stored in `localStorage`.

### 3.2 Contrast results (computed with the WCAG relative-luminance formula)

Text pairs: body ink on bg 14.7:1, secondary 7.4:1, tertiary 5.0:1, brand on surface 6.4:1, white on brand 6.4:1, danger 6.5:1, warn 5.9:1. Boundaries: component border `--line` ≥3.4:1 on surface and bg. AQI chip ink on fill 7.3–10.7:1 in light, 8.3–9.7:1 in dark; AQI edges ≥3.2:1 on white. **The two weakest light-theme AQI edge colours (Satisfactory, Moderate) measured ~3.1–4.0:1 on white and 2.7–3.7:1 on the cream page background.** Therefore AQI chips always sit on white/surface cards, always have visible text, and never rely on the edge alone. Re-verify with an automated token test (`npm run test:tokens`) that computes contrast for every declared pair and fails under thresholds (4.5:1 text, 3:1 graphics/borders).

### 3.3 Typography

- **System font stack** (no web-font download, fastest and most robust): `system-ui … "Noto Sans", "Noto Sans Devanagari", "Kohinoor Devanagari", "Nirmala UI"`.
- Scale: 12 / 14 / **16 (body minimum)** / 18 / 22 / 28 / 40 / 56. Minimum 16 px for anything interactive or explanatory; 12 px only for captions and eyebrow labels.
- `font-variant-numeric: tabular-nums` everywhere so numbers do not jitter. Hero numbers use `--font-num`.
- Line-height 1.5 body, 1.2 headings, **1.75 for Hindi**. Never truncate Hindi with ellipsis; let it wrap.
- Sentence case. Plain language at roughly Grade-8 reading level; short sentences; units always shown (µg/m³, ×, ₹).
- **Optional upgrade:** self-hosted subsetted _Noto Sans Devanagari_ (≤60 KB, `font-display: swap`) if system Hindi rendering looks weak on target devices. Keep the system stack as fallback.

### 3.4 Spacing, shape, elevation

4-pt grid (4/8/12/16/20/24/32/40/56). Cards 24 px radius, inner items 16/10 px, pills fully rounded. One elevation level for cards (very soft), one for sheets/dialogs. In dark mode, rely on surface tone and borders, not shadows.

### 3.5 Iconography

Inline SVG, 2 px stroke, round caps, 22–24 px, `currentColor`, `aria-hidden` when decorative. No icon fonts, no emoji as UI icons (emoji only for user-chosen family avatars). Logo: teal disc with two breath-wave strokes (see prototype).

### 3.6 Motion

Purposeful and short: 120/200/320 ms, `cubic-bezier(0.2,0,0,1)`. Allowed: gauge arc sweep on load (once), waterfall bar width changes, tab content fade, switch thumb slide. Forbidden: parallax, looping animations, auto-playing anything. `prefers-reduced-motion` collapses all to ~0 ms (already in tokens).

---

## 4. Components (anatomy contract)

Build each once in `src/components/ui/` and reuse. Every component documents its states: default, hover, focus-visible, active, disabled, loading, error.

| Component                     | Rules                                                                                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button**                    | `primary` (teal fill, 48 px), `secondary` (outline, 44 px), `ghost`/link ("Show the math", underlined). Pill radius. Icon + label; icon-only buttons need `aria-label`. Disabled keeps contrast ≥3:1 and explains why |
| **Segmented control** (EN/हिं) | 44 px segments; `aria-pressed`; persists choice                                                                                                                                                                       |
| **Member chip**               | 36 px avatar + name + age; selected = 2 px teal inset ring plus `aria-pressed`                                                                                                                                        |
| **BreathGauge**               | 270° arc, two rings, tick for 1×, centre value (40 px, 800 weight), caption; has `<title>/<desc>` with typical and plan values; animates once                                                                         |
| **AQIChip**                   | Shape icon + "342 · Very Poor"; band tokens; sits on a surface; also exported as a legend item                                                                                                                        |
| **StatTile**                  | Three-up: typical / with plan / saved %. Saved tile uses `--save`                                                                                                                                                     |
| **ActionCard**                | Number badge, title (≤2 lines), why (1–2 lines), chips, link. Max 3 per "do now" group                                                                                                                                |
| **WaterfallRow**              | Switch (52×30 visual, 44 px hit area) + label + value + bar. Off rows dim to 55% and show "off"                                                                                                                       |
| **Chart (SVG)**               | Direct line labels, dashed vs solid distinction, axis labels, `role="img"` with title/desc, **adjacent "View as table" disclosure**, keyboard focus on data points (arrow keys) in the upgraded version               |
| **TrustFooter**               | Source · fetched time · grid size · calibration state · non-medical note                                                                                                                                              |
| **Banner**                    | Dashed amber, icon + bold label ("Demo scenario", "Simulation", "Offline sample", "Stale data", "Calibrated ×1.8 · Undo")                                                                                             |
| **ChatBubble**                | Slot chips (dotted underline) open the math drawer; verified chip only when the guard passed; fallback shows "Offline guidance (AI unavailable)"                                                                      |
| **MathDrawer**                | Bottom sheet: formula, inputs with ranges, source, confidence A/B/C, "copy as text". Focus-trapped, Esc closes, returns focus                                                                                         |
| **BottomTabs**                | 4 items, icon + label always visible, active pill, `aria-current="page"`, safe-area padding, never hides on scroll                                                                                                    |
| **Sheet/Dialog**              | Native `<dialog>` or equivalent; focus trap; Esc; visible close; 24 px top radius                                                                                                                                     |
| **Toast**                     | `role="status"`, 5 s, never the only error signal                                                                                                                                                                     |
| **Skeleton**                  | For loading data cards; respects reduced motion; shows within 100 ms                                                                                                                                                  |
| **EmptyState / ErrorState**   | Plain-language reason + one action ("Try again", "Use demo family")                                                                                                                                                   |

---

## 5. Screen contracts (minimum content and hierarchy)

**Onboarding (≤60 s, skippable):** progress dots; one question per screen; big tap targets; defaults pre-selected; "Try the Sharma family demo" always visible on screen 1; language switch top right; no account wall.

**Today:** banner (if any) → location + time → **Breath Budget card** (member chips → gauge → legend → 3 stat tiles) → **Air now** (AQI chip, "Model estimate" tag, PM2.5, trapped-air risk, one sentence, calibrate button) → **Next 24 hours** (bars, best/worst markers, table) → **Do these 3 things now** → trust footer → tab bar. GRAP note appears only for Delhi-NCR.

**Plan ("Your day, two ways"):** cumulative dose chart (typical dashed vs plan solid, shaded gap) → waterfall with switches → cost chips → calendar button. Toggle recompute must be instant (<100 ms) and announce the new total via `aria-live="polite"`.

**Home Lab:** room selector → controls (sliders always have number steppers and −/+ buttons, satisfying WCAG 2.5.7) → indoor vs outdoor chart with uncertainty band → Smart ventilation card ("Best 20 minutes today: 1:10–1:30 pm" or an honest "No good window today") → DIY CR box builder (BOM in ₹, steps with illustrations as simple SVG, safety panel, CADR range) → Snap & Confirm.

**Ask:** greeting + 3 suggestion chips → chat → composer (mic, send). Streaming text appears incrementally; "Stop" button while streaming; copy and read-aloud per answer; scope notice in the footer.

**Community:** 3-step wizard → go/no-go table (✓ Go / ✕ Avoid / ◐ Limit, text + icon) → Print A4 / Copy WhatsApp text → evidence-tiered actions.

**Proof:** Trust status list → assumptions registry → data caveats → verification report summary (numbers copied from the generated report only) → privacy and "Delete my data".

---

## 6. Content & tone

- Voice: calm neighbour with a doctor's carefulness. "Aarav's air today is about 5× the guideline with your plan, down from 14×." Never "DANGER!!".
- Always pair a problem with an action. Always say what you don't know ("this is a model estimate; your street may differ").
- No medical claims, no disease risk numbers, no guilt.
- Hindi: natural everyday Hindi, not literal translation; keep common English loanwords where people say them (AQI, N95, मेट्रो). Have a native speaker review the 30 most visible strings.
- Microcopy lives in `src/i18n/{en,hi}.json`; no hard-coded strings in components.

---

## 7. Responsive & platform behaviour

- **360 px** is the base; verify 320 px does not break (no horizontal scroll, text wraps).
- **≥768 px:** two-column layout: left rail navigation replaces bottom tabs; Today shows gauge + air side by side; Plan shows chart and waterfall side by side; content max-width 1120 px, centred.
- **≥1200 px:** three-column dashboard allowed for Today. Prototype phone frames are for review only; the real app is not framed.
- Respect `env(safe-area-inset-*)`; use `100dvh`; no fixed element may obscure focused content (`scroll-padding-bottom` is set in tokens).
- Print stylesheet for Community notice (A4, black on white, QR optional) and Plan summary.
- PWA: manifest, theme-color matching `--bg`, maskable icon (SVG-derived PNG ≤ 20 KB), offline shell.

---

## 8. Accessibility checklist (must pass before every merge)

1. Landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, logical heading order, skip link as first focusable element.
2. Everything operable by keyboard; visible 3 px focus ring with 2 px offset; no keyboard traps; dialogs return focus.
3. Names/roles/states: switches use `role="switch"` + `aria-checked`; toggles `aria-pressed`; disclosures `aria-expanded`; current tab `aria-current`.
4. Colour never the only signal (shape + text + number). Contrast: text ≥4.5:1, large text and graphics ≥3:1.
5. Targets ≥44 px (≥48 px primary); spacing so neighbours don't collide.
6. Charts: `role="img"` + title/desc + table alternative + direct labels.
7. AI answers appear in an `aria-live="polite"` region; streaming does not repeatedly re-announce (announce on completion).
8. Zoom 200% and text-spacing overrides (WCAG 1.4.12) do not break layouts; reflow at 320 px.
9. Forms: visible labels, inline errors with `aria-describedby`, no placeholder-as-label, `autocomplete` where applicable, no redundant re-entry (profile reused).
10. Motion: reduced-motion honoured; no flashing.
11. Language: `<html lang>` set; `lang="hi"` on Hindi fragments; Hindi line-height applied.
12. Automated: axe on every route × {en,hi} × {light,dark} → 0 serious/critical. Manual: screen reader pass (TalkBack/VoiceOver or NVDA) on Today, Plan, Ask; keyboard-only pass on Plan toggles.

---

## 9. Performance budget for the UI

Today route ≤180 KB gz JS; LCP <2.5 s on mid-range mobile throttling; CLS <0.05 (reserve space for gauge/chart/skeletons); INP <200 ms; no layout shift when fonts or data arrive; SVG over images; lazy-load Home Lab/Community/Proof routes; Lighthouse mobile Performance ≥90, Accessibility 100, Best Practices ≥95, SEO ≥90 (report actuals honestly).

---

## 10. Visual QA protocol (the anti-regression gate)

The UI agent and the QA agent must follow this every time a screen changes:

1. **Screenshot matrix** with Playwright: {360×800, 390×844, 768×1024, 1280×800} × {light, dark} × {en, hi} for Today, Plan, Home Lab, Ask, Community, Proof, Onboarding, plus states: loading, error, offline, demo, stale.
2. Compare against `docs/reference/` baseline screenshots (`toHaveScreenshot` with a small threshold). Any intentional change → update the baseline in the same commit with a one-line reason in the commit message and `docs/DESIGN-CHANGELOG.md`.
3. **Token test:** fails if any hex colour appears in `src/**/*.{ts,tsx,css}` outside `tokens.css` (allow SVG attribute `currentColor`/`var(--…)`), or if any declared pair fails contrast.
4. **Lint rule:** no inline `style={{color:…}}` with literals; no font-size <12 px; no `outline: none` without a replacement.
5. **Hindi overflow check:** no clipped or horizontally scrolling text in the `hi` matrix.
6. Human check (you): on a real phone, can you read Today in 5 seconds and find the next action without scrolling past more than one card?

---

## 11. "Wow on first glance" checklist (the polish bar)

Judges see the landing screen for ~5 seconds. It must have:

- [ ] A clear product name, logo, and one-line promise: "Your family's daily Breath Budget."
- [ ] The gauge visible without scrolling, animated once, with a real or clearly-labelled demo number.
- [ ] A prominent, friendly **"Try the Sharma family (Delhi smog day)"** button for anyone opening the app on a clean-air day.
- [ ] The language switch (EN/हिं) in the top bar.
- [ ] No spinners longer than 300 ms without a skeleton; no empty white screen; no layout jump.
- [ ] Consistent spacing, one type scale, one icon style, no default browser form styling.
- [ ] A trust line ("Live CAMS data · model estimate · not medical advice").
- [ ] Dark mode that looks designed, not inverted.
- [ ] Favicon, social-share image (1200×630 SVG→PNG ≤100 KB), page titles and meta descriptions per route.
- [ ] 404 and error pages in brand style with a way back.

### Approved upgrades (agents may add these after the baseline passes)

Count-up animation on the gauge number (respect reduced motion); haptic-style micro-feedback on switch toggles; subtle sparkline in each member chip; shareable "Today's Breath Budget" image card (client-side canvas, no data leaves the device); confetti-free "plan complete" state; keyboard shortcuts on desktop (1–4 for tabs); animated line-draw on the Day Replay chart; onboarding illustrations as inline SVG; desktop three-column dashboard.

### Forbidden "upgrades"

Changing the palette or AQI shapes; replacing the gauge with a plain number; heavy UI kits (MUI/Ant) or chart libraries; stock photos or AI-generated images of people/smog; glassmorphism or gradients that reduce contrast; full-bleed red alerts; carousels that hide the main action; auto-playing sound/video; cookie-banner-style popups; infinite scroll.

---

## 12. Handoff to the UI agent (paste with Prompt 5)

1. Copy `tokens.css` to `src/styles/tokens.css`; import once in the root layout; map Tailwind theme colours/spacing to the CSS variables (`theme.extend` using `var(--…)`).
2. Build the component library in §4 first, with a `/design` route (hidden from nav, in the sitemap exclusion) that shows every component in every state, light/dark, en/hi. This route is the visual regression target.
3. Recreate the three prototype screens pixel-faithfully, wiring them to the engine; then build the remaining screens using the same components.
4. Run the §10 screenshot matrix and fix every overflow, contrast and focus issue before reporting done.
5. Report with screenshots as artifacts; list any deliberate deviations from the prototype with reasons.
