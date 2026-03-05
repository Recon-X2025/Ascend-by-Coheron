/**
 * Anthropic AI service: structured prompts, strict JSON, retries, cost logging.
 * All AI calls must go through this service.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface Logger {
  info?(message: string, meta?: Record<string, unknown>): void;
  warn?(message: string, meta?: Record<string, unknown>): void;
}

let client: Anthropic | null = null;
let logger: Logger = { info: () => {}, warn: () => {} };

export function setLogger(l: Logger): void {
  logger = l;
}

function getClient(apiKey: string): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey, maxRetries: 0, timeout: 120_000 });
  }
  return client;
}

export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
  apiKey?: string;
}

export async function completeWithJson<T>(
  userPrompt: string,
  schema: z.ZodType<T>,
  options?: CompletionOptions
): Promise<T> {
  const apiKey = options?.apiKey ?? process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const model = options?.model ?? DEFAULT_MODEL;
  const maxTokens = options?.maxTokens ?? 4096;
  const system =
    (options?.systemPrompt ?? "").trim().length > 0
      ? (options!.systemPrompt as string)
      : "You respond only with valid JSON. No markdown, no explanation. Ensure the output can be parsed by JSON.parse().";

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await getClient(apiKey).messages.create({
        model,
        max_tokens: maxTokens,
        system: system as string,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = response.content?.[0]?.type === "text" ? response.content[0].text : "";
      if (response.usage?.input_tokens != null || response.usage?.output_tokens != null) {
        logger.info?.("AI usage", {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          model,
        });
      }

      const stripped = stripMarkdownJson(text);
      const parsed = JSON.parse(stripped) as unknown;
      const result = schema.safeParse(parsed);
      if (result.success) return result.data;
      lastError = result.error;
      logger.warn?.("AI JSON validation failed", { attempt, errors: result.error.flatten() });
    } catch (e) {
      lastError = e;
      logger.warn?.("AI request failed", { attempt, error: String(e) });
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function stripMarkdownJson(text: string): string {
  let s = text.trim();
  const open = s.match(/^```(?:json)?\s*\n?/i);
  if (open) {
    s = s.slice(open[0].length);
    const closeIdx = s.indexOf("```");
    if (closeIdx !== -1) s = s.slice(0, closeIdx).trim();
  }
  return s.trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const prompts = {
  parseJobDescription: (raw: string) =>
    `Extract job description structure from the following text. Return a single JSON object with: title (string), company (string optional), location (string optional), salary (string optional), description (string), requirements (array of strings optional), responsibilities (array of strings optional), skills (array of strings optional).\n\nText:\n${raw}`,
  enrichCompany: (domain: string, pageContent: string) =>
    `From this company page content (domain: ${domain}), extract: name, description, industry, size, website (URL), linkedin (URL). Return a single JSON object with only these keys; use null for missing.\n\nContent:\n${pageContent.slice(0, 15000)}`,
  parseResume: (text: string) =>
    `Extract structured data from this resume. Return JSON: skills (string[]), experience (array of { title, company, duration?, description? }), education (array of { degree, institution, year? }), summary (string optional).\n\nResume:\n${text}`,
  careerAnalysis: (profileContext: string) =>
    `Based on this profile context, suggest career recommendations and skill gaps. Return JSON: recommendations (string[]), skillGaps (array of { skill, importance?, suggestion? }).\n\nProfile:\n${profileContext}`,
};
