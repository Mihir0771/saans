# Accessibility Audit & Compliance — Saans

Saans targets **WCAG 2.2 AA** across both desktop (`1280x800`) and mobile (`360x800`), in **English** and **Hindi (Devanagari)**, and in **light** and **dark** colour schemes.

## 1. Design System & Perceivability (`src/styles/tokens.css`)

- **Tokenized colours only:** Components reference semantic CSS variables in `src/styles/tokens.css` rather than raw hex literals, enforced by `tests/unit/tokens.test.ts`.
- **Tested contrast ratios:**
  - Light mode (`#ffffff` / `#f6f3ec` surfaces with `#14231f` ink and `#0a4a44` `--brand-ink` on `#d6ebe7` `--brand-soft`).
  - Dark mode (`#0b1513` / `#12221f` surfaces with `#eaf2ef` ink and `#8fe0d4` `--brand-ink` on `#173a36` `--brand-soft`).
  - Component borders (`--line`) and interactive pill badges avoid dimming readable text with low opacity so disabled/off waterfall rows stay readable via `--ink-2` contrast.
- **Colour is never the only signal:**
  - Six CPCB AQI categories carry distinct geometric shapes (`●`, `◆`, `▲`, `■`, `⬟`, `⯃`) alongside localized text labels and numeric indices (`src/components/ui/AQIChip.tsx`).
  - "Your day, two ways" charts encode Typical Day with dashed amber lines and Saans Plan with solid teal lines, paired with inline legends and HTML `<table role="table">` toggle alternatives (`View as table`).
- **Devanagari typography:** `:lang(hi)` sets `line-height: var(--lh-deva)` (`1.75`) so vowel marks (_matras_) never collide vertically.

## 2. Operability, Navigation & Modals

- **44 px+ tap targets:** Interactive controls satisfy `min-height: var(--tap)` (`44px`), with primary CTAs at `48px` (`--tap-primary`).
- **Semantic landmarks & skip link:** Root layout provides a keyboard-accessible skip link to `#main-content` with `scroll-padding-bottom` clearance above the mobile bottom navigation bar.
- **Zero horizontal overflow at 360 px:** Responsive CSS grids use `min-w-0` so scrollable chips (`MemberSwitcher`) stay bounded within `visualViewport.width` on mobile.
- **Native modal dialog (`src/components/ui/MathDrawer.tsx`):** Uses semantic `<dialog closedby="any">` opened via `.showModal()`, restoring focus on close, supporting Escape key dismissal, and providing a pointer-bounds light-dismiss fallback for browsers without native `closedBy`.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` collapses animations and transitions to `0.01ms`.

## 3. Automated Accessibility Verification

`npm run a11y` executes `@axe-core/playwright` with tags `["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]` across both `mobile-360` and `desktop-1280` viewports on:

- `Today` (English Light + Hindi Dark)
- `Plan`, `Home Lab`, `Ask Saans`, `Community Kit`, and `Proof` (Hindi Dark)
- `/design` token showcase

Zero `serious` or `critical` violations remain (recorded in `VERIFICATION_REPORT.md`).
