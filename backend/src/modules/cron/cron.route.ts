import { NextRequest } from "next/server";
import { ApiResponse } from "../../core/response/ApiResponse";
import { connectToDatabase } from "../../core/database/connection";
import { runAbandonedOrderCleanup, validateCronAuth } from "../../core/cron";
import { logger } from "../../core/utils/logger";

/**
 * @swagger
 * /api/v1/cron/cleanup:
 *   get:
 *     summary: Cleanup abandoned pending_payment orders (cron endpoint)
 *     tags: [Cron]
 *     description: |
 *       Marks orders stuck in pending_payment for >30 minutes as failed.
 *       Protected by CRON_SECRET or Vercel cron signature.
 *     parameters:
 *       - in: query
 *         name: secret
 *         schema:
 *           type: string
 *         description: CRON_SECRET for VPS authentication
 *     responses:
 *       200:
 *         description: Cleanup completed
 */
export async function cronRouter(req: NextRequest, routePath: string[]) {
  const method = req.method;

  if (method === "GET" && (routePath[0] === "cleanup" || !routePath[0])) {
    try {
      const headers: Record<string, string> = {};
      req.headers.forEach((val, key) => { headers[key.toLowerCase()] = val; });

      validateCronAuth({
        headers,
        searchParams: req.nextUrl.searchParams,
      });

      await connectToDatabase();
      const count = await runAbandonedOrderCleanup();

      return ApiResponse.success(
        { cleanedUp: count },
        `Cleanup complete. ${count} abandoned order(s) marked as failed.`
      );
    } catch (err: any) {
      logger.error("Cron cleanup failed", { error: err.message });
      return ApiResponse.error(err.message, err.statusCode || 500);
    }
  }

  return ApiResponse.error("Cron endpoint not found", 404);
}
