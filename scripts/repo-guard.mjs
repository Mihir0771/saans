import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const MAX_REPO_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_BYTES = 500 * 1024; // 500 KB

const FORBIDDEN_PATHS = [
  /^\.env($|\.)/i,
  /node_modules\//,
  /^\.next\//,
  /^1_RESEARCH_AND_STRATEGY\.md$/,
  /^2_ANTIGRAVITY_PLAYBOOK\.md$/,
];

const ALLOWED_ENV = ".env.example";

const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z\-_]{35}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /ghp_[0-9A-Za-z]{36}/,
  /sk-[A-Za-z0-9]{32,}/,
];

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function listTrackedFiles() {
  try {
    const out = run("git ls-files");
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getAllWorkingFiles(dir, prefix = "") {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      [
        ".git",
        "node_modules",
        ".next",
        "coverage",
        "e2e-artifacts",
        "playwright-report",
        "test-results",
      ].includes(entry.name)
    ) {
      continue;
    }
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllWorkingFiles(full, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

function checkBranches() {
  try {
    const branches = run("git branch --format=%(refname:short)").split(/\r?\n/).filter(Boolean);
    if (branches.length > 1 || (branches.length === 1 && branches[0] !== "main")) {
      return [`Expected single branch 'main', found: ${branches.join(", ")}`];
    }
    return [];
  } catch {
    return ["Not a valid git repository"];
  }
}

function getRepoSizeBytes(trackedFiles) {
  let total = 0;
  for (const rel of trackedFiles) {
    if (fs.existsSync(rel)) {
      total += fs.statSync(rel).size;
    }
  }
  const gitDir = ".git";
  if (fs.existsSync(gitDir)) {
    const walkGit = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkGit(full);
        else total += fs.statSync(full).size;
      }
    };
    walkGit(gitDir);
  }
  return total;
}

function scanSecrets(files) {
  const hits = [];
  for (const rel of files) {
    if (!fs.existsSync(rel) || rel === "scripts/repo-guard.mjs") continue;
    const ext = path.extname(rel).toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".webp", ".ico", ".woff2"].includes(ext)) continue;
    const content = fs.readFileSync(rel, "utf8");
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        hits.push(`Potential secret pattern (${pattern.source}) in ${rel}`);
      }
    }
  }
  return hits;
}

function main() {
  const errors = [];
  errors.push(...checkBranches());

  const tracked = listTrackedFiles();
  const working = getAllWorkingFiles(".");
  const filesToCheck = tracked.length > 0 ? tracked : working;

  for (const rel of tracked) {
    if (rel === ALLOWED_ENV) continue;
    for (const rx of FORBIDDEN_PATHS) {
      if (rx.test(rel)) errors.push(`Forbidden tracked path: ${rel}`);
    }
  }

  for (const rel of filesToCheck) {
    if (!fs.existsSync(rel)) continue;
    const size = fs.statSync(rel).size;
    if (size > MAX_FILE_BYTES) {
      errors.push(`File exceeds 500 KB (${(size / 1024).toFixed(1)} KB): ${rel}`);
    }
  }

  const repoBytes = getRepoSizeBytes(filesToCheck);
  if (repoBytes > MAX_REPO_BYTES) {
    errors.push(`Repo size ${(repoBytes / (1024 * 1024)).toFixed(2)} MB exceeds 10 MB limit`);
  }

  errors.push(...scanSecrets(filesToCheck));

  const summary = {
    ok: errors.length === 0,
    filesChecked: filesToCheck.length,
    repoSizeMB: Number((repoBytes / (1024 * 1024)).toFixed(3)),
    errors,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (errors.length > 0) process.exit(1);
}

main();
