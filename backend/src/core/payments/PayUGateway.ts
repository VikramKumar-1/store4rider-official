import crypto from "crypto";
import { PaymentGateway, GatewayOrderResult, VerifyPaymentResult, RefundResult } from "./PaymentGateway";
import { IOrder, IPayment } from "@store4riders/shared-types";
import { ENV } from "../config/env";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

export class PayUGateway implements PaymentGateway {
  
  async createOrder(order: IOrder, amount: number): Promise<GatewayOrderResult> {
    const key = (ENV.PAYU_MERCHANT_KEY || process.env.PAYU_MERCHANT_KEY || "").trim();
    const salt = (ENV.PAYU_SALT || process.env.PAYU_SALT || "").trim();

    if (!key || !salt) {
      throw new AppError("PayU / UPI credentials are not configured in backend/.env", 400);
    }
    
    // PayU txnid MUST be strictly <= 25 characters.
    // "T" (1) + Date.now() (13) + 4 random hex chars = 18 chars total.
    const txnid = `T${Date.now()}${crypto.randomBytes(2).toString("hex")}`;
    const productInfo = "Store4Riders Order";
    const firstName = (order.shippingAddress?.fullName?.split(" ")[0] || "Customer").trim();
    const email = ((order as any).userEmail || order.guestEmail || `${firstName.toLowerCase()}@store4riders.com`).trim();
    
    // PayU expects amount formatted with 2 decimal places (e.g. 5002.26)
    const formattedAmount = Number(amount).toFixed(2);
    const phone = order.shippingAddress?.phone?.replace(/\D/g, "").slice(-10) || "";

    // PayU Hash formula: sha512(key|txnid|amount|productinfo|firstname|email|||||||||||salt)
    const hashString = `${key}|${txnid}|${formattedAmount}|${productInfo}|${firstName}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const rawApiUrl = (ENV.API_URL || ENV.NEXT_PUBLIC_API_URL || ENV.FRONTEND_URL || "").trim();
    if (!rawApiUrl) {
      throw new AppError("API_URL or FRONTEND_URL is not configured. PayU surl/furl cannot be generated.", 500);
    }
    const cleanApiBase = rawApiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

    const payuPayload: Record<string, string> = {
      key,
      txnid,
      amount: formattedAmount,
      productinfo: productInfo,
      firstname: firstName,
      email,
      phone,
      hash,
      surl: `${cleanApiBase}/api/v1/orders/webhook/payu/success`,
      furl: `${cleanApiBase}/api/v1/orders/webhook/payu/failure`,
    };

    let redirectUrl: string | undefined = undefined;
    try {
      const payuAction = (ENV.PAYU_MODE === "live")
        ? "https://secure.payu.in/_payment"
        : "https://test.payu.in/_payment";

      const params = new URLSearchParams(payuPayload);
      const res = await fetch(payuAction, {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: params.toString(),
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });

      const rawLocation = res.headers.get("location");
      if (rawLocation) {
        // Fix PayU sandbox bug where Location header contains a literal space or is missing the hash routing
        redirectUrl = rawLocation
          .replace(/\/webcheckoutpro\/(%20|\s)?/i, "/webcheckoutpro/#/");
        logger.info(`[PayUGateway] Cleaned redirect URL generated: ${redirectUrl.slice(0, 60)}...`);
      }
    } catch (err: any) {
      logger.warn(`[PayUGateway] Direct redirect resolution fallback: ${err.message}`);
    }

    return {
      gatewayOrderId: txnid,
      gatewayResponse: {
        ...payuPayload,
        ...(redirectUrl ? { redirectUrl } : {}),
      }
    };
  }

  async verifyPayment(payment: IPayment, verificationData: any): Promise<VerifyPaymentResult> {
    const key = verificationData.key || process.env.PAYU_MERCHANT_KEY || ENV.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_SALT || ENV.PAYU_SALT;

    if (!key || !salt) {
      throw new AppError("PayU credentials are not configured", 500);
    }
    
    // PayU reverse hash verification
    // Standard format: sha512(SALT|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const { status, txnid, amount, productinfo, firstname, email, hash, additionalCharges } = verificationData;

    const baseElements = [
      salt,
      status || "",
      verificationData.udf10 || "",
      verificationData.udf9 || "",
      verificationData.udf8 || "",
      verificationData.udf7 || "",
      verificationData.udf6 || "",
      verificationData.udf5 || "",
      verificationData.udf4 || "",
      verificationData.udf3 || "",
      verificationData.udf2 || "",
      verificationData.udf1 || "",
      email || "",
      firstname || "",
      productinfo || "",
      amount || "",
      txnid || "",
      key || "",
    ];

    const hashString = baseElements.join("|");
    const generatedHash = crypto.createHash("sha512").update(hashString).digest("hex").toLowerCase();
    
    let isValid = (generatedHash === (hash || "").toLowerCase());
    
    if (!isValid && additionalCharges) {
      const hashWithCharges = [additionalCharges, ...baseElements].join("|");
      const generatedWithCharges = crypto.createHash("sha512").update(hashWithCharges).digest("hex").toLowerCase();
      isValid = (generatedWithCharges === (hash || "").toLowerCase());
    }

    if (!isValid) {
      logger.warn(`PayU signature mismatch: generated ${generatedHash} vs received ${hash}`);
      return { success: false, message: "Invalid PayU signature" };
    }

    // CRITICAL SECURITY: Verify the amount paid matches the amount in our database!
    const paidAmount = parseFloat(amount);
    if (paidAmount < payment.amount) {
      logger.error(`Amount tampering detected! Expected ${payment.amount}, got ${paidAmount}`);
      return { success: false, message: "Amount mismatch detected" };
    }

    return {
      success: status === "success",
      gatewayPaymentId: verificationData.mihpayid,
    };
  }

  async handleWebhook(headers: any, rawBody: string): Promise<any> {
    const params = new URLSearchParams(rawBody);
    
    // PayU sends webhook as form data
    const status = params.get("status") || "";
    const txnid = params.get("txnid") || "";
    const amount = params.get("amount") || "";
    const productinfo = params.get("productinfo") || "";
    const firstname = params.get("firstname") || "";
    const email = params.get("email") || "";
    const hash = params.get("hash") || "";
    const mihpayid = params.get("mihpayid") || "";
    const additionalCharges = params.get("additionalCharges");
    const key = params.get("key") || process.env.PAYU_MERCHANT_KEY || ENV.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_SALT || ENV.PAYU_SALT;

    if (!hash || !txnid) {
      throw new AppError("Invalid PayU webhook payload", 400);
    }

    if (!key || !salt) {
      throw new AppError("PayU credentials are not configured", 500);
    }

    // PayU reverse hash verification
    const baseElements = [
      salt,
      status,
      params.get("udf10") || "",
      params.get("udf9") || "",
      params.get("udf8") || "",
      params.get("udf7") || "",
      params.get("udf6") || "",
      params.get("udf5") || "",
      params.get("udf4") || "",
      params.get("udf3") || "",
      params.get("udf2") || "",
      params.get("udf1") || "",
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      key,
    ];

    const hashString = baseElements.join("|");
    const generatedHash = crypto.createHash("sha512").update(hashString).digest("hex").toLowerCase();
    
    let isValid = (generatedHash === hash.toLowerCase());

    if (!isValid && additionalCharges) {
      const hashWithCharges = [additionalCharges, ...baseElements].join("|");
      const generatedWithCharges = crypto.createHash("sha512").update(hashWithCharges).digest("hex").toLowerCase();
      isValid = (generatedWithCharges === hash.toLowerCase());
    }

    if (!isValid) {
      logger.warn(`PayU webhook signature mismatch: generated ${generatedHash} vs received ${hash}`);
      // In live mode, strictly reject invalid signatures. In test mode, log and allow.
      if (ENV.PAYU_MODE === "live") {
        throw new AppError("Invalid PayU webhook signature", 400);
      }
    }

    // Normalize to standard event format used by order.service.ts
    const eventName = status === "success" ? "payment.captured" : "payment.failed";
    
    return {
      event: eventName,
      gatewayOrderId: txnid,
      id: headers["x-payu-event-id"] || mihpayid || `evt_${Date.now()}`,
      payload: {
        id: mihpayid,
        amount: parseFloat(amount || "0")
      }
    };
  }

  async initiateRefund(payment: IPayment, amount?: number): Promise<RefundResult> {
    try {
      if (!ENV.PAYU_MERCHANT_KEY || !ENV.PAYU_SALT) {
        throw new AppError("PayU credentials are not configured", 500);
      }
      const key = ENV.PAYU_MERCHANT_KEY;
      const salt = ENV.PAYU_SALT;
      const refundAmount = amount || payment.amount;
      
      const command = "cancel_refund_transaction";
      const var1 = payment.gatewayPaymentId; // PayU's mihpayid
      
      if (!var1) {
         throw new AppError("Gateway Payment ID missing for refund", 400);
      }

      // Hash: sha512(key|command|var1|salt)
      const hashString = `${key}|${command}|${var1}|${salt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      const params = new URLSearchParams();
      params.append("key", key);
      params.append("command", command);
      params.append("hash", hash);
      params.append("var1", var1);
      params.append("var2", String(refundAmount));
      params.append("var3", payment.gatewayOrderId);

      const payuUrl = (ENV.PAYU_MODE === "live")
        ? "https://info.payu.in/merchant/postservice.php?form=2"
        : "https://test.payu.in/merchant/postservice.php?form=2";

      const response = await fetch(payuUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json();

      if (result.status === 1 || result.status === "1") {
         return {
           success: true,
           refundId: result.request_id || `payu_ref_${Date.now()}`,
           message: result.msg || "Refund successful",
         };
      }

      return {
        success: false,
        message: result.msg || "Refund failed at gateway",
      };
    } catch (error: any) {
      logger.error("PayU Refund Error", { error: error.message });
      return { success: false, message: error.message || "PayU Refund API Error" };
    }
  }

  async getPaymentStatus(gatewayOrderId: string): Promise<any> {
    try {
      if (!ENV.PAYU_MERCHANT_KEY || !ENV.PAYU_SALT) {
        throw new AppError("PayU credentials are not configured", 500);
      }
      const key = ENV.PAYU_MERCHANT_KEY;
      const salt = ENV.PAYU_SALT;
      const command = "verify_payment";
      const var1 = gatewayOrderId;

      const hashString = `${key}|${command}|${var1}|${salt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      const params = new URLSearchParams();
      params.append("key", key);
      params.append("command", command);
      params.append("hash", hash);
      params.append("var1", var1);

      const payuUrl = (ENV.PAYU_MODE === "live")
        ? "https://info.payu.in/merchant/postservice.php?form=2"
        : "https://test.payu.in/merchant/postservice.php?form=2";

      const response = await fetch(payuUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        signal: AbortSignal.timeout(15000),
      });

      return await response.json();
    } catch (error: any) {
      logger.error("PayU Status Error", { error: error.message });
      throw new AppError("Failed to fetch PayU payment status", 500);
    }
  }
}
