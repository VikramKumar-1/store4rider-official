import "dotenv/config";
import { emailWorker } from "./core/queue/email.worker";
import { migrationWorker } from "./core/queue/migration.worker";
import { logger } from "./core/utils/logger";

logger.info("Store4Riders BullMQ Workers starting...");
logger.info("Listening on queues: [emailQueue, migrationQueue]");

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully closing BullMQ workers...`);
  try {
    await Promise.allSettled([
      emailWorker.close(),
      migrationWorker.close(),
    ]);
    logger.info("BullMQ workers shut down cleanly.");
  } catch (err) {
    logger.error("Error during worker shutdown", err);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
