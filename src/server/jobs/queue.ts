/**
 * Job queue: AIJob table is source of truth; BullMQ when Redis is available, else DB poller.
 */
import { Queue, Worker } from "bullmq";
import { prisma } from "@/server/db/prisma";
import { getRedisUrl } from "@/server/utils/env";
import { logger } from "@/server/utils/logger";

const QUEUE_NAME = "ascend-ai-jobs";

function getRedisConnectionOptions(): { host: string; port: number; password?: string } | null {
  const url = getRedisUrl();
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: u.port ? parseInt(u.port, 10) : 6379,
      password: u.password ? decodeURIComponent(u.password) : undefined,
    };
  } catch {
    return null;
  }
}

const REDIS_OPTS = getRedisConnectionOptions();

export type JobType = "jd_parse" | "company_enrich" | "resume_analysis" | "career_analysis";

export interface JobPayload {
  type: JobType;
  userId?: string;
  profileId?: number;
  aiJobId: string;
  [key: string]: unknown;
}

let queue: Queue<JobPayload> | undefined;
let worker: Worker<JobPayload, unknown> | null = null;
let pollerInterval: ReturnType<typeof setInterval> | null = null;

type JobHandler = (payload: JobPayload) => Promise<unknown>;

const handlers = new Map<JobType, JobHandler>();

function getQueue(): Queue<JobPayload> {
  if (queue) return queue;
  if (!REDIS_OPTS) throw new Error("Redis not configured");
  queue = new Queue<JobPayload>(QUEUE_NAME, {
    connection: REDIS_OPTS,
    defaultJobOptions: { removeOnComplete: { count: 500 }, attempts: 3, backoff: { type: "exponential", delay: 2000 } },
  });
  return queue;
}

/** Create AIJob row and optionally add to BullMQ. Returns AIJob id. */
export async function enqueue(
  type: JobType,
  payload: Omit<JobPayload, "type" | "aiJobId">,
  options?: { userId?: string; profileId?: number }
): Promise<string> {
  const userId = options?.userId ?? (payload.userId as string | undefined) ?? null;
  const profileId = options?.profileId ?? (payload.profileId as number | undefined) ?? null;
  const aiJob = await prisma.aIJob.create({
    data: {
      type,
      status: "PENDING",
      payload: JSON.stringify(payload),
      user_id: userId,
      profile_id: profileId,
    },
  });

  const fullPayload: JobPayload = { ...payload, type, aiJobId: aiJob.id, userId: userId ?? undefined, profileId: profileId ?? undefined };

  if (REDIS_OPTS) {
    const q = getQueue();
    await q.add(type, fullPayload, { jobId: aiJob.id });
  }

  return aiJob.id;
}

export function registerHandler(type: JobType, handler: JobHandler): void {
  handlers.set(type, handler);
}

export function getJobHandler(type: JobType): JobHandler | undefined {
  return handlers.get(type);
}

async function runHandler(aiJobId: string, payload: JobPayload): Promise<void> {
  const fn = handlers.get(payload.type);
  if (!fn) {
    await prisma.aIJob.update({ where: { id: aiJobId }, data: { status: "FAILED", error: `No handler: ${payload.type}`, completed_at: new Date() } });
    return;
  }
  try {
    await prisma.aIJob.update({ where: { id: aiJobId }, data: { status: "PROCESSING", updated_at: new Date() } });
    const result = await fn(payload);
    await prisma.aIJob.update({
      where: { id: aiJobId },
      data: { status: "COMPLETED", result: typeof result === "string" ? result : JSON.stringify(result ?? {}), completed_at: new Date(), error: null },
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await prisma.aIJob.update({ where: { id: aiJobId }, data: { status: "FAILED", error: err, completed_at: new Date() } });
    logger.error("Job handler failed", { aiJobId, error: err });
  }
}

/** Start BullMQ worker when Redis is available. */
export function startWorker(): void {
  if (worker && REDIS_OPTS) return;
  if (REDIS_OPTS) {
    worker = new Worker<JobPayload, unknown>(
      QUEUE_NAME,
      async (job) => {
        const fn = handlers.get(job.data.type as JobType);
        if (fn) return fn(job.data);
        throw new Error(`No handler for job type: ${job.data.type}`);
      },
      { connection: REDIS_OPTS, concurrency: 4 }
    );
    worker.on("failed", (j, err) => logger.error("Job failed", { jobId: j?.id, error: String(err) }));
    logger.info("BullMQ worker started");
    return;
  }

  // DB poller when Redis is not available
  if (pollerInterval) return;
  const POLL_MS = 2000;
  pollerInterval = setInterval(async () => {
    const pending = await prisma.aIJob.findFirst({ where: { status: "PENDING" }, orderBy: { created_at: "asc" } });
    if (!pending) return;
    let payload: JobPayload;
    try {
      payload = JSON.parse(pending.payload ?? "{}") as JobPayload;
    } catch {
      await prisma.aIJob.update({ where: { id: pending.id }, data: { status: "FAILED", error: "Invalid payload", completed_at: new Date() } });
      return;
    }
    payload.type = pending.type as JobType;
    payload.aiJobId = pending.id;
    payload.userId = pending.user_id ?? undefined;
    payload.profileId = pending.profile_id ?? undefined;
    await runHandler(pending.id, payload);
  }, POLL_MS);
  logger.info("DB job poller started (no Redis)");
}

export function isRedisAvailable(): boolean {
  return !!REDIS_OPTS;
}
