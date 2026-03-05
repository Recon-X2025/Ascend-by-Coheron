import { Hono } from "hono";
import { prisma } from "@/server/db/prisma";
import { enqueue } from "@/server/jobs/queue";
import {
  aiJobIdParamSchema,
  jobEnqueueSchema,
  companyEnrichSchema,
  resumeAnalysisSchema,
  careerAnalysisSchema,
} from "@/server/validation/schemas";

type Env = { Variables: { user?: { id: string } } };

const app = new Hono<Env>();

app.get("/jobs/:id", async (c) => {
  const parsed = aiJobIdParamSchema.safeParse({ id: c.req.param("id") });
  if (!parsed.success) return c.json({ success: false, error: "Invalid id" }, 400);
  const { id } = parsed.data;
  const job = await prisma.aIJob.findUnique({ where: { id } });
  if (!job) return c.json({ success: false, error: "Job not found" }, 404);
  return c.json({
    success: true,
    data: {
      id: job.id,
      type: job.type,
      status: job.status,
      result: job.result ? JSON.parse(job.result) : null,
      error: job.error,
      completed_at: job.completed_at?.toISOString() ?? null,
    },
  });
});

app.post("/jobs/parse-jd", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = jobEnqueueSchema.safeParse(body);
  if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message ?? "Validation failed";
      return c.json({ success: false, error: msg }, 400);
    }
  const user = c.get("user");
  const jobId = await enqueue("jd_parse", { url: parsed.data.url, rawText: parsed.data.rawText }, { userId: user?.id });
  return c.json({ success: true, data: { jobId } });
});

app.post("/jobs/enrich-company", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = companyEnrichSchema.safeParse(body);
  if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message ?? "Validation failed";
      return c.json({ success: false, error: msg }, 400);
    }
  const user = c.get("user");
  const jobId = await enqueue(
    "company_enrich",
    { domain: parsed.data.domain, companyName: parsed.data.companyName },
    { userId: user?.id }
  );
  return c.json({ success: true, data: { jobId } });
});

app.post("/jobs/analyze-resume", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = resumeAnalysisSchema.safeParse(body);
  if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message ?? "Validation failed";
      return c.json({ success: false, error: msg }, 400);
    }
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  const jobId = await enqueue(
    "resume_analysis",
    { profileId: parsed.data.profileId, resumeText: parsed.data.resumeText, resumeKey: parsed.data.resumeKey },
    { userId: user.id, profileId: parsed.data.profileId }
  );
  return c.json({ success: true, data: { jobId } });
});

app.post("/jobs/career-analysis", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = careerAnalysisSchema.safeParse(body);
  if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message ?? "Validation failed";
      return c.json({ success: false, error: msg }, 400);
    }
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  const jobId = await enqueue("career_analysis", { profileId: parsed.data.profileId }, { userId: user.id, profileId: parsed.data.profileId });
  return c.json({ success: true, data: { jobId } });
});

export default app;
