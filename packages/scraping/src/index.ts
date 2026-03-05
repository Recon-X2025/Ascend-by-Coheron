/**
 * Firecrawl scraping: job descriptions, company pages, cache, rate limiting, retry.
 */
import Firecrawl from "@mendable/firecrawl-js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_MS = 1500;
const MAX_RETRIES = 3;

const cache = new Map<string, { value: { markdown?: string; metadata?: Record<string, unknown> }; expiresAt: number }>();
let lastScrapeAt = 0;

function domainFromUrl(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.replace(/^www\./, "").toLowerCase();
  }
}

function getCached(domain: string): { markdown?: string; metadata?: Record<string, unknown> } | undefined {
  const entry = cache.get(domain);
  if (!entry || Date.now() > entry.expiresAt) return undefined;
  return entry.value;
}

function setCached(domain: string, data: { markdown?: string; metadata?: Record<string, unknown> }): void {
  cache.set(domain, { value: data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastScrapeAt;
  if (elapsed < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
  lastScrapeAt = Date.now();
}

export function getCachedScrape(urlOrDomain: string): { markdown?: string; metadata?: Record<string, unknown> } | undefined {
  return getCached(domainFromUrl(urlOrDomain));
}

export async function scrape(url: string, apiKey?: string): Promise<{ markdown?: string; metadata?: Record<string, unknown> }> {
  const key = apiKey ?? process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) throw new Error("FIRECRAWL_API_KEY is not set");
  const normalized = url.startsWith("http") ? url : `https://${url}`;
  const domain = domainFromUrl(normalized);

  const cached = getCached(domain);
  if (cached) return cached;

  await rateLimit();
  const client = new Firecrawl({ apiKey: key });
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await client.scrape(normalized, { formats: ["markdown"] });
      const data = result as { markdown?: string; metadata?: Record<string, unknown> };
      const out = { markdown: data?.markdown ?? "", metadata: data?.metadata };
      setCached(domain, out);
      return out;
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
