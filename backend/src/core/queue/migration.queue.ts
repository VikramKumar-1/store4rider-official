import { Queue } from "bullmq";
import { ENV } from "../config/env";
import { logger } from "../utils/logger";
import IORedis from "ioredis";

const connection = ENV.REDIS_URL ? new IORedis(ENV.REDIS_URL, { maxRetriesPerRequest: null }) : new IORedis({ maxRetriesPerRequest: null });

export const migrationQueue = new Queue("migrationQueue", { connection });

export async function addMigrationJob(filePath: string, adminId: string) {
  try {
    const job = await migrationQueue.add("migrateCSV", { filePath, adminId }, {
      attempts: 1, // We don't want to auto-retry massive imports on failure without user intervention
    });
    logger.info(`Migration job added to queue with ID: ${job.id}`);
    return job;
  } catch (error) {
    logger.error("Failed to add migration job to queue", error);
    throw error;
  }
}
export async function getMigrationJob(jobId: string) {
  return await migrationQueue.getJob(jobId);
}
