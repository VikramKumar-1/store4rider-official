import { z } from "zod";

export const createOrderSchema = z.object({
  shippingAddressId: z.string().optional(),
  shippingAddress: z.object({
    fullName: z.string().min(1, "Full name is required"),
    phone: z.string().min(1, "Phone is required"),
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(1, "Pincode is required"),
    country: z.string().min(1, "Country is required"),
  }).optional(),
  guestEmail: z.string().email("Invalid email format").optional(),
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
}).refine(data => data.shippingAddressId || data.shippingAddress, {
  message: "Either shippingAddressId or shippingAddress is required",
  path: ["shippingAddressId"]
});

export const verifyPaymentSchema = z.object({
  gatewayOrderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
