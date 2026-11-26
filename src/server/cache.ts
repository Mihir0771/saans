interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LruCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly staleStore = new Map<string, T>();

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  getStale(key: string): T | undefined {
    return this.staleStore.get(key);
  }

  set(key: string, value: T): void {
    if (this.store.has(key)) this.store.delete(key);
    else if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    this.staleStore.set(key, value);
    if (this.staleStore.size > this.maxEntries * 2) {
      const oldestStale = this.staleStore.keys().next().value;
      if (oldestStale !== undefined) this.staleStore.delete(oldestStale);
    }
  }

  clear(): void {
    this.store.clear();
    this.staleStore.clear();
  }
}
