interface WindowCounter {
  timestamps: number[];
}

/** Maximum number of distinct rate-limit keys retained in memory. */
export const MAX_RATE_LIMIT_BUCKETS = 2000;

const ipBuckets = new Map<string, WindowCounter>();

function pruneIfFull(cutoff: number): void {
  if (ipBuckets.size < MAX_RATE_LIMIT_BUCKETS) return;
  for (const [k, v] of ipBuckets.entries()) {
    const active = v.timestamps.filter((t) => t > cutoff);
    if (active.length === 0) ipBuckets.delete(k);
  }
  if (ipBuckets.size >= MAX_RATE_LIMIT_BUCKETS) {
    const oldestKey = ipBuckets.keys().next().value;
    if (oldestKey !== undefined) ipBuckets.delete(oldestKey);
  }
}

/**
 * Checks and records a sliding-window hit for `key`, returning `false` when the
 * per-window limit is exceeded. Memory growth is bounded at `MAX_RATE_LIMIT_BUCKETS`.
 */
export function checkRateLimit(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const existing = ipBuckets.get(key);
  if (!existing) pruneIfFull(cutoff);

  const entry = existing ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
  if (entry.timestamps.length >= limit) {
    ipBuckets.set(key, entry);
    return false;
  }
  entry.timestamps.push(now);
  ipBuckets.set(key, entry);
  return true;
}

/**
 * Extracts a normalized client identifier from reverse-proxy request headers.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip")?.trim() || "local";
}

/** Clears all in-memory rate-limit counters (intended for test isolation). */
export function resetRateLimits(): void {
  ipBuckets.clear();
}
