/**
 * Firecrawl scraping service: caching, domain deduplication, rate limiting.
 */
import Firecrawl from "@mendable/firecrawl-js";
import { get, set, buildKey } from "@/server/utils/cache";
import { logger } from "@/server/utils/logger";

const CACHE_PREFIX = "firecrawl";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h for company pages
const RATE_LIMIT_MS = 1500; // min delay between scrapes
let lastScrapeAt = 0;

function getClient(): Firecrawl {
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) throw new Error("FIRECRAWL_API_KEY is not set");
  return new Firecrawl({ apiKey: key });
}

function domainFromUrl(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.replace(/^www\./, "").toLowerCase();
  }
}

/** Get cached scrape result by URL or domain. */
export function getCached(urlOrDomain: string): { markdown?: string; metadata?: Record<string, unknown> } | undefined {
  const domain = domainFromUrl(urlOrDomain);
  const key = buildKey(CACHE_PREFIX, domain);
  return get<{ markdown?: string; metadata?: Record<string, unknown> }>(key);
}

/** Cache scrape result by domain to avoid re-scraping same company. */
export function setCached(urlOrDomain: string, data: { markdown?: string; metadata?: Record<string, unknown> }): void {
  const domain = domainFromUrl(urlOrDomain);
  const key = buildKey(CACHE_PREFIX, domain);
  set(key, data, { ttlMs: CACHE_TTL_MS });
}

/** Rate limit: wait if we scraped recently. */
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastScrapeAt;
  if (elapsed < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
  lastScrapeAt = Date.now();
}

/**
 * Scrape URL or domain. Returns cached result if available; otherwise calls Firecrawl and caches by domain.
 */
export async function scrape(url: string): Promise<{ markdown?: string; metadata?: Record<string, unknown> }> {
  const normalized = url.startsWith("http") ? url : `https://${url}`;
  const domain = domainFromUrl(normalized);

  const cached = getCached(domain);
  if (cached) {
    logger.debug("Firecrawl cache hit", { domain });
    return cached;
  }

  await rateLimit();
  const client = getClient();
  const result = await client.scrape(normalized, { formats: ["markdown"] });
  const data = result as { markdown?: string; metadata?: Record<string, unknown> };
  const out = { markdown: data?.markdown ?? "", metadata: data?.metadata };
  setCached(domain, out);
  return out;
}
