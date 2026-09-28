import { z } from "zod";

export const createShipmentSchema = z.object({
  body: z.object({
    orderId: z.string({
      required_error: "Order ID is required",
    }),
    provider: z.enum(["shiprocket", "delhivery", "xpressbees"], {
      required_error: "Valid shipping provider is required",
    }),
    // Only "forward" is currently implemented. "reverse" (return pickup) is not yet supported.
    // When reverse flow is built, re-add: z.enum(["forward", "reverse"])
    shipmentType: z.literal("forward").optional().default("forward"),
    length: z.number().min(0.1, "Length must be greater than 0"),
    breadth: z.number().min(0.1, "Breadth must be greater than 0"),
    height: z.number().min(0.1, "Height must be greater than 0"),
    weight: z.number().min(0.01, "Weight must be greater than 0"),
    volumetricWeight: z.number().optional(),
    chargeableWeight: z.number().optional(),
    customerShippingCharge: z.number().optional(),
    codFee: z.number().optional(),
  }),
});

export const updateShipmentStatusSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: "Shipment ID is required",
    }),
  }),
  body: z.object({
    status: z.enum([
      "pending", 
      "shipment_created",
      "awb_assigned",
      "ready_to_ship",
      "picked_up",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "ndr",
      "rto_initiated",
      "rto_in_transit",
      "rto_delivered",
      "cancelled",
      "lost",
      "damaged",
      "failed"
    ], {
      required_error: "Valid status is required",
    }),
  }),
});

export const serviceabilitySchema = z.object({
  body: z.object({
    deliveryPincode: z.string().min(6).max(6),
    weightKg: z.string().or(z.number()).transform(v => Number(v)).refine(n => n > 0, "Weight must be positive"),
    isCod: z.string().or(z.boolean()).transform(v => v === "true" || v === true),
  })
});

export const getRatesSchema = z.object({
  body: z.object({
    orderId: z.string().optional(),
    deliveryPincode: z.string().min(6).max(6).optional(),
    weightKg: z.string().or(z.number()).transform(v => Number(v)).refine(n => n > 0, "Weight must be positive"),
    isCod: z.string().or(z.boolean()).transform(v => v === "true" || v === true),
    length: z.number().optional(),
    breadth: z.number().optional(),
    height: z.number().optional()
  }).refine(data => data.orderId || data.deliveryPincode, {
    message: "Either orderId or deliveryPincode is required",
    path: ["orderId"]
  })
});
