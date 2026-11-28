Introducing **Saans (सांस)** — my submission for **Google Virtual Prompt Wars (Challenge 6: Urban Air Quality Assistant)** built with Google Antigravity, Gemini API, and Next.js + TypeScript.

Instead of repeating scary AQI headlines, Saans gives every person in a household their own daily **Breath Budget** (expressed as a multiple of the WHO 24h PM2.5 guideline), models indoor air physics with real uncertainty bands, compares commutes (cost, CO2e, inhaled dose), and includes a School/RWA Community Kit in English & Hindi.

What I focused on most: making GenAI safe for health-adjacent advice using **Engine computes · Gemini narrates · Server verifies**:

- Gemini writes natural English/Hindi prose using strict `{{fact:id}}` placeholders
- A server-side guard substitutes deterministic numbers, blocks unslotted digits, and enforces hard safety boundaries in code (no ozone generators, no room sealing with indoor combustion, no masks under age 2, no medical diagnosis)
- Live Open-Meteo CAMS data paired with honest "Model estimate", "Demo" (Delhi & Ahmedabad), and monitor calibration flags
- Interactive clickable/scrubbable 24h charts, first-time guided tour, and optional BYOK Gemini key in Setup (header-only, never stored on server)

Verified locally end-to-end across pure-TS engine tests, offline AI safety evals, production build, Playwright E2E, and Axe WCAG 2.2 AA across mobile (360px) & desktop (1280px).

Live link: https://saans-jet.vercel.app
Demo video: https://youtu.be/S2iQOJyw_bE?si=a1FvQ34thjpKZUld
LinkedIn post: https://lnkd.in/p/gYJCMhDu
#PromptWars #GeminiAPI #GoogleAntigravity #CleanAir #NextJS #Accessibility
