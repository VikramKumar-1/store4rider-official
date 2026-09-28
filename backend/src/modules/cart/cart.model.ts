import mongoose, { Schema } from "mongoose";
import { ICart, ICartItem, ICartSummary } from "@store4riders/shared-types";

const cartItemSchema = new Schema<ICartItem>({
  id: { type: String },
  productId: { type: String, required: true },
  variantId: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  product: { type: Schema.Types.Mixed },
});

const cartSummarySchema = new Schema<ICartSummary>({
  subtotal: { type: Number, required: true, default: 0 },
  tax: { type: Number, required: true, default: 0 },
  shipping: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true, default: 0 },
});

const cartSchema = new Schema<ICart>(
  {
    userId: { type: String, required: true, unique: true },
    items: [cartItemSchema],
    summary: { type: cartSummarySchema, required: true, default: () => ({ subtotal: 0, tax: 0, shipping: 0, total: 0 }) },
  },
  { timestamps: true }
);

export const CartModel = mongoose.models.Cart || mongoose.model<ICart>("Cart", cartSchema);
