/**
 * API server entry: validate env, set AI logger, start job worker, serve.
 */
import "./utils/env.js";
import { setLogger } from "@ascend/ai";
import { logger } from "./utils/logger.js";
import { startJobWorker } from "./jobs/workers/index.js";
import { getPort } from "./utils/env.js";
import app from "./app.js";
import { serve } from "@hono/node-server";
import type { HttpBindings, Http2Bindings } from "@hono/node-server";

setLogger({ info: (m, meta) => logger.info(meta ?? {}, m), warn: (m, meta) => logger.warn(meta ?? {}, m) });
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
    logger.info({ port: info.port }, "Server listening");
  }
);
