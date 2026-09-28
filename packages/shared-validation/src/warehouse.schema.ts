import { z } from "zod";

export const createWarehouseSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Warehouse name is required"),
    warehouseCode: z.string().min(1, "Warehouse code is required"),
    contactPerson: z.string().min(1, "Contact person is required"),
    phone: z.string().min(10, "Phone number is invalid"),
    email: z.string().email("Invalid email address"),
    addressLine1: z.string().min(1, "Address Line 1 is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().default("India"),
    pincode: z.string().min(6).max(6, "Pincode must be 6 digits"),
    shiprocketLocationId: z.string().optional(),
    delhiveryWarehouseName: z.string().optional(),
    xpressbeesWarehouseId: z.string().optional(),
    isActive: z.boolean().default(true),
    isDefault: z.boolean().default(false),
  }),
});

export const updateWarehouseSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Warehouse ID is required"),
  }),
  body: z.object({
    name: z.string().optional(),
    warehouseCode: z.string().optional(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().min(6).max(6).optional(),
    shiprocketLocationId: z.string().optional(),
    delhiveryWarehouseName: z.string().optional(),
    xpressbeesWarehouseId: z.string().optional(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  }),
});
