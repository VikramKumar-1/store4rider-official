import { Worker, Job } from "bullmq";
import { ENV } from "../config/env";
import { sendEmail } from "../email/ses";
import { logger } from "../utils/logger";
import IORedis from "ioredis";

const connection = ENV.REDIS_URL ? new IORedis(ENV.REDIS_URL, { maxRetriesPerRequest: null }) : new IORedis({ maxRetriesPerRequest: null });

export const emailWorker = new Worker("emailQueue", async (job: Job) => {
  const { to, subject, html } = job.data;
  logger.info(`Processing email job for ${to}...`);
  await sendEmail(to, subject, html);
}, { connection });

emailWorker.on("completed", (job: Job) => {
  logger.info(`Email job ${job.id} has completed successfully!`);
});

emailWorker.on("failed", (job: Job | undefined, err: Error) => {
  logger.error(`Email job ${job?.id} failed with reason: ${err.message}`);
});
