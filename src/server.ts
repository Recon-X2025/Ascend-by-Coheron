/**
 * Node.js HTTP server entry point for the Ascend backend.
 * Serves the Hono app via @hono/node-server. Listens on process.env.PORT || 3000.
 * Passes Node bindings (incoming, outgoing) into the app so NextAuth can handle GET/POST /api/auth/[...nextauth].
 *
 * No ExecutionContext (waitUntil, passThroughOnException) is used on Node; app.fetch is called with (request, env) only.
 *
 * Usage:
 *   npm run dev:server   # or: npm run start
 *   npx tsx src/server.ts
 */

import { serve } from "@hono/node-server";
import type { HttpBindings, Http2Bindings } from "@hono/node-server";
import app from "./worker/index";
import { getPort } from "./node/get-app-env";

const port = getPort();

serve(
  {
    fetch(request: Request, env: HttpBindings | Http2Bindings) {
      return app.fetch(request, env);
    },
    port,
  },
  (info) => {
    console.log(`Server listening on http://localhost:${info.port}`);
  }
);
