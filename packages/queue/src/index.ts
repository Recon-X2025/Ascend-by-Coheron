/**
 * Async job queue: AIJob table + BullMQ or DB poller. Workers are registered by the API.
 */
import { Queue, Worker } from "bullmq";
import type { PrismaClient } from "@prisma/client";

export type JobType = "jd_parse" | "company_enrich" | "resume_analysis" | "career_analysis";

export interface JobPayload {
  type: JobType;
  userId?: string;
  profileId?: number;
  aiJobId: string;
  [key: string]: unknown;
}

export interface QueueLogger {
  info?(message: string, meta?: Record<string, unknown>): void;
  error?(message: string, meta?: Record<string, unknown>): void;
}

export interface QueueOptions {
  prisma: PrismaClient;
  getRedisUrl: () => string | undefined;
  logger?: QueueLogger;
}

let queue: Queue<JobPayload> | undefined;
let worker: Worker<JobPayload, unknown> | null = null;
let pollerInterval: ReturnType<typeof setInterval> | null = null;
let opts: QueueOptions | null = null;

type JobHandler = (payload: JobPayload) => Promise<unknown>;
const handlers = new Map<JobType, JobHandler>();

function getRedisOpts(url: string | undefined): { host: string; port: number; password?: string } | null {
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

const QUEUE_NAME = "ascend-ai-jobs";

export function createQueue(options: QueueOptions) {
  opts = options;
  return {
    enqueue,
    registerHandler,
    startWorker,
    isRedisAvailable,
  };
}

function getQueue(): Queue<JobPayload> {
  if (queue) return queue;
  const url = opts?.getRedisUrl?.();
  const redisOpts = getRedisOpts(url);
  if (!redisOpts) throw new Error("Redis not configured");
  queue = new Queue<JobPayload>(QUEUE_NAME, {
    connection: redisOpts,
    defaultJobOptions: { removeOnComplete: { count: 500 }, attempts: 3, backoff: { type: "exponential", delay: 2000 } },
  });
  return queue;
}

export async function enqueue(
  type: JobType,
  payload: Omit<JobPayload, "type" | "aiJobId">,
  options?: { userId?: string; profileId?: number }
): Promise<string> {
  if (!opts?.prisma) throw new Error("Queue not initialized");
  const userId = options?.userId ?? (payload.userId as string | undefined) ?? null;
  const profileId = options?.profileId ?? (payload.profileId as number | undefined) ?? null;
  const aiJob = await opts.prisma.aIJob.create({
    data: {
      type,
      status: "PENDING",
      payload: JSON.stringify(payload),
      user_id: userId,
      profile_id: profileId,
    },
  });

  const fullPayload: JobPayload = { ...payload, type, aiJobId: aiJob.id, userId: userId ?? undefined, profileId: profileId ?? undefined };
  const redisOpts = getRedisOpts(opts.getRedisUrl());
  if (redisOpts) {
    const q = getQueue();
    await q.add(type, fullPayload, { jobId: aiJob.id });
  }
  return aiJob.id;
}

export function registerHandler(type: JobType, handler: JobHandler): void {
  handlers.set(type, handler);
}

async function runHandler(aiJobId: string, payload: JobPayload): Promise<void> {
  if (!opts?.prisma) return;
  const fn = handlers.get(payload.type);
  if (!fn) {
    await opts.prisma.aIJob.update({ where: { id: aiJobId }, data: { status: "FAILED", error: `No handler: ${payload.type}`, completed_at: new Date() } });
    return;
  }
  try {
    await opts.prisma.aIJob.update({ where: { id: aiJobId }, data: { status: "PROCESSING", updated_at: new Date() } });
    const result = await fn(payload);
    await opts.prisma.aIJob.update({
      where: { id: aiJobId },
      data: { status: "COMPLETED", result: typeof result === "string" ? result : JSON.stringify(result ?? {}), completed_at: new Date(), error: null },
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await opts.prisma.aIJob.update({ where: { id: aiJobId }, data: { status: "FAILED", error: err, completed_at: new Date() } });
    opts.logger?.error?.("Job handler failed", { aiJobId, error: err });
  }
}

export function startWorker(): void {
  if (!opts) return;
  const redisOpts = getRedisOpts(opts.getRedisUrl());
  if (worker && redisOpts) return;
  if (redisOpts) {
    worker = new Worker<JobPayload, unknown>(
      QUEUE_NAME,
      async (job) => {
        const fn = handlers.get(job.data.type as JobType);
        if (fn) return fn(job.data);
        throw new Error(`No handler for job type: ${job.data.type}`);
      },
      { connection: redisOpts, concurrency: 4 }
    );
    worker.on("failed", (j, err) => opts?.logger?.error?.("Job failed", { jobId: j?.id, error: String(err) }));
    opts.logger?.info?.("BullMQ worker started");
    return;
  }
  if (pollerInterval) return;
  pollerInterval = setInterval(async () => {
    if (!opts?.prisma) return;
    const pending = await opts.prisma.aIJob.findFirst({ where: { status: "PENDING" }, orderBy: { created_at: "asc" } });
    if (!pending) return;
    let payload: JobPayload;
    try {
      payload = JSON.parse(pending.payload ?? "{}") as JobPayload;
    } catch {
      await opts.prisma.aIJob.update({ where: { id: pending.id }, data: { status: "FAILED", error: "Invalid payload", completed_at: new Date() } });
      return;
    }
    payload.type = pending.type as JobType;
    payload.aiJobId = pending.id;
    payload.userId = pending.user_id ?? undefined;
    payload.profileId = pending.profile_id ?? undefined;
    await runHandler(pending.id, payload);
  }, 2000);
  opts.logger?.info?.("DB job poller started (no Redis)");
}

export function isRedisAvailable(): boolean {
  return !!getRedisOpts(opts?.getRedisUrl?.());
}
