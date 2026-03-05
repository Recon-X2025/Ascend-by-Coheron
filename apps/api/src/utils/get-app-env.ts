/**
 * App env singleton: DB (Prisma), R2 bucket, API keys. Used by request handlers.
 */
import { prisma } from "../db/prisma.js";
import { createR2Node } from "./r2-node.js";
const DEFAULT_R2_PATH = "data/uploads";

export interface AppEnv {
  DB: typeof prisma;
  R2_BUCKET: ReturnType<typeof createR2Node>;
  ANTHROPIC_API_KEY: string;
  FIRECRAWL_API_KEY: string;
  RAPIDAPI_KEY: string;
}

let appEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (!appEnv) {
    const storagePath = process.env.STORAGE_PATH ?? DEFAULT_R2_PATH;
    appEnv = {
      DB: prisma,
      R2_BUCKET: createR2Node(storagePath),
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
      FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY ?? "",
      RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ?? "",
    };
  }
  return appEnv;
}
