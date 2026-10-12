import { NextRequest, NextResponse } from "next/server";
import { WarehouseController } from "./warehouse.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkAdmin } from "../../core/middlewares/admin";
import { UserService } from "../user/user.service";
import { AppError } from "../../core/errors/AppError";
import { ApiResponse } from "../../core/response/ApiResponse";

/**
 * @swagger
 * tags:
 *   name: Warehouses
 *   description: Warehouse and pickup location management
 */
export async function warehouseRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;

  const userId = extractUserFromAuth(req);
  await checkAdmin(userId, UserService.getRole);

  // Normalize path by stripping optional leading "admin"
  const normalizedPath = routePath[0] === "admin" ? routePath.slice(1) : routePath;

  // GET /api/v1/warehouses
  if (method === "GET" && normalizedPath.length === 0) {
    return await WarehouseController.getAll(req);
  }

  // POST /api/v1/warehouses
  if (method === "POST" && normalizedPath.length === 0) {
    return await WarehouseController.create(req);
  }

  // GET /api/v1/warehouses/default
  if (method === "GET" && normalizedPath.length === 1 && normalizedPath[0] === "default") {
    return await WarehouseController.getDefault(req);
  }

  // PUT /api/v1/warehouses/:id/default
  if (method === "PUT" && normalizedPath.length === 2 && normalizedPath[1] === "default") {
    const warehouseId = normalizedPath[0];
    const { WarehouseService } = await import("./warehouse.service");
    const updated = await WarehouseService.updateWarehouse(warehouseId, { isDefault: true });
    return ApiResponse.success(updated, "Default warehouse set successfully");
  }

  // GET /api/v1/warehouses/:id
  if (method === "GET" && normalizedPath.length === 1) {
    return await WarehouseController.getById(req, normalizedPath[0]);
  }

  // PUT /api/v1/warehouses/:id
  if (method === "PUT" && normalizedPath.length === 1) {
    return await WarehouseController.update(req, normalizedPath[0]);
  }

  // DELETE /api/v1/warehouses/:id
  if (method === "DELETE" && normalizedPath.length === 1) {
    return await WarehouseController.delete(req, normalizedPath[0]);
  }

  throw new AppError("Route not found in warehouses module", 404);
}
