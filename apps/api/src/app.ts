import { Hono } from "hono";
import { cors } from "hono/cors";
import type { HttpBindings, Http2Bindings } from "@hono/node-server";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { rateLimit, rateLimitStrict } from "./middleware/rateLimit.js";
import { optionalAuth } from "./middleware/auth.js";
import { apiErrorHandler } from "./middleware/errorHandler.js";
import healthRoutes from "./routes/health.js";
import analysisRoutes from "./routes/analysis.js";
import legacyWorker from "./worker/index.js";

type Env = {
  Bindings: HttpBindings | Http2Bindings;
  Variables: { user?: { id: string }; requestId?: string };
};

const app = new Hono<Env>();

app.use("*", requestId);
app.use("*", requestLogger);
app.use("*", cors({
  origin: process.env.CORS_ORIGIN ?? "*",
  allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use("*", rateLimit({ windowMs: 60_000, max: 200 }));

app.onError(apiErrorHandler);

app.route("/api/health", healthRoutes);

app.use("/api/ai/*", rateLimitStrict);
app.use("/api/resumes/*", rateLimitStrict);
app.use("*", (c, next) => {
  const path = c.req.path;
  if (path.includes("assess-fit") || path.includes("tailor") || path.includes("job-fit")) {
    return rateLimitStrict(c, next);
  }
  return next();
});

app.use("/api/ai/*", optionalAuth);
app.route("/api/ai", analysisRoutes);
app.route("/", legacyWorker);

export default app;
