import crypto from "crypto";
import { PaymentGateway, GatewayOrderResult, VerifyPaymentResult, RefundResult } from "./PaymentGateway";
import { IOrder, IPayment } from "@store4riders/shared-types";
import { ENV } from "../config/env";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

/**
 * Snapmint Checkout 3.0 — Server-to-Server Integration
 *
 * Flow:
 *   1. Backend POSTs JSON to `apis.snapmint.com/api/pub/carts` (prod)
 *      or `sandboxapi.snapmint.com/api/pub/carts` (sandbox).
 *   2. Snapmint returns `{ url, status, redirect_url }`.
 *   3. Frontend redirects the user to `url` (pay.snapmint.com checkout page).
 *   4. After payment, Snapmint redirects user to merchantConfirmationUrl / merchantFailureUrl.
 *
 * Auth: `merchantPassword` field (= Merchant Token). No checksum_hash needed.
 * Min order value: ₹10,000 (Snapmint minimum for cardless EMI).
 */
export class SnapmintGateway implements PaymentGateway {

  private getCredentials() {
    // SNAPMINT_MERCHANT_ID = Merchant Key (e.g. nLRGPKDo) — used as merchantId in the old naming
    const merchantKey = (ENV.SNAPMINT_MERCHANT_ID || process.env.SNAPMINT_MERCHANT_ID || "").trim();
    // SNAPMINT_SECRET = Merchant Token (e.g. WiG-6A3P) — used as merchantPassword in V3
    const merchantToken = (ENV.SNAPMINT_SECRET || process.env.SNAPMINT_SECRET || "").trim();
    // SNAPMINT_MID = Numeric MID (e.g. 2025) — the actual merchantId for V3 S2S API
    const mid = (ENV.SNAPMINT_MID || process.env.SNAPMINT_MID || "").trim();

    const isPlaceholder = (val: string) => !val || val.startsWith("your_") || val.includes("placeholder");
    if (isPlaceholder(mid) || isPlaceholder(merchantToken)) {
      throw new AppError("Snapmint credentials (SNAPMINT_MID, SNAPMINT_SECRET) in backend/.env are missing or unconfigured.", 400);
    }

    const isLive = (ENV.SNAPMINT_MODE || process.env.SNAPMINT_MODE || "test").trim().toLowerCase() === "live";

    // Checkout 3.0 S2S endpoints
    const s2sApiUrl = isLive
      ? "https://apis.snapmint.com/api/pub/carts"
      : "https://apis.snapmint.com/api/pub/carts"; // Sandbox (sandboxapi) is currently offline, use prod for test MID

    return { merchantKey, merchantToken, mid, isLive, s2sApiUrl };
  }

  /**
   * Creates a Snapmint Checkout 3.0 session via S2S API.
   * Returns the checkout redirect URL for the frontend.
   */
  async createOrder(order: IOrder, amount: number): Promise<GatewayOrderResult> {
    const { merchantToken, mid, s2sApiUrl } = this.getCredentials();

    // Proactive minimum order value check for Snapmint merchant tier (dynamic from ENV/Settings, default ₹25,000)
    const configuredMin = Number(ENV.SNAPMINT_MIN_ORDER_VALUE || process.env.SNAPMINT_MIN_ORDER_VALUE) || 25000;
    if (amount < configuredMin) {
      throw new AppError(
        `Snapmint Cardless EMI is applicable on orders above ₹${configuredMin.toLocaleString("en-IN")} (Current order: ₹${Math.round(amount)}). Please choose another payment method or add more items to your cart.`,
        400
      );
    }

    const orderId = String(order.orderNumber || (order as any)._id || order.id);

    const shipping = order.shippingAddress;

    const firstName = (shipping?.fullName?.split(" ")[0] || "Valued").trim();
    const lastName = (shipping?.fullName?.split(" ").slice(1).join(" ") || "Customer").trim();
    const email = ((order as any).userEmail || order.guestEmail || "").trim();

    // Mobile number is mandatory for Snapmint credit scoring & OTP verification
    const rawPhone = (shipping?.phone || (order as any).phone || "").replace(/\D/g, "");
    const phoneNumber = rawPhone.slice(-10);
    if (!phoneNumber || phoneNumber.length !== 10) {
      throw new AppError("A valid 10-digit Indian mobile number is mandatory for Snapmint Cardless EMI verification.", 400);
    }

    const rawApiUrl = (ENV.API_URL || ENV.NEXT_PUBLIC_API_URL || ENV.FRONTEND_URL || "").trim();
    if (!rawApiUrl) {
      throw new AppError("API_URL or FRONTEND_URL is not configured for Snapmint callbacks.", 500);
    }
    const cleanApiBase = rawApiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

    // Prepare line items for Snapmint risk underwriting
    const products = (order.items || []).map((item) => ({
      sku: item.sku || "SKU",
      name: (item.name || "Product").slice(0, 100),
      quantity: String(item.quantity),
      unitPrice: String(Number(item.unitPrice || (item as any).price || 0)),
      itemUrl: `${cleanApiBase}/products/${(item as any).slug || item.sku || "product"}`,
      imageUrl: (item as any).image || "",
    }));

    // Checkout 3.0 S2S payload (camelCase JSON, merchantPassword auth, NO checksum)
    const snapmintPayload = {
      merchantId: mid,
      merchantPassword: merchantToken,
      merchantOrderId: orderId,
      orderValue: String(Math.round(amount)),
      mobile: phoneNumber,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
      email: email || undefined,
      ip: "0.0.0.0",
      deviceType: "online",
      merchantConfirmationUrl: `${cleanApiBase}/api/v1/orders/webhook/snapmint/success`,
      merchantFailureUrl: `${cleanApiBase}/api/v1/orders/webhook/snapmint/failure`,
      products,
    };

    logger.info("Snapmint V3 S2S createOrder request", {
      orderId,
      amount,
      mid,
      s2sApiUrl,
    });

    try {
      const response = await fetch(s2sApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(snapmintPayload),
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json();

      if (response.ok && result.status === "Success" && result.url) {
        logger.info("Snapmint V3 S2S session created", {
          orderId,
          checkoutUrl: result.url,
        });

        return {
          gatewayOrderId: orderId,
          gatewayResponse: {
            redirectUrl: result.url,
            snapmintOrderUrl: result.redirect_url || result.url,
          },
        };
      }

      // Handle known error codes
      const errorCode = result.code || "";
      const errorMsg = result.message || "Snapmint checkout creation failed";

      if (errorCode === "ORDER_VALUE_LT_MIN") {
        throw new AppError(
          `Order value ₹${amount} is below Snapmint's minimum. EMI purchases are applicable on orders above ₹${configuredMin.toLocaleString("en-IN")}.`,
          400
        );
      }

      if (errorCode === "DUPLICATE_MERCHANT_OID") {
        throw new AppError(
          "This order has already been submitted to Snapmint. Please use a unique order ID.",
          409
        );
      }

      logger.error("Snapmint V3 S2S createOrder rejected", { result, orderId });
      throw new AppError(`Snapmint: ${errorMsg}`, response.status >= 500 ? 502 : 400);

    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error("Snapmint V3 S2S createOrder network error", { error: error.message, orderId });
      throw new AppError(`Snapmint service unavailable: ${error.message}`, 502);
    }
  }

  /**
   * Verifies payment callback from Snapmint redirect (merchantConfirmationUrl / merchantFailureUrl).
   * Checkout 3.0 redirects include query params: id, message, status, token.
   */
  async verifyPayment(payment: IPayment, verificationData: any): Promise<VerifyPaymentResult> {
    const { status, id, message, order_id, token } = verificationData;

    const statusVal = status || verificationData.order_status || "";
    if (!statusVal) {
      return { success: false, message: "Missing Snapmint payment status" };
    }

    const rawStatus = String(statusVal).toLowerCase();
    const rawMessage = String(message || "").toLowerCase();

    const isSuccess = rawStatus === "success" ||
                      rawStatus === "completed" ||
                      rawStatus === "authorized" ||
                      rawMessage === "success" ||
                      rawMessage === "authorized";

    const reportedAmount = verificationData.orderValue || verificationData.order_value || verificationData.amount;
    if (reportedAmount !== undefined && reportedAmount !== null && reportedAmount !== "") {
      const parsedAmount = Number(reportedAmount);
      if (!isNaN(parsedAmount) && Math.round(parsedAmount * 100) < Math.round(payment.amount * 100)) {
        logger.error(`Snapmint amount mismatch: expected ${payment.amount}, got ${parsedAmount}`);
        return { success: false, message: "Amount mismatch detected" };
      }
    }

    return {
      success: isSuccess,
      gatewayPaymentId: id ? String(id) : token ? String(token) : undefined,
      message: isSuccess
        ? "Payment verified successfully"
        : `Payment rejected with status: ${status} — ${message || ""}`,
    };
  }

  /**
   * Handles asynchronous webhooks from Snapmint.
   * Checkout 3.0 callbacks are form-urlencoded POST or query params on redirect.
   */
  async handleWebhook(headers: any, body: any): Promise<any> {
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

    const { status, id, message, amount } = parsed;
    const resolvedOrderId =
      parsed.merchantOrderId ||
      parsed.merchant_order_id ||
      parsed.merchant_oid ||
      parsed.order_id ||
      parsed.orderId ||
      parsed.orderNumber ||
      "";

    const resolvedPaymentId = id ? String(id) : parsed.token ? String(parsed.token) : undefined;

    if (!resolvedOrderId && !resolvedPaymentId) {
      throw new AppError("Invalid Snapmint webhook payload: missing order_id or id", 400);
    }

    const statusVal = parsed.order_status || parsed.status || parsed.payment_status || "";
    const rawStatus = String(statusVal).toLowerCase();
    const rawMessage = String(message || "").toLowerCase();

    const isSuccessful =
      rawStatus === "success" ||
      rawStatus === "completed" ||
      rawStatus === "authorized" ||
      rawMessage === "success" ||
      rawMessage === "authorized";

    return {
      event: isSuccessful ? "payment.captured" : "payment.failed",
      gatewayOrderId: resolvedOrderId ? String(resolvedOrderId) : `snap_${resolvedPaymentId}`,
      id: resolvedPaymentId || `snap_${Date.now()}`,
      payload: {
        id: resolvedPaymentId,
        amount: parsed.orderValue || parsed.order_value || amount ? Number(parsed.orderValue || parsed.order_value || amount) : 0,
        status: status,
        message: message,
      },
    };
  }

  /**
   * Queries Snapmint Server-to-Server API for live transaction status.
   */
  async getPaymentStatus(gatewayOrderId: string): Promise<any> {
    const { merchantToken, mid } = this.getCredentials();

    try {
      const response = await fetch(`https://apis.snapmint.com/api/pub/carts/${encodeURIComponent(gatewayOrderId)}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${merchantToken}`,
        },
        signal: AbortSignal.timeout(10000),
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
   * Initiates full or partial refunds via Snapmint S2S Refund API.
   */
  async initiateRefund(payment: IPayment, amount?: number): Promise<RefundResult> {
    const { merchantToken, mid } = this.getCredentials();

    const refundAmount = amount !== undefined ? amount : payment.amount;
    const orderId = payment.gatewayOrderId;

    if (!orderId) {
      throw new AppError("Gateway Order ID is required for Snapmint refund", 400);
    }

    const merchantRefundId = `ref_${orderId}_${Date.now()}`;

    try {
      const response = await fetch(`https://apis.snapmint.com/api/pub/carts/${encodeURIComponent(orderId)}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${merchantToken}`,
        },
        body: JSON.stringify({
          merchantId: mid,
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
