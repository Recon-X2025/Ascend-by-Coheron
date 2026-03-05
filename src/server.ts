/**
 * Node.js HTTP server entry. Uses modular app (server/app.ts), validates env, starts job worker.
 */
import { validateEnv } from "@/server/utils/env";
import { startJobWorker } from "@/server/jobs/workers";
import app from "@/server/app";
import { serve } from "@hono/node-server";
import type { HttpBindings, Http2Bindings } from "@hono/node-server";
import { getPort } from "@/node/get-app-env";

validateEnv();
startJobWorker();

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
