/**
 * @file cron.ts
 * @description Abandoned order cleanup — called via external cron trigger.
 * 
 * On Vercel: Use Vercel Cron Jobs (vercel.json) to hit GET /api/v1/cron/cleanup
 * On VPS:   Use system crontab: every 15 mins * * * * curl http://localhost:4000/api/v1/cron/cleanup?secret=YOUR_CRON_SECRET
 * 
 * This is NOT node-cron because Next.js API routes are serverless — no persistent process.
 */
import { OrderService } from "../modules/order/order.service";
import { logger } from "./utils/logger";
import { ENV } from "./config/env";
import { AppError } from "./errors/AppError";

const CRON_SECRET = ENV.CRON_SECRET || "";

/**
 * Validates the cron request is authorized.
 * On Vercel: Vercel sends x-vercel-cron-signature header automatically.
 * On VPS: We validate a shared secret query param.
 */
export function validateCronAuth(req: { headers: Record<string, string>; searchParams?: URLSearchParams }): void {
  // Vercel Cron Jobs automatically set this header
  const vercelCron = req.headers["x-vercel-cron-signature"];
  if (vercelCron) return;

  // VPS: validate shared secret
  const secret = req.searchParams?.get("secret") || "";
  if (!CRON_SECRET) {
    throw new AppError("CRON_SECRET is not configured", 500);
  }
  if (secret !== CRON_SECRET) {
    throw new AppError("Unauthorized cron request", 401);
  }
}

/**
 * Main cleanup handler — marks stale pending_payment orders as failed.
 * Returns count of cleaned up orders.
 */
export async function runAbandonedOrderCleanup(): Promise<number> {
  logger.info("Running abandoned orders cleanup...");
  const count = await OrderService.cleanupAbandonedOrders();
  return count;
}
