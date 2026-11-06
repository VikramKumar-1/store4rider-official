import { describe, it, expect, vi, beforeEach } from "vitest";
import { WarehouseService } from "../warehouse.service";
import { WarehouseRepository } from "../warehouse.repository";
import { ConflictError, NotFoundError } from "../../../core/errors/AppError";

vi.mock("../warehouse.repository");

describe("WarehouseService - Multi-Warehouse Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Create Warehouse", () => {
    it("successfully creates a new warehouse with courier integration fields", async () => {
      (WarehouseRepository.findByCode as any).mockResolvedValue(null);
      (WarehouseRepository.create as any).mockResolvedValue({
        _id: "wh_kol",
        name: "Kolkata Hub",
        warehouseCode: "WH-KOL-01",
        pincode: "700016",
        city: "Kolkata",
        shiprocketLocationId: "Kolkata_Hub",
        delhiveryWarehouseName: "Kolkata_Facility",
        isDefault: true,
      });

      const result = await WarehouseService.createWarehouse({
        name: "Kolkata Hub",
        warehouseCode: "WH-KOL-01",
        pincode: "700016",
        city: "Kolkata",
        shiprocketLocationId: "Kolkata_Hub",
        isDefault: true,
      });

      expect(WarehouseRepository.unsetAllDefault).toHaveBeenCalled();
      expect(result.warehouseCode).toBe("WH-KOL-01");
      expect(result.shiprocketLocationId).toBe("Kolkata_Hub");
    });

    it("throws ConflictError if warehouseCode already exists", async () => {
      (WarehouseRepository.findByCode as any).mockResolvedValue({ _id: "existing_wh" });

      await expect(
        WarehouseService.createWarehouse({ warehouseCode: "WH-KOL-01" })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("Update Warehouse", () => {
    it("updates warehouse fields successfully", async () => {
      (WarehouseRepository.findById as any).mockResolvedValue({
        _id: "wh_kol",
        warehouseCode: "WH-KOL-01",
      });
      (WarehouseRepository.update as any).mockResolvedValue({
        _id: "wh_kol",
        name: "Updated Kolkata Hub",
      });

      const updated = await WarehouseService.updateWarehouse("wh_kol", {
        name: "Updated Kolkata Hub",
      });

      expect(updated!.name).toBe("Updated Kolkata Hub");
    });

    it("throws NotFoundError if warehouse to update does not exist", async () => {
      (WarehouseRepository.findById as any).mockResolvedValue(null);

      await expect(
        WarehouseService.updateWarehouse("non_existent", { name: "Test" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Get Warehouses", () => {
    it("returns all warehouses", async () => {
      const mockList = [
        { _id: "wh_1", name: "Kolkata Hub" },
        { _id: "wh_2", name: "Pune Godown" },
      ];
      (WarehouseRepository.findAll as any).mockResolvedValue(mockList);

      const result = await WarehouseService.getAllWarehouses();
      expect(result.length).toBe(2);
    });

    it("returns default warehouse", async () => {
      const defaultWh = { _id: "wh_1", name: "Kolkata Hub", isDefault: true };
      (WarehouseRepository.findDefault as any).mockResolvedValue(defaultWh);

      const result = await WarehouseService.getDefaultWarehouse();
      expect(result?.isDefault).toBe(true);
    });
  });

  describe("Sync Shiprocket Warehouses", () => {
    it("successfully fetches and syncs pickup locations from Shiprocket into warehouse repository", async () => {
      vi.mock("../../../core/shipping/ShiprocketProvider", () => ({
        ShiprocketProvider: vi.fn().mockImplementation(() => ({
          getPickupLocations: vi.fn().mockResolvedValue([
            {
              id: 991,
              pickup_location: "Main_Godown",
              name: "Vikram Kumar",
              email: "shipping@store4riders.com",
              phone: "9876543210",
              address: "123 Street",
              address_2: "Suite 4",
              city: "Pune",
              state: "Maharashtra",
              country: "India",
              pin_code: "411030",
              is_primary: 1,
              status: 1,
            },
          ]),
        })),
      }));

      (WarehouseRepository.upsertShiprocketWarehouse as any).mockImplementation((data: any) => Promise.resolve({
        _id: "wh_synced_1",
        ...data,
      }));
      (WarehouseRepository.findDefault as any).mockResolvedValue({ _id: "wh_synced_1", isDefault: true });

      const result = await WarehouseService.syncShiprocketWarehouses();

      expect(result.syncedCount).toBe(1);
      expect(result.warehouses[0].name).toBe("Main_Godown");
      expect(result.warehouses[0].shiprocketLocationId).toBe("Main_Godown");
      expect(WarehouseRepository.unsetAllDefault).toHaveBeenCalled();
    });
  });
});
