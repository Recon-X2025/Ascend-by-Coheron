/**
 * Environment validation at startup. Server fails fast if required vars are missing.
 */
import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    NEXTAUTH_SECRET: z.string().optional(),
    AUTH_SECRET: z.string().optional(),
    NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    FIRECRAWL_API_KEY: z.string().optional(),
    REDIS_URL: z.string().optional(),
    CORS_ORIGIN: z.string().optional(),
    PORT: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    STORAGE_PATH: z.string().optional(),
  })
  .refine((d) => (d.NEXTAUTH_SECRET ?? d.AUTH_SECRET ?? "").length > 0, {
    message: "NEXTAUTH_SECRET or AUTH_SECRET is required",
    path: ["NEXTAUTH_SECRET"],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const msg = parsed.error.errors.map((e) => e.message).join("; ");
  console.error("Env validation failed:", msg);
  throw new Error(`Env validation failed: ${msg}`);
}

export const env: z.infer<typeof envSchema> = parsed.data;

export function getRedisUrl(): string | undefined {
  return env.REDIS_URL?.trim() || undefined;
}

export function getPort(): number {
  return Number(env.PORT) || 3000;
}
