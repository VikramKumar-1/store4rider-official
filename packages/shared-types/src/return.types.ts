export type ReturnStatus = 
  | "requested"
  | "pickup_assigned"
  | "picked_up"
  | "reached_facility"
  | "inwarded_for_qc"
  | "qc_failed"
  | "refunded"
  | "partially_refunded"
  | "cancelled";

export type RefundMethod = "original_source" | "upi" | "bank_transfer" | "wallet";

export interface IReturnItem {
  productId: string;
  variantId?: string;
  quantity: number;
  reason: string;
}

export interface IReturn {
  id?: string;
  _id?: string;
  orderId: string;
  userId: string;
  shipmentId?: string;
  
  status: ReturnStatus;
  items: IReturnItem[];
  
  refundMethod: RefundMethod;
  refundAmount: number;
  actualRefundedAmount?: number;
  
  upiId?: string;
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };

  inwardedAt?: Date | string;
  qcCompletedAt?: Date | string;
  qcNotes?: string;
  
  courierDispute?: boolean;
  disputeStatus?: "pending" | "claim_raised" | "claim_approved" | "claim_rejected";

  createdAt?: Date | string;
  updatedAt?: Date | string;
}
