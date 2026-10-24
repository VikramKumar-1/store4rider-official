import cron from "node-cron";
import { OrderRepository } from "../../modules/order/order.repository";
import { logger } from "../utils/logger";

export function initCronJobs() {
  // Run every 30 minutes to clean up stale pending_payment orders
  cron.schedule("*/30 * * * *", async () => {
    logger.info("Running cleanup cron job for stale unfulfilled/abandoned orders...");
    try {
      const count = await OrderRepository.markStaleOrdersAsFailed();
      logger.info(`Cron Job Complete: Marked ${count} stale pending orders as failed.`);
    } catch (error) {
      logger.error("Failed to run order cleanup cron job", error);
    }
  });
}