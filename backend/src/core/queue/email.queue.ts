import { Queue } from "bullmq";
import { ENV } from "../config/env";
import { logger } from "../utils/logger";
import IORedis from "ioredis";

const connection = new IORedis(ENV.REDIS_URL, { maxRetriesPerRequest: null });

export const emailQueue = new Queue("emailQueue", { connection });

export async function addEmailJob(to: string, subject: string, html: string) {
  try {
    await emailQueue.add("sendEmail", { to, subject, html }, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000
      }
    });
    logger.info(`Email job added to queue for ${to}`);
  } catch (error) {
    logger.error("Failed to add email job to queue", error);
  }
}
