import { z } from "zod";

export const createOrderSchema = z.object({
  shippingAddressId: z.string().min(1, "Shipping address is required"),
  paymentMethod: z.enum(["cod", "payu", "ccavenue", "snapmint", "upi"]),
  couponCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().nullable().optional(),
    quantity: z.number().min(1),
  })).optional(),
  idempotencyKey: z.string().nullable().optional(),
});

export const verifyPaymentSchema = z.object({
  gatewayOrderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
