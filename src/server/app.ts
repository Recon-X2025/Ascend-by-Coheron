/**
 * Main Hono app: middleware + new /api/ai routes + legacy worker for all other routes.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { HttpBindings, Http2Bindings } from "@hono/node-server";
import { requestLogger } from "@/server/middleware/requestLogger";
import { apiErrorHandler } from "@/server/middleware/errorHandler";
import { timeout } from "@/server/middleware/timeout";
import { rateLimit } from "@/server/middleware/rateLimit";
import { optionalAuth } from "@/server/middleware/optionalAuth";
import aiRoutes from "@/server/routes/ai";
import legacyWorker from "@/worker/index";

type Env = { Bindings: HttpBindings | Http2Bindings; Variables: { user?: { id: string } } };

const app = new Hono<Env>();

app.use("*", cors({ origin: process.env.CORS_ORIGIN ?? "*", allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization"], credentials: true }));
app.use("*", requestLogger);
app.use("*", rateLimit({ windowMs: 60_000, max: 200 }));
app.use("*", timeout(60_000));

app.onError(apiErrorHandler);

app.use("/api/ai/*", optionalAuth);
app.route("/api/ai", aiRoutes);
app.route("/", legacyWorker);

export default app;
