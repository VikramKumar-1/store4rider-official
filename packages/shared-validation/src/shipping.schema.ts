import { z } from "zod";

export const createShipmentSchema = z.object({
  body: z.object({
    orderId: z.string({
      required_error: "Order ID is required",
    }),
    provider: z.enum(["shiprocket", "delhivery", "xpressbees"], {
      required_error: "Valid shipping provider is required",
    }),
    length: z.number().min(0.1, "Length must be greater than 0"),
    breadth: z.number().min(0.1, "Breadth must be greater than 0"),
    height: z.number().min(0.1, "Height must be greater than 0"),
    weight: z.number().min(0.01, "Weight must be greater than 0"),
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
      "ready_to_ship",
      "picked_up",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "rto_initiated",
      "rto_delivered",
      "cancelled"
    ], {
      required_error: "Valid status is required",
    }),
  }),
});
