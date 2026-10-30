import cron from "node-cron";
import { OrderRepository } from "../../modules/order/order.repository";
import { logger } from "../utils/logger";

export function initCronJobs() {
  // 1. Run every 30 minutes to clean up stale pending_payment orders
  cron.schedule("*/30 * * * *", async () => {
    logger.info("Running cleanup cron job for stale unfulfilled/abandoned orders...");
    try {
      const count = await OrderRepository.markStaleOrdersAsFailed();
      logger.info(`Cron Job Complete: Marked ${count} stale pending orders as failed.`);
    } catch (error) {
      logger.error("Failed to run order cleanup cron job", error);
    }
  });

  // 2. Run every 6 hours (4 times a day) to auto-sync Instagram stats, bio, and latest reels.
  // Preserves Meta API credits, respects rate limits, and prevents unnecessary database write load.
  cron.schedule("0 */6 * * *", async () => {
    if (!process.env.INSTAGRAM_ACCESS_TOKEN) return;
    logger.info("Running automatic Instagram live feed & stats sync cron job (every 6 hours)...");
    try {
      const { HomepageService } = await import("../../modules/homepage/homepage.service");
      await HomepageService.syncInstagramFeed();
      logger.info("Cron Job Complete: Instagram stats, bio, and reels refreshed.");
    } catch (error: any) {
      logger.warn("Automatic Instagram sync cron job failed:", error?.message);
    }
  });
}
