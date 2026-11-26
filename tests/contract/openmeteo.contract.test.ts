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
});
