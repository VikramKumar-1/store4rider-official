import cron from "node-cron";
import { OrderModel } from "../../modules/order/order.model";
import { logger } from "../utils/logger";

export function initCronJobs() {
  // Run every day at 02:00 AM
  cron.schedule("0 2 * * *", async () => {
    logger.info("Running daily cleanup cron job for abandoned carts...");
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await OrderModel.updateMany(
        { 
          status: "pending", 
          createdAt: { $lt: twentyFourHoursAgo } 
        },
        { $set: { status: "failed" } }
      );

      logger.info(`Cron Job Complete: Marked ${result.modifiedCount} pending orders as failed.`);
      
      // Note: If you have inventory management logic, you would also loop through
      // the cancelled orders here to restore their reserved stock quantities.
    } catch (error) {
      logger.error("Failed to run order cleanup cron job", error);
    }
  });
}
