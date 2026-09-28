import { NextRequest } from "next/server";
import { AppError } from "../../core/errors/AppError";
import { ReturnController } from "./return.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";

/**
 * @swagger
 * tags:
 *   name: Returns
 *   description: Return and Refund Management
 */
export async function returnRouter(req: NextRequest, routePath: string[]) {
  const method = req.method;

  // Middleware: All return routes require authentication
  await extractUserFromAuth(req);

  // ---------------------------------------------------------------------------
  // Customer Routes
  // ---------------------------------------------------------------------------
  
  // POST /api/v1/returns
  if (method === "POST" && routePath.length === 0) {
    return await ReturnController.requestReturn(req);
  }

  // ---------------------------------------------------------------------------
  // Admin Routes (Requires Admin Role)
  // ---------------------------------------------------------------------------
  const isAdmin = req.headers.get("x-user-role") === "admin";

  if (routePath[0] === "admin") {
    if (!isAdmin) {
      throw new AppError("Forbidden. Admin access required.", 403);
    }

    // GET /api/v1/returns/admin
    if (method === "GET" && routePath.length === 1) {
      return await ReturnController.getAdminReturns(req);
    }

    // POST /api/v1/returns/admin/:id/inward
    if (method === "POST" && routePath.length === 3 && routePath[2] === "inward") {
      const returnId = routePath[1];
      return await ReturnController.inwardScan(req, returnId);
    }

    // POST /api/v1/returns/admin/:id/qc
    if (method === "POST" && routePath.length === 3 && routePath[2] === "qc") {
      const returnId = routePath[1];
      return await ReturnController.processQC(req, returnId);
    }
  }

  throw new AppError(`Route not found: ${method} /api/v1/returns/${routePath.join("/")}`, 404);
}
