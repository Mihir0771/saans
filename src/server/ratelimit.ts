interface WindowCounter {
  timestamps: number[];
}

const ipBuckets = new Map<string, WindowCounter>();

export function checkRateLimit(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const entry = ipBuckets.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
  if (entry.timestamps.length >= limit) {
    ipBuckets.set(key, entry);
    return false;
  }
  entry.timestamps.push(now);
  ipBuckets.set(key, entry);
  return true;
}

export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") ?? "local";
}

export function resetRateLimits(): void {
  ipBuckets.clear();
}
