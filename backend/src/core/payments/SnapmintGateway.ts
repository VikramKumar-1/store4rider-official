import crypto from "crypto";
import { PaymentGateway, GatewayOrderResult, VerifyPaymentResult, RefundResult } from "./PaymentGateway";
import { IOrder, IPayment } from "@store4riders/shared-types";
import { ENV } from "../config/env";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

export class SnapmintGateway implements PaymentGateway {
  
  async createOrder(order: IOrder, amount: number): Promise<GatewayOrderResult> {
    const merchantId = ENV.SNAPMINT_MERCHANT_ID;
    const secret = ENV.SNAPMINT_SECRET;
    
    if (!merchantId || !secret) {
      throw new AppError("Snapmint credentials are not configured", 500);
    }

    const orderId = String((order as any)._id || order.id || order.orderNumber);

    // Snapmint checksum: md5(merchantId + orderId + amount + secret)
    const hashString = `${merchantId}${orderId}${amount}${secret}`;
    const checksum = crypto.createHash('md5').update(hashString).digest('hex');

    return {
      gatewayOrderId: orderId,
      gatewayResponse: {
        merchant_id: merchantId,
        order_id: orderId,
        order_value: amount,
        checksum: checksum,
        success_url: `${ENV.NEXT_PUBLIC_API_URL}/api/v1/orders/webhook/snapmint/success`,
        failed_url: `${ENV.NEXT_PUBLIC_API_URL}/api/v1/orders/webhook/snapmint/failure`,
      }
    };
  }

  async verifyPayment(payment: IPayment, verificationData: any): Promise<VerifyPaymentResult> {
    const { status, order_id, id, checksum } = verificationData;
    const secret = ENV.SNAPMINT_SECRET;

    if (!secret) {
      throw new AppError("Snapmint credentials are not configured", 500);
    }

    // Verify reverse checksum
    const hashString = `${order_id}${status}${id}${secret}`;
    const generatedChecksum = crypto.createHash('md5').update(hashString).digest('hex');

    if (generatedChecksum !== checksum) {
      return { success: false, message: "Invalid Snapmint signature" };
    }

    return {
      success: status === "success",
      gatewayPaymentId: id,
    };
  }

  async handleWebhook(headers: any, body: any): Promise<any> {
    return body;
  }

  async initiateRefund(payment: IPayment, amount?: number): Promise<RefundResult> {
    throw new AppError("Snapmint refund API requires bearer token integration", 501);
  }

  async getPaymentStatus(gatewayOrderId: string): Promise<any> {
    throw new AppError("Snapmint verification API not fully implemented", 501);
  }
}
