/**
 * Builds AppEnv for the Node.js server from process.env.
 * DB is Prisma Client (PostgreSQL); R2 is local filesystem adapter.
 * getEnv() exposes a singleton for use in request handlers (no c.env bindings).
 */

import { PrismaClient } from "@prisma/client";
import type { AppEnv } from "../env-types";
import { createR2Node } from "./r2-node";

const DEFAULT_R2_PATH = "data/uploads";
const DEFAULT_PORT = 3000;

let appEnv: AppEnv | null = null;

export function getAppEnv(): AppEnv {
  const storagePath = process.env.STORAGE_PATH ?? DEFAULT_R2_PATH;

  const DB = new PrismaClient();
  const R2_BUCKET = createR2Node(storagePath);

  return {
    DB,
    R2_BUCKET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY ?? "",
    RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ?? "",
  };
}

/** Singleton env for request handlers. Lazy-initialized on first use. */
export function getEnv(): AppEnv {
  if (!appEnv) appEnv = getAppEnv();
  return appEnv;
}

export function getPort(): number {
  return Number(process.env.PORT) || DEFAULT_PORT;
}
