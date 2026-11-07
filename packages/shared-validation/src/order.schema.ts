import { z } from "zod";

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

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
  customerGstin: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || val.trim() === "" || GSTIN_REGEX.test(val.trim().toUpperCase()),
      { message: "Invalid 15-digit GSTIN format (e.g. 27AAPCS1234F1Z5)" }
    ),
  businessName: z.string().nullable().optional(),
}).refine(data => data.shippingAddressId || data.shippingAddress, {
  message: "Either shippingAddressId or shippingAddress is required",
  path: ["shippingAddressId"]
}).refine(data => {
  if (data.customerGstin && data.customerGstin.trim() !== "") {
    return Boolean(data.businessName && data.businessName.trim() !== "");
  }
  return true;
}, {
  message: "Company / Business Name is required when providing a GSTIN",
  path: ["businessName"]
});

export const verifyPaymentSchema = z.object({
  gatewayOrderId: z.string(),
  paymentId: z.string().optional().default(""),
  signature: z.string().optional().default(""),
  paymentData: z.any().optional(),
  tezResponse: z.any().optional(),
  utr: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
