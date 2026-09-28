import { z } from "zod";

export const cartItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  product: z.any().optional(),
});

export const updateCartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
});

export const removeCartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  itemId: z.string().optional(),
});

export const syncCartSchema = z.object({
  items: z.array(cartItemSchema).default([]),
});

