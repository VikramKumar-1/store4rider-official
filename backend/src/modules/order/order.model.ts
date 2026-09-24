import mongoose, { Schema } from "mongoose";
import { IOrder, IOrderItem, IOrderPricing, IOrderAddress } from "@store4riders/shared-types";

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  variantId: { type: String },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
});

const pricingSchema = new Schema<IOrderPricing>(
  {
    subtotal: { type: Number, required: true },
    discount: { type: Number, required: true },
    couponCode: { type: String, required: false },
    couponDiscount: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },
    codAmountToCollect: { type: Number, required: false },
    codPartialPaymentAmount: { type: Number, required: false },
  },
  { _id: false }
);

const orderAddressSchema = new Schema<IOrderAddress>({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, required: true },
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    status: { type: String, required: true, default: "pending_payment" },
    items: [orderItemSchema],
    pricing: { type: pricingSchema, required: true },
    shippingAddress: { type: orderAddressSchema, required: true },
    paymentMethod: { type: String, required: true },
    gatewayOrderId: { type: String },
    paymentId: { type: String },
    paymentSignature: { type: String },
    idempotencyKey: { type: String, sparse: true },
  },
  { timestamps: true }
);

export const OrderModel = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
