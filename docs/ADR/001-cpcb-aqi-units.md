# ADR 001 — CPCB NAQI Averaging & Unit Conversions

**Status:** Accepted  
**Context:** Open-Meteo Air Quality returns hourly `pm2_5`, `pm10`, `nitrogen_dioxide`, `ozone` in µg/m³ and `carbon_monoxide` in **µg/m³**. India's CPCB National Air Quality Index (NAQI) defines 24-h breakpoints for PM2.5, PM10, and NO₂ (µg/m³), and 8-h breakpoints for O₃ (µg/m³) and **CO (mg/m³)**. Official CPCB AQI requires at least 3 pollutants including PM2.5 or PM10.  
**Decision:** Convert CO from µg/m³ to mg/m³ (`value / 1000`) before applying CPCB breakpoints. Expose both `computeAqi24h()` (24-h rolling mean for PM2.5/PM10/NO₂ and 8-h rolling mean for O₃/CO) and `computeAqiNowEquivalent()` (clearly labelled _"instant AQI-equivalent"_ when fewer than 24 hours or fewer than 3 pollutants are present).
