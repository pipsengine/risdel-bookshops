type CacheEntry<T> = { value: T; expiresAt: number };

export class SheetsCache {
  private store = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly defaultTtlSeconds: number) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.defaultTtlSeconds) * 1000;
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  invalidate(prefixOrKey: string): void {
    for (const key of this.store.keys()) {
      if (key === prefixOrKey || key.startsWith(prefixOrKey)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}
