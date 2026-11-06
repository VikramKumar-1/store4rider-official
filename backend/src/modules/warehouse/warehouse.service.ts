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

  static async syncShiprocketWarehouses() {
    const { ShiprocketProvider } = await import("../../core/shipping/ShiprocketProvider");
    const provider = new ShiprocketProvider();
    const pickupLocations = await provider.getPickupLocations();

    if (!pickupLocations || pickupLocations.length === 0) {
      throw new AppError("No pickup locations found in your Shiprocket account. Please configure pickup addresses in your Shiprocket panel.", 404);
    }

    const synced: IWarehouse[] = [];

    for (const loc of pickupLocations) {
      const nickname = loc.pickup_location?.trim();
      if (!nickname) continue;

      const code = `SR-${loc.id || nickname.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
      const isPrimary = loc.is_primary === 1;

      const warehouseData: Partial<IWarehouse> = {
        name: nickname,
        warehouseCode: code,
        contactPerson: loc.name?.trim() || "Warehouse Manager",
        phone: loc.phone?.trim() || "0000000000",
        email: loc.email?.trim() || "shipping@store4riders.com",
        addressLine1: [loc.address?.trim(), loc.address_2?.trim()].filter(Boolean).join(", ") || nickname,
        addressLine2: loc.address_2?.trim() || "",
        city: loc.city?.trim() || "",
        state: loc.state?.trim() || "",
        country: loc.country?.trim() || "India",
        pincode: String(loc.pin_code || "").trim(),
        shiprocketLocationId: nickname,
        isActive: loc.status !== 0,
        isDefault: isPrimary,
      };

      if (isPrimary) {
        await WarehouseRepository.unsetAllDefault();
      }

      const saved = await WarehouseRepository.upsertShiprocketWarehouse(warehouseData);
      synced.push(saved);
    }

    // Ensure there is at least one default warehouse
    const currentDefault = await WarehouseRepository.findDefault();
    if (!currentDefault && synced.length > 0) {
      const firstId = String((synced[0] as any)._id || synced[0].id);
      await WarehouseRepository.update(firstId, { isDefault: true });
      synced[0].isDefault = true;
    }

    return {
      syncedCount: synced.length,
      warehouses: synced,
    };
  }
}
