import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeReport } from "./report.mjs";

function runStep(name, cmd, args) {
  const t0 = Date.now();
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: process.platform === "win32",
    env: { ...process.env, CI: "1" },
  });
  const durationMs = Date.now() - t0;
  const output = `${res.stdout ?? ""}\n${res.stderr ?? ""}`.trim();
  const passed = res.status === 0;
  const lastLine = output.split(/\r?\n/).filter(Boolean).slice(-2).join(" · ").slice(0, 140);
  return { name, passed, durationMs, summary: lastLine || (passed ? "ok" : "failed"), output };
}

function readCoverageSummary() {
  try {
    const raw = JSON.parse(fs.readFileSync("coverage/coverage-summary.json", "utf8"));
    const total = raw.total;
    return `- **Statements:** ${total.statements.pct}%\n- **Branches:** ${total.branches.pct}%\n- **Functions:** ${total.functions.pct}%\n- **Lines:** ${total.lines.pct}%`;
  } catch {
    return "- Coverage summary not available.";
  }
}

function main() {
  const steps = [
    ["Repo guard", "npm", ["run", "guard"]],
    ["Typecheck", "npm", ["run", "typecheck"]],
    ["ESLint", "npm", ["run", "lint"]],
    ["Prettier", "npm", ["run", "format:check"]],
    ["Vitest + coverage", "npm", ["run", "test:coverage"]],
    ["Offline AI evals", "npm", ["run", "eval:offline"]],
    ["Next.js build", "npm", ["run", "build"]],
  ];

  if (
    fs.existsSync("tests/e2e") &&
    fs.readdirSync("tests/e2e").some((f) => f.endsWith(".spec.ts"))
  ) {
    steps.push(["Playwright E2E", "npm", ["run", "test:e2e"]]);
  }
  if (
    fs.existsSync("tests/a11y") &&
    fs.readdirSync("tests/a11y").some((f) => f.endsWith(".spec.ts"))
  ) {
    steps.push(["Axe A11y", "npm", ["run", "a11y"]]);
  }

  const checks = [];
  for (const [name, cmd, args] of steps) {
    console.log(`\n=== Running: ${name} ===`);
    const result = runStep(name, cmd, args);
    console.log(result.output);
    checks.push(result);
  }

  const allPassed = checks.every((c) => c.passed);
  const metricsBlock = readCoverageSummary();
  writeReport({ timestamp: new Date().toISOString(), allPassed, checks, metricsBlock });
  console.log(`\nVERIFICATION_REPORT.md written. Overall: ${allPassed ? "PASS" : "FAIL"}`);
  if (!allPassed) process.exit(1);
}

main();
