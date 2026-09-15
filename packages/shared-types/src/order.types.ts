export type IOrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "failed" | "refunded";
export interface IOrderItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}
export interface IOrder {
  id: string;
  userId: string;
  status: IOrderStatus;
  items: IOrderItem[];
  totalAmount: number;
  shippingAddressId: string;
  razorpayOrderId?: string;
  paymentId?: string;
  paymentSignature?: string;
  createdAt: Date;
  updatedAt: Date;
}
