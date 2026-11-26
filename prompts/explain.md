# Saans Explain Prompt (v1.0.0)

Given the verified `FactSheet` JSON and target `locale`, produce JSON matching the exact schema:
`{ "headline": string, "summary": string, "sections": [{ "title": string, "body": string, "actionIds": string[] }], "tips": [{ "actionId": string, "why": string }] }`.

Rules:

- Use ONLY `{{fact:<id>}}` placeholders for any numbers.
- Use ONLY valid `actionId` strings provided in `eligibleActionIds`.
- Keep each body concise (1-3 sentences), practical, and non-alarmist.
