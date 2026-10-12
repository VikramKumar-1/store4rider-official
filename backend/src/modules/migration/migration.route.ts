import { NextRequest } from "next/server";
import { MigrationController } from "./migration.controller";
import { checkAdmin } from "../../core/middlewares/admin";
import { extractUserFromAuth } from "../../core/middlewares/auth";

/**
 * @swagger
 * /api/v1/migration/upload:
 *   post:
 *     summary: Upload Magento CSV for migration
 *     tags: [Migration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       202:
 *         description: Migration started in background
 */
import { UserService } from "../user/user.service";

export async function migrationRouter(req: NextRequest, routePath: string[]) {
  const method = req.method;
  const path = routePath.join("/");

  if (method === "POST" && path === "upload") {
    // Apply admin middleware
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return MigrationController.uploadCsv(req);
  }

  if (method === "GET" && routePath[0] === "status" && routePath[1]) {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return MigrationController.getStatus(req, routePath[1]);
  }

  return null; // Route not found
}
