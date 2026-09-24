export type PaymentStatus = "created" | "pending" | "captured" | "failed" | "refunded" | "partially_refunded";
export type PaymentGatewayType = "payu" | "ccavenue" | "snapmint";
export type PaymentMethodType = "cod" | "payu" | "ccavenue" | "snapmint" | "upi";


export interface IRefund {
  id?: string;
  refundId: string; // gateway refund ID
  amount: number;
  status: string;
  createdAt: Date;
}

export interface IPayment {
  id?: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  method: PaymentMethodType;
  gateway: PaymentGatewayType;
  refunds: IRefund[];
  webhookEvents: string[]; // event_ids for deduplication
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}
