import { z } from "zod";

export const cartItemSchema = z.object({
  id: z.string().nullable().optional(),
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().nullable().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  product: z.any().optional(),
});

export const updateCartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().nullable().optional(),
  quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
});

export const removeCartItemSchema = z
  .object({
    productId: z.string().optional(),
    variantId: z.string().nullable().optional(),
    itemId: z.string().nullable().optional(),
  })
  .refine((data) => Boolean(data.productId || data.itemId), {
    message: "Either productId or itemId is required",
  });

export const syncCartSchema = z.object({
  items: z.array(cartItemSchema).default([]),
});
