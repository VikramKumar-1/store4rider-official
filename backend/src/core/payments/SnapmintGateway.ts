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
      throw new AppError("Snapmint credentials are not configured in backend/.env", 400);
    }

    const orderId = String((order as any)._id || order.id || order.orderNumber);

    // Snapmint checksum: md5(merchantId + orderId + amount + secret)
    const hashString = `${merchantId}${orderId}${amount}${secret}`;
    const checksum = crypto.createHash('md5').update(hashString).digest('hex');

    const apiBase = (ENV.API_URL || ENV.NEXT_PUBLIC_API_URL || ENV.FRONTEND_URL || "").replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
    if (!apiBase) {
      throw new AppError("API_URL or FRONTEND_URL is not configured. Snapmint callback URLs cannot be generated.", 500);
    }

    return {
      gatewayOrderId: orderId,
      gatewayResponse: {
        merchant_id: merchantId,
        order_id: orderId,
        order_value: amount,
        checksum: checksum,
        success_url: `${apiBase}/api/v1/orders/webhook/snapmint/success`,
        failed_url: `${apiBase}/api/v1/orders/webhook/snapmint/failure`,
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
    const secret = ENV.SNAPMINT_SECRET;
    if (!secret) {
      throw new AppError("Snapmint credentials are not configured", 500);
    }

    let parsed: any = {};
    if (typeof body === "string") {
      try {
        if (body.trim().startsWith("{")) {
          parsed = JSON.parse(body);
        } else {
          const params = new URLSearchParams(body);
          parsed = Object.fromEntries(params.entries());
        }
      } catch (e) {
        throw new AppError("Failed to parse Snapmint webhook body", 400);
      }
    } else {
      parsed = body;
    }

    const { status, order_id, id, checksum, amount } = parsed;

    if (!order_id || !status || !id || !checksum) {
      throw new AppError("Invalid webhook payload", 400);
    }

    const hashString = `${order_id}${status}${id}${secret}`;
    const generatedChecksum = crypto.createHash('md5').update(hashString).digest('hex');

    if (generatedChecksum !== checksum) {
      throw new AppError("Invalid Snapmint signature", 400);
    }

    return {
      event: status === "success" ? "payment.captured" : "payment.failed",
      gatewayOrderId: order_id,
      id: id,
      payload: { id: id, amount: amount ? Number(amount) : 0 }
    };
  }

  async initiateRefund(payment: IPayment, amount?: number): Promise<RefundResult> {
    throw new AppError("Snapmint refund API requires bearer token integration", 501);
  }

  async getPaymentStatus(gatewayOrderId: string): Promise<any> {
    throw new AppError("Snapmint verification API not fully implemented", 501);
  }
}
