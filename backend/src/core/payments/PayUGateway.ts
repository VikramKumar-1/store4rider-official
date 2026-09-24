import crypto from "crypto";
import { PaymentGateway, GatewayOrderResult, VerifyPaymentResult, RefundResult } from "./PaymentGateway";
import { IOrder, IPayment } from "@store4riders/shared-types";
import { ENV } from "../config/env";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

export class PayUGateway implements PaymentGateway {
  
  async createOrder(order: IOrder, amount: number): Promise<GatewayOrderResult> {
    if (!ENV.PAYU_MERCHANT_KEY || !ENV.PAYU_SALT) {
      throw new AppError("PayU credentials are not configured", 500);
    }
    const key = ENV.PAYU_MERCHANT_KEY;
    const salt = ENV.PAYU_SALT;
    
    // Generate a unique transaction ID
    const txnid = `txn_${Date.now()}`;
    const productInfo = "Store4Riders Order";
    const firstName = order.shippingAddress?.fullName?.split(" ")[0] || "Customer";
    const email = "customer@example.com"; // Normally fetched from User record
    
    // PayU Hash formula: sha512(key|txnid|amount|productinfo|firstname|email|||||||||||salt)
    const hashString = `${key}|${txnid}|${amount}|${productInfo}|${firstName}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    // In a real flow, you return these params so the frontend can submit a form to PayU's URL
    return {
      gatewayOrderId: txnid, // Using txnid as the gateway order ID for PayU
      gatewayResponse: {
        key,
        txnid,
        amount,
        productinfo: productInfo,
        firstname: firstName,
        email,
        hash,
        surl: `${ENV.NEXT_PUBLIC_API_URL}/api/v1/orders/webhook/payu/success`,
        furl: `${ENV.NEXT_PUBLIC_API_URL}/api/v1/orders/webhook/payu/failure`,
      }
    };
  }

  async verifyPayment(payment: IPayment, verificationData: any): Promise<VerifyPaymentResult> {
    if (!ENV.PAYU_MERCHANT_KEY || !ENV.PAYU_SALT) {
      throw new AppError("PayU credentials are not configured", 500);
    }
    const salt = ENV.PAYU_SALT;
    const key = ENV.PAYU_MERCHANT_KEY;
    
    // PayU reverse hash verification
    // Hash format: sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const { status, txnid, amount, productinfo, firstname, email, hash } = verificationData;

    const hashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const generatedHash = crypto.createHash("sha512").update(hashString).digest("hex");

    try {
      if (!crypto.timingSafeEqual(Buffer.from(generatedHash, 'utf8'), Buffer.from(hash, 'utf8'))) {
        return { success: false, message: "Invalid PayU signature" };
      }
    } catch (e) {
      return { success: false, message: "Invalid PayU signature length" };
    }

    // CRITICAL SECURITY: Verify the amount paid matches the amount in our database!
    // PayU sends amount as a string, e.g. "5000.00"
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
    const status = params.get("status");
    const txnid = params.get("txnid");
    const amount = params.get("amount");
    const productinfo = params.get("productinfo");
    const firstname = params.get("firstname");
    const email = params.get("email");
    const hash = params.get("hash");
    const mihpayid = params.get("mihpayid");

    if (!hash || !txnid) {
      throw new AppError("Invalid PayU webhook payload", 400);
    }

    if (!ENV.PAYU_MERCHANT_KEY || !ENV.PAYU_SALT) {
      throw new AppError("PayU credentials are not configured", 500);
    }
    
    const salt = ENV.PAYU_SALT;
    const key = ENV.PAYU_MERCHANT_KEY;

    // Webhook hash validation is identical to redirect validation in PayU
    const hashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const generatedHash = crypto.createHash("sha512").update(hashString).digest("hex");

    try {
      if (!crypto.timingSafeEqual(Buffer.from(generatedHash, 'utf8'), Buffer.from(hash, 'utf8'))) {
        throw new AppError("Invalid PayU webhook signature", 400);
      }
    } catch (e) {
      throw new AppError("Invalid PayU webhook signature length", 400);
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

      const payuUrl = ENV.NODE_ENV === "production" 
        ? "https://info.payu.in/merchant/postservice.php?form=2"
        : "https://test.payu.in/merchant/postservice.php?form=2";

      const response = await fetch(payuUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
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

      const payuUrl = ENV.NODE_ENV === "production" 
        ? "https://info.payu.in/merchant/postservice.php?form=2"
        : "https://test.payu.in/merchant/postservice.php?form=2";

      const response = await fetch(payuUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      return await response.json();
    } catch (error: any) {
      logger.error("PayU Status Error", { error: error.message });
      throw new AppError("Failed to fetch PayU payment status", 500);
    }
  }
}
