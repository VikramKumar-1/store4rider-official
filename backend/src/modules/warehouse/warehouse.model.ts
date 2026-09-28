import mongoose, { Schema, Document } from "mongoose";
import { IWarehouse } from "@store4riders/shared-types";

export interface WarehouseDocument extends Omit<IWarehouse, "id" | "_id">, Document {}

const warehouseSchema = new Schema<WarehouseDocument>(
  {
    name: { type: String, required: true },
    warehouseCode: { type: String, required: true, unique: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: "India" },
    pincode: { type: String, required: true },
    shiprocketLocationId: { type: String },
    delhiveryWarehouseName: { type: String },
    xpressbeesWarehouseId: { type: String },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

warehouseSchema.index({ isDefault: 1 });

export const WarehouseModel = mongoose.models.Warehouse || mongoose.model<WarehouseDocument>("Warehouse", warehouseSchema);
