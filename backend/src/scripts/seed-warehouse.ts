import mongoose from "mongoose";
import { ENV } from "../core/config/env";
import { SettingRepository } from "../modules/settings/setting.repository";
import { WarehouseRepository } from "../modules/warehouse/warehouse.repository";
import { logger } from "../core/utils/logger";

async function seedWarehouse() {
  try {
    await mongoose.connect(ENV.DATABASE_URL);
    logger.info("Connected to MongoDB");

    const defaultWarehouse = await WarehouseRepository.findDefault();
    if (defaultWarehouse) {
      logger.info("Default warehouse already exists. Skipping seed.");
      process.exit(0);
    }

    const settings = await SettingRepository.getSettings();
    if (!settings) {
      logger.info("No settings found. Cannot seed warehouse.");
      process.exit(0);
    }

    await WarehouseRepository.create({
      name: "Primary Warehouse",
      warehouseCode: "WH-01",
      contactPerson: "Admin",
      phone: settings.storeOriginPhone || "0000000000",
      email: process.env.STORE_EMAIL || "admin@store4riders.com",
      addressLine1: settings.storeOriginAddress || "Default Address",
      city: settings.storeOriginCity || "Pune",
      state: settings.storeOriginState || "Maharashtra",
      country: "India",
      pincode: settings.storeOriginPincode || "411001",
      shiprocketLocationId: process.env.SHIPROCKET_PICKUP_LOCATION || "",
      isActive: true,
      isDefault: true,
    });

    logger.info("Successfully seeded default warehouse from Settings");
    process.exit(0);
  } catch (error) {
    logger.error("Error seeding warehouse", error);
    process.exit(1);
  }
}

seedWarehouse();
