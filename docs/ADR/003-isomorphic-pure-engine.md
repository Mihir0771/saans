# ADR 003 — Isomorphic Pure Engine Execution

**Status:** Accepted  
**Context:** `SPEC.md §7` computes plans and `FactSheet`s server-side via `/api/plan` and `/api/chat` tools, while `DESIGN.md §5` requires Plan waterfall toggles and Home Lab sliders to recompute instantaneously (`< 100 ms`) on the client.  
**Decision:** Keep `src/engine/` 100% pure TypeScript with zero Node/browser I/O so both server route handlers and client UI components execute the exact same deterministic physics, exposure, and Shapley functions. Client toggles update in `< 10 ms` without duplicating math; AI narration always fetches from the server `FactSheet` and `guard.ts`.
