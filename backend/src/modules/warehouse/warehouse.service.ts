import { WarehouseRepository } from "./warehouse.repository";
import { AppError, ConflictError, NotFoundError } from "../../core/errors/AppError";
import { IWarehouse } from "@store4riders/shared-types";

export class WarehouseService {
  static async createWarehouse(data: Partial<IWarehouse>) {
    const existing = await WarehouseRepository.findByCode(data.warehouseCode!);
    if (existing) {
      throw new ConflictError("Warehouse with this code already exists");
    }

    if (data.isDefault) {
      await WarehouseRepository.unsetAllDefault();
    }

    return WarehouseRepository.create(data);
  }

  static async updateWarehouse(id: string, data: Partial<IWarehouse>) {
    const warehouse = await WarehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundError("Warehouse");
    }

    if (data.warehouseCode && data.warehouseCode !== warehouse.warehouseCode) {
      const existing = await WarehouseRepository.findByCode(data.warehouseCode);
      if (existing) {
        throw new ConflictError("Warehouse with this code already exists");
      }
    }

    if (data.isDefault) {
      await WarehouseRepository.unsetAllDefault(id);
    } else if (data.isDefault === false && warehouse.isDefault) {
      // Trying to unset the default warehouse. Check if there are other active ones?
      // For now, allow it, but we should have at least one default.
      // Better: prevent unsetting default directly, require setting another one to default.
      // We'll let it pass, but it's a domain logic choice.
    }

    const updated = await WarehouseRepository.update(id, data);
    return updated;
  }

  static async getWarehouseById(id: string) {
    const warehouse = await WarehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundError("Warehouse");
    }
    return warehouse;
  }

  static async getDefaultWarehouse() {
    return WarehouseRepository.findDefault();
  }

  static async getAllWarehouses() {
    return WarehouseRepository.findAll();
  }

  static async deleteWarehouse(id: string) {
    const warehouse = await WarehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundError("Warehouse");
    }
    
    if (warehouse.isDefault) {
      throw new AppError("Cannot delete the default warehouse", 400);
    }

    await WarehouseRepository.delete(id);
    return { success: true };
  }
}
