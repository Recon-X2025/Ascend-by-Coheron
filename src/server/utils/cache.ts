/**
 * In-memory cache with optional TTL. Can be extended to use Redis for multi-instance scaling.
 */
const store = new Map<string, { value: unknown; expiresAt: number }>();

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface CacheOptions {
  ttlMs?: number;
}

export function get<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function set<T>(key: string, value: T, options?: CacheOptions): void {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function del(key: string): void {
  store.delete(key);
}

export function buildKey(prefix: string, ...parts: string[]): string {
  return [prefix, ...parts].filter(Boolean).join(":");
}
