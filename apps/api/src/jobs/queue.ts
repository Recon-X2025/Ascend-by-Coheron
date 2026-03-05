/**
 * Queue instance for the API: uses @ascend/queue with prisma, env, logger.
 */
import { createQueue } from "@ascend/queue";
import { prisma } from "../db/prisma.js";
import { getRedisUrl } from "../utils/env.js";
import { logger } from "../utils/logger.js";

const queueApi = createQueue({
  prisma,
  getRedisUrl,
  logger: { info: (m, meta) => logger.info(meta, m), error: (m, meta) => logger.error(meta, m) },
});

export const enqueue = queueApi.enqueue;
export const registerHandler = queueApi.registerHandler;
export const startWorker = queueApi.startWorker;
export const isRedisAvailable = queueApi.isRedisAvailable;
export type { JobType, JobPayload } from "@ascend/queue";
