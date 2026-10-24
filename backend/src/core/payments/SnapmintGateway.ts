import crypto from "crypto";
import { PaymentGateway, GatewayOrderResult, VerifyPaymentResult, RefundResult } from "./PaymentGateway";
import { IOrder, IPayment } from "@store4riders/shared-types";
import { ENV } from "../config/env";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

export class SnapmintGateway implements PaymentGateway {
  
  private getCredentials() {
    const merchantKey = (ENV.SNAPMINT_MERCHANT_ID || process.env.SNAPMINT_MERCHANT_ID || "").trim();
    const merchantToken = (ENV.SNAPMINT_SECRET || process.env.SNAPMINT_SECRET || "").trim();

    const isPlaceholder = (val: string) => !val || val.startsWith("your_") || val.includes("placeholder");
    if (isPlaceholder(merchantKey) || isPlaceholder(merchantToken)) {
      throw new AppError("Snapmint credentials in backend/.env are missing or unconfigured.", 400);
    }

    const isLive = (ENV.SNAPMINT_MODE || process.env.SNAPMINT_MODE || "test").trim().toLowerCase() === "live";
    const apiBaseUrl = isLive ? "https://api.snapmint.com" : "https://qa.snapmint.com";
    const checkoutUrl = isLive ? "https://checkout.snapmint.com/pay" : "https://qa.snapmint.com/pay";

    return { merchantKey, merchantToken, isLive, apiBaseUrl, checkoutUrl };
  }

  /**
   * Generates a tamper-proof checkout form payload with mandatory RBI/KYC underwriting fields.
   */
  async createOrder(order: IOrder, amount: number): Promise<GatewayOrderResult> {
    const { merchantKey, merchantToken, checkoutUrl } = this.getCredentials();

    const orderId = String(order.orderNumber || (order as any)._id || order.id);
    const formattedAmount = Number(amount).toFixed(2);

    const shipping = order.shippingAddress;
    const billing = (order as any).billingAddress || shipping;

    const firstName = (shipping?.fullName?.split(" ")[0] || "Valued").trim();
    const lastName = (shipping?.fullName?.split(" ").slice(1).join(" ") || "Customer").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const email = ((order as any).userEmail || order.guestEmail || `${firstName.toLowerCase()}@store4riders.com`).trim();
    
    // Mobile number is mandatory for Snapmint credit scoring & OTP verification
    const rawPhone = (shipping?.phone || (order as any).phone || "").replace(/\D/g, "");
    const phoneNumber = rawPhone.slice(-10);
    if (!phoneNumber || phoneNumber.length !== 10) {
      throw new AppError("A valid 10-digit Indian mobile number is mandatory for Snapmint Cardless EMI verification.", 400);
    }

    // SHA-512 Checksum Formula: merchant_key | order_id | order_value | full_name | email | merchant_token
    const hashString = `${merchantKey}|${orderId}|${formattedAmount}|${fullName}|${email}|${merchantToken}`;
    const checksumHash = crypto.createHash("sha512").update(hashString).digest("hex");

    const rawApiUrl = (ENV.API_URL || ENV.NEXT_PUBLIC_API_URL || ENV.FRONTEND_URL || "").trim();
    if (!rawApiUrl) {
      throw new AppError("API_URL or FRONTEND_URL is not configured for Snapmint callbacks.", 500);
    }
    const cleanApiBase = rawApiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

    // Prepare line items for risk underwriting and subvention evaluation
    const products = (order.items || []).map((item) => ({
      sku: item.sku,
      name: (item.name || "Product").slice(0, 100),
      quantity: item.quantity,
      unit_price: Number(item.unitPrice || (item as any).price || 0).toFixed(2),
    }));

    const snapmintPayload: Record<string, any> = {
      merchant_key: merchantKey,
      order_id: orderId,
      order_value: formattedAmount,
      full_name: fullName,
      email: email,
      phone_number: phoneNumber,
      
      // Billing KYC Details
      billing_first_name: firstName,
      billing_last_name: lastName,
      billing_address_line1: (billing?.street || billing?.addressLine1 || "Billing Address").slice(0, 120),
      billing_city: (billing?.city || "City").slice(0, 50),
      billing_state: (billing?.state || "State").slice(0, 50),
      billing_zipcode: (billing?.pincode || "000000").slice(0, 10),
      
      // Shipping Details
      shipping_first_name: firstName,
      shipping_last_name: lastName,
      shipping_address_line1: (shipping?.street || shipping?.addressLine1 || "Shipping Address").slice(0, 120),
      shipping_city: (shipping?.city || "City").slice(0, 50),
      shipping_state: (shipping?.state || "State").slice(0, 50),
      shipping_zipcode: (shipping?.pincode || "000000").slice(0, 10),
      
      products: JSON.stringify(products),
      checksum_hash: checksumHash,
      success_url: `${cleanApiBase}/api/v1/orders/webhook/snapmint/success`,
      failed_url: `${cleanApiBase}/api/v1/orders/webhook/snapmint/failure`,
      actionUrl: checkoutUrl,
    };

    return {
      gatewayOrderId: orderId,
      gatewayResponse: snapmintPayload,
    };
  }

  /**
   * Cryptographically verifies payment callback data using constant-time comparison.
   */
  async verifyPayment(payment: IPayment, verificationData: any): Promise<VerifyPaymentResult> {
    const { merchantKey, merchantToken } = this.getCredentials();

    const {
      status,
      order_id,
      order_value,
      amount,
      full_name,
      email,
      checksum_hash,
      id,
    } = verificationData;

    if (!checksum_hash || !order_id || !status) {
      return { success: false, message: "Missing required Snapmint verification parameters" };
    }

    // Check for amount tampering
    const reportedAmount = parseFloat(order_value || amount || "0");
    if (reportedAmount > 0 && Math.abs(reportedAmount - payment.amount) > 0.01) {
      logger.error("Snapmint amount mismatch detected", {
        orderId: order_id,
        reportedAmount,
        expectedAmount: payment.amount,
      });
      return { success: false, message: "Amount mismatch detected" };
    }

    // Response Hash Formula: merchant_token | status | order_id | order_value | full_name | email | merchant_key
    const formattedAmount = Number(order_value || amount || payment.amount).toFixed(2);
    const hashString = `${merchantToken}|${status}|${order_id}|${formattedAmount}|${full_name || ""}|${email || ""}|${merchantKey}`;
    const expectedHash = crypto.createHash("sha512").update(hashString).digest("hex");

    // Timing-safe comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expectedHash, "utf8");
    const receivedBuf = Buffer.from(String(checksum_hash), "utf8");

    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      logger.error("Snapmint signature mismatch", {
        orderId: order_id,
        receivedChecksum: checksum_hash,
      });
      return { success: false, message: "Invalid Snapmint signature" };
    }

    const isSuccess = String(status).toLowerCase() === "success" || String(status).toLowerCase() === "completed";

    return {
      success: isSuccess,
      gatewayPaymentId: id ? String(id) : undefined,
      message: isSuccess ? "Payment verified successfully" : `Payment rejected with status: ${status}`,
    };
  }

  /**
   * Handles asynchronous webhooks sent directly from Snapmint servers.
   */
  async handleWebhook(headers: any, body: any): Promise<any> {
    const { merchantKey, merchantToken } = this.getCredentials();

    let parsed: any = {};
    if (typeof body === "string") {
      try {
        if (body.trim().startsWith("{")) {
          parsed = JSON.parse(body);
        } else {
          const params = new URLSearchParams(body);
          parsed = Object.fromEntries(params.entries());
        }
      } catch (err: any) {
        throw new AppError("Malformed Snapmint webhook payload", 400);
      }
    } else {
      parsed = body;
    }

    const { status, order_id, order_value, full_name, email, checksum_hash, id } = parsed;

    if (!order_id || !status || !checksum_hash) {
      throw new AppError("Invalid Snapmint webhook payload structure", 400);
    }

    // Validate Checksum
    const formattedAmount = Number(order_value || 0).toFixed(2);
    const hashString = `${merchantToken}|${status}|${order_id}|${formattedAmount}|${full_name || ""}|${email || ""}|${merchantKey}`;
    const expectedHash = crypto.createHash("sha512").update(hashString).digest("hex");

    const expectedBuf = Buffer.from(expectedHash, "utf8");
    const receivedBuf = Buffer.from(String(checksum_hash), "utf8");

    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      throw new AppError("Invalid Snapmint signature", 400);
    }

    const isSuccessful = String(status).toLowerCase() === "success" || String(status).toLowerCase() === "completed";

    return {
      event: isSuccessful ? "payment.captured" : "payment.failed",
      gatewayOrderId: String(order_id),
      id: id ? String(id) : `snap_${Date.now()}`,
      payload: {
        id: id ? String(id) : undefined,
        amount: parseFloat(order_value || "0"),
        status: status,
      },
    };
  }

  /**
   * Queries Snapmint Server-to-Server API for live transaction status.
   * Crucial for fallback reconciliation when the user closes their browser prematurely.
   */
  async getPaymentStatus(gatewayOrderId: string): Promise<any> {
    const { merchantKey, merchantToken, apiBaseUrl } = this.getCredentials();

    try {
      const response = await fetch(`${apiBaseUrl}/v1/public/online_orders/${encodeURIComponent(gatewayOrderId)}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "X-Merchant-Key": merchantKey,
          "Authorization": `Bearer ${merchantToken}`,
        },
        signal: AbortSignal.timeout(10000), // 10s strict timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Snapmint S2S order status query failed", { status: response.status, errorText });
        return { status: "unknown", error: errorText };
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      logger.error("Snapmint S2S status check network exception", { error: error.message });
      return { status: "network_error", error: error.message };
    }
  }

  /**
   * Initiates full or partial refunds directly via Snapmint S2S Refund API.
   */
  async initiateRefund(payment: IPayment, amount?: number): Promise<RefundResult> {
    const { merchantKey, merchantToken, apiBaseUrl } = this.getCredentials();

    const refundAmount = amount !== undefined ? amount : payment.amount;
    const orderId = payment.gatewayOrderId;

    if (!orderId) {
      throw new AppError("Gateway Order ID is required for Snapmint refund", 400);
    }

    const merchantRefundId = `ref_${orderId}_${Date.now()}`;

    try {
      const response = await fetch(`${apiBaseUrl}/v1/public/online_orders/${encodeURIComponent(orderId)}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Merchant-Key": merchantKey,
          "Authorization": `Bearer ${merchantToken}`,
        },
        body: JSON.stringify({
          refund_amount: Number(refundAmount).toFixed(2),
          refund_reference_id: merchantRefundId,
          reason: "Customer cancellation / Order return",
        }),
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json();

      if (response.ok && (result.success || result.status === "refunded" || result.status === "success")) {
        return {
          success: true,
          refundId: result.refund_id || merchantRefundId,
          message: result.message || "Snapmint refund processed successfully",
        };
      }

      logger.error("Snapmint refund rejected by gateway", { result });
      return {
        success: false,
        message: result.message || result.error || "Snapmint refund declined",
      };
    } catch (error: any) {
      logger.error("Snapmint refund network error", { error: error.message });
      return {
        success: false,
        message: error.message || "Failed to communicate with Snapmint refund service",
      };
    }
  }
}
