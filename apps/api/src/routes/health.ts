/**
 * Health endpoints: server, database, queue. Used for load balancers and monitoring.
 */
import { Hono } from "hono";
import { prisma } from "../db/prisma.js";
import { isRedisAvailable } from "../jobs/queue.js";

type Env = { Variables: { requestId?: string } };

const app = new Hono<Env>();

app.get("/", (c) => {
  return c.json({
    success: true,
    data: { status: "ok", service: "ascend-api" },
  });
});

app.get("/db", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({
      success: true,
      data: { status: "ok", database: "connected" },
    });
  } catch (e) {
    return c.json(
      {
        success: false,
        error: "Database unavailable",
      },
      503
    );
  }
});

app.get("/queue", (c) => {
  const operational = isRedisAvailable();
  return c.json({
    success: true,
    data: { status: operational ? "ok" : "fallback", queue: operational ? "redis" : "db-poller" },
  });
});

export default app;
