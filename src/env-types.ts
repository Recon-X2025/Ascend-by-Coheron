/**
 * Backend environment types for Node.js.
 * DB and R2_BUCKET are accessed via getEnv() from @/node/get-app-env.
 * API keys are read from process.env in the worker.
 *
 * Node server path does not use Cloudflare-style ExecutionContext (waitUntil, passThroughOnException).
 * The Hono app is invoked with (request, env) only; execution context is omitted.
 */

import type { PrismaClient } from "@prisma/client";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Node server bindings: request/response from Node HTTP.
 * Used as the second argument to app.fetch() when running on Node; no third (execution) argument.
 */
export interface NodeServerBindings {
  incoming: IncomingMessage;
  outgoing: ServerResponse;
}

/** R2-style object returned by bucket.get(). */
export interface R2Object {
  arrayBuffer(): Promise<ArrayBuffer>;
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
}

/** R2-style bucket binding. */
export interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | string,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<void>;
}

/** Backend env: Prisma (PostgreSQL) + storage + config. */
export interface AppEnv {
  DB: PrismaClient;
  R2_BUCKET: R2Bucket;
  ANTHROPIC_API_KEY: string;
  FIRECRAWL_API_KEY: string;
  RAPIDAPI_KEY: string;
}
