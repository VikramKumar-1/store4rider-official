import { PaymentMethodType } from "./payment.types";

export type IOrderStatus = "pending_payment" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "failed" | "refunded" | "return_requested" | "return_approved" | "returned" | "packed" | "return_picked";

export interface IOrderItem {
  id?: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface IOrderPricing {
  subtotal: number;
  discount: number;
  couponCode?: string;
  couponDiscount: number;
  tax: number;
  taxRate: number;
  shipping: number;
  total: number;
  codAmountToCollect?: number;
  codPartialPaymentAmount?: number;
}

export interface IOrderAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  street?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IOrderNote {
  text: string;
  author: string;
  timestamp: Date;
}

export interface IOrder {
  id?: string;
  orderNumber: string;
  userId?: string;
  guestEmail?: string;
  status: IOrderStatus;
  items: IOrderItem[];
  pricing: IOrderPricing;
  shippingAddress: IOrderAddress;
  paymentMethod: PaymentMethodType;
  gatewayOrderId?: string;
  paymentId?: string;
  paymentSignature?: string;
  idempotencyKey?: string;
  notes?: IOrderNote[];
  createdAt: Date;
  updatedAt: Date;
}
