# ADR 004: Add Ahmedabad Winter Simulation Demo Fixture

## Context

Users testing Saans offline or evaluating non-Delhi Indian cities need a first-class Ahmedabad winter air quality simulation alongside the Delhi Sharma family demo.

## Decision

Add `"demo-ahmedabad"` to `AirBundleSchema.source` in `src/engine/schema.ts` and provide `AHMEDABAD_PROFILE` (Patel family, Navrangpura, Ahmedabad) and `AHMEDABAD_DEMO_AIR` in `src/lib/ahmedabad-fixture.ts`, labeled explicitly on screen as a demo scenario.

## Consequences

All API routes (`/api/air`, `/api/plan`, `/api/chat`, `/api/explain`), `computeFullPlan`, and onboarding accept `demo="ahmedabad"` (`/?demo=ahmedabad`) while preserving live Open-Meteo geocoding and forecasts for Ahmedabad.
