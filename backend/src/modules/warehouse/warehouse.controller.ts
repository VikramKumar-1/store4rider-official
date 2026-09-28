import { NextRequest } from "next/server";
import { WarehouseService } from "./warehouse.service";
import { WarehouseValidator } from "./warehouse.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

export class WarehouseController {
  static async create(req: NextRequest) {
    const data = await WarehouseValidator.validateCreate(req);
    const warehouse = await WarehouseService.createWarehouse(data);
    return ApiResponse.success(warehouse, "Warehouse created successfully", 201);
  }

  static async update(req: NextRequest, id: string) {
    const { data } = await WarehouseValidator.validateUpdate(req, id);
    const warehouse = await WarehouseService.updateWarehouse(id, data);
    return ApiResponse.success(warehouse, "Warehouse updated successfully");
  }

  static async getById(req: NextRequest, id: string) {
    const warehouse = await WarehouseService.getWarehouseById(id);
    return ApiResponse.success(warehouse, "Warehouse retrieved");
  }

  static async getDefault(req: NextRequest) {
    const warehouse = await WarehouseService.getDefaultWarehouse();
    return ApiResponse.success(warehouse, "Default warehouse retrieved");
  }

  static async getAll(req: NextRequest) {
    const warehouses = await WarehouseService.getAllWarehouses();
    return ApiResponse.success(warehouses, "Warehouses retrieved");
  }

  static async delete(req: NextRequest, id: string) {
    await WarehouseService.deleteWarehouse(id);
    return ApiResponse.success(null, "Warehouse deleted successfully");
  }
}
