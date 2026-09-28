import { NextRequest, NextResponse } from "next/server";
import { WarehouseController } from "./warehouse.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkAdmin } from "../../core/middlewares/admin";
import { UserService } from "../user/user.service";
import { AppError } from "../../core/errors/AppError";

/**
 * @swagger
 * tags:
 *   name: Warehouses
 *   description: Warehouse and pickup location management
 */
export async function warehouseRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;

  const userId = extractUserFromAuth(req);

  // Admin Routes
  if (routePath[0] === "admin") {
    await checkAdmin(userId, UserService.getRole);
    
    // GET /api/v1/warehouses/admin
    if (method === "GET" && routePath.length === 1) {
      return await WarehouseController.getAll(req);
    }
    
    // POST /api/v1/warehouses/admin
    if (method === "POST" && routePath.length === 1) {
      return await WarehouseController.create(req);
    }
    
    // GET /api/v1/warehouses/admin/default
    if (method === "GET" && routePath.length === 2 && routePath[1] === "default") {
      return await WarehouseController.getDefault(req);
    }
    
    // GET /api/v1/warehouses/admin/:id
    if (method === "GET" && routePath.length === 2 && routePath[1] !== "default") {
      return await WarehouseController.getById(req, routePath[1]);
    }
    
    // PUT /api/v1/warehouses/admin/:id
    if (method === "PUT" && routePath.length === 2) {
      return await WarehouseController.update(req, routePath[1]);
    }
    
    // DELETE /api/v1/warehouses/admin/:id
    if (method === "DELETE" && routePath.length === 2) {
      return await WarehouseController.delete(req, routePath[1]);
    }
  }

  throw new AppError("Route not found in warehouses module", 404);
}
