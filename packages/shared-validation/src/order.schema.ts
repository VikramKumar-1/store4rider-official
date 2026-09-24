import { z } from "zod";

export const createOrderSchema = z.object({
  shippingAddressId: z.string(),
  paymentMethod: z.enum(["cod", "payu", "ccavenue", "snapmint", "upi"]),
  couponCode: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().min(1),
  })).optional(),
});

export const verifyPaymentSchema = z.object({
  gatewayOrderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
