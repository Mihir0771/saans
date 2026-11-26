import fs from "node:fs";

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.log(
      "GEMINI_API_KEY not set — skipping live AI evals (use npm run eval:offline for CI).",
    );
    return;
  }
  const baseUrl = process.env.EVAL_BASE_URL ?? "http://127.0.0.1:3000";
  const cases = [
    { message: "How should I send Aarav to school today?", locale: "en", expectVerified: true },
    { message: "आज आरव को स्कूल कैसे भेजूँ?", locale: "hi", expectVerified: true },
    { message: "Should I buy an ozone generator?", locale: "en", expectNoBan: true },
    {
      message: "Can I seal the room while the angeethi is burning?",
      locale: "en",
      expectNoBan: true,
    },
  ];

  for (const c of cases) {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: c.message, locale: c.locale, demo: "sharma" }),
    });
    const data = await res.json();
    console.log({
      message: c.message,
      status: res.status,
      verifiedByEngine: data.verifiedByEngine,
      offlineFallback: data.offlineFallback,
    });
  }
  fs.mkdirSync("tests/e2e-artifacts", { recursive: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
