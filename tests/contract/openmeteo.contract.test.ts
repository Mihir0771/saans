import { describe, expect, it } from "vitest";
import delhiFixture from "../fixtures/openmeteo-delhi.json";
import { OpenMeteoAqSchema, mapOpenMeteoToHours } from "@/server/openmeteo";

describe("Open-Meteo contract tests", () => {
  it("validates recorded Open-Meteo response against Zod schema", () => {
    const parsed = OpenMeteoAqSchema.parse(delhiFixture);
    expect(parsed.hourly.time).toHaveLength(24);
    const hours = mapOpenMeteoToHours(parsed, undefined);
    expect(hours).toHaveLength(24);
    expect(hours[7]?.pm25).toBe(174);
  });

  it("picks today's 24h window (indices 24..47) when 72h past+forecast series is returned", () => {
    const parsed = OpenMeteoAqSchema.parse(delhiFixture);
    const times72 = [
      ...parsed.hourly.time.map((t) => t.replace("2026-11-24", "2026-11-23")),
      ...parsed.hourly.time,
      ...parsed.hourly.time.map((t) => t.replace("2026-11-24", "2026-11-25")),
    ];
    const pm25_72 = [
      ...Array.from({ length: 24 }, () => 999),
      ...parsed.hourly.pm2_5,
      ...Array.from({ length: 24 }, () => 111),
    ];
    const pm10_72 = [
      ...Array.from({ length: 24 }, () => 999),
      ...parsed.hourly.pm10,
      ...Array.from({ length: 24 }, () => 111),
    ];
    const hours = mapOpenMeteoToHours({
      ...parsed,
      hourly: { ...parsed.hourly, time: times72, pm2_5: pm25_72, pm10: pm10_72 },
    });
    expect(hours).toHaveLength(24);
    expect(hours[0]?.isoTime).toContain("2026-11-24");
    expect(hours[7]?.pm25).toBe(174);
  });
});
