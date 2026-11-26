const baseUrl = process.argv[2];
if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
  console.error("Usage: npm run smoke -- <BASE_URL>");
  process.exit(1);
}

const cleanBase = baseUrl.replace(/\/$/, "");

async function check(label, path, init) {
  const res = await fetch(`${cleanBase}${path}`, init);
  if (!res.ok) {
    throw new Error(`${label} failed with HTTP ${res.status}`);
  }
  const data = await res.json();
  console.log(`PASS ${label}: HTTP ${res.status}`);
  return data;
}

async function main() {
  await check("health", "/api/health");
  await check("air-delhi", "/api/air?lat=28.59&lon=77.05");
  await check("air-mumbai", "/api/air?lat=19.08&lon=72.88");
  await check("air-bengaluru", "/api/air?lat=12.97&lon=77.59");
  await check("plan-demo", "/api/plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ demo: "sharma" }),
  });
  await check("chat-roundtrip", "/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: "Can Aarav play outside at 2 pm?",
      demo: "sharma",
      locale: "en",
    }),
  });
  console.log("All smoke checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
