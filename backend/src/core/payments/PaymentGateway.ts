import { IOrder, IPayment } from "@store4riders/shared-types";

export interface GatewayOrderResult {
  gatewayOrderId: string;
  gatewayResponse: any;
}

export interface VerifyPaymentResult {
  success: boolean;
  gatewayPaymentId?: string;
  message?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  message?: string;
}

export interface PaymentGateway {
  /**
   * Creates an order on the payment gateway
   */
  createOrder(order: IOrder, amount: number): Promise<GatewayOrderResult>;

  /**
   * Verifies the payment signature/status coming from frontend or webhook
   */
  verifyPayment(payment: IPayment, verificationData: any): Promise<VerifyPaymentResult>;

  /**
   * Handles incoming webhooks from the gateway
   */
  handleWebhook(headers: any, body: any): Promise<any>;

  /**
   * Initiates a full or partial refund
   */
  initiateRefund(payment: IPayment, amount?: number): Promise<RefundResult>;

  /**
   * Gets the current real-time status from the gateway
   */
  getPaymentStatus(gatewayOrderId: string): Promise<any>;
}
