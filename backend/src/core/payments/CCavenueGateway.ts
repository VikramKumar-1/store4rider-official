import crypto from "crypto";
import { PaymentGateway, GatewayOrderResult, VerifyPaymentResult, RefundResult } from "./PaymentGateway";
import { IOrder, IPayment } from "@store4riders/shared-types";
import { ENV } from "../config/env";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

export class CCavenueGateway implements PaymentGateway {
  
  private encrypt(plainText: string, workingKey: string): string {
    const m = crypto.createHash("md5");
    m.update(workingKey);
    const key = m.digest();
    const iv = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
    const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
    let encoded = cipher.update(plainText, "utf8", "hex");
    encoded += cipher.final("hex");
    return encoded;
  }

  private decrypt(encText: string, workingKey: string): string {
    const m = crypto.createHash("md5");
    m.update(workingKey);
    const key = m.digest();
    const iv = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
    const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
    let decoded = decipher.update(encText, "hex", "utf8");
    decoded += decipher.final("utf8");
    return decoded;
  }

  async createOrder(order: IOrder, amount: number): Promise<GatewayOrderResult> {
    const merchantId = (ENV.CCAVENUE_MERCHANT_ID || process.env.CCAVENUE_MERCHANT_ID || "").trim();
    const accessCode = (ENV.CCAVENUE_ACCESS_CODE || process.env.CCAVENUE_ACCESS_CODE || "").trim();
    const workingKey = (ENV.CCAVENUE_WORKING_KEY || process.env.CCAVENUE_WORKING_KEY || "").trim();

    const isPlaceholder = (val: string) => !val || val.startsWith("your_") || val === "your_ccavenue_id" || val === "your_ccavenue_access_code" || val === "your_ccavenue_working_key";
    if (isPlaceholder(merchantId) || isPlaceholder(accessCode) || isPlaceholder(workingKey)) {
      throw new AppError("CCAvenue credentials in backend/.env are missing or set to placeholder values ('your_ccavenue_id'). Please update backend/.env with your real CCAvenue Merchant ID, Access Code, and Working Key.", 400);
    }

    const orderId = String(order.orderNumber || (order as any)._id || order.id || `ORD-${Date.now()}`);
    
    const rawApiUrl = (ENV.API_URL || ENV.NEXT_PUBLIC_API_URL || ENV.FRONTEND_URL || "").trim();
    if (!rawApiUrl) {
      throw new AppError("API_URL or FRONTEND_URL is not configured. CCAvenue redirect URLs cannot be generated.", 500);
    }
    const cleanApiBase = rawApiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
    
    const redirectUrl = (ENV.CCAVENUE_REDIRECT_URL || process.env.CCAVENUE_REDIRECT_URL || `${cleanApiBase}/api/v1/orders/webhook/ccavenue`).trim();
    const cancelUrl = (ENV.CCAVENUE_CANCEL_URL || process.env.CCAVENUE_CANCEL_URL || redirectUrl).trim();
    
    const formattedAmount = Number(amount).toFixed(2);

    // Extract customer billing details from shippingAddress / order
    const shipping = order.shippingAddress;
    const billingName = (shipping?.fullName || (order as any).fullName || "Valued Customer").trim().slice(0, 60);
    const billingAddress = (shipping?.street || shipping?.addressLine1 || "Address").trim().slice(0, 150);
    const billingCity = (shipping?.city || "City").trim().slice(0, 30);
    const billingState = (shipping?.state || "State").trim().slice(0, 30);
    const billingZip = (shipping?.pincode || "000000").trim().slice(0, 10);
    const billingCountry = (shipping?.country || "India").trim().slice(0, 50);
    const rawPhone = (shipping?.phone || (order as any).phone || "").replace(/\D/g, "");
    const billingTel = rawPhone.slice(-10);
    const billingEmail = ((order as any).userEmail || order.guestEmail || "").trim().slice(0, 60);

    const payload: Record<string, string> = {
      merchant_id: merchantId,
      order_id: orderId,
      currency: "INR",
      amount: formattedAmount,
      redirect_url: redirectUrl,
      cancel_url: cancelUrl,
      language: "EN",
    };

    if (billingName) payload.billing_name = billingName;
    if (billingAddress) payload.billing_address = billingAddress;
    if (billingCity) payload.billing_city = billingCity;
    if (billingState) payload.billing_state = billingState;
    if (billingZip) payload.billing_zip = billingZip;
    if (billingCountry) payload.billing_country = billingCountry;
    if (billingTel) payload.billing_tel = billingTel;
    if (billingEmail) payload.billing_email = billingEmail;

    if (billingName) payload.delivery_name = billingName;
    if (billingAddress) payload.delivery_address = billingAddress;
    if (billingCity) payload.delivery_city = billingCity;
    if (billingState) payload.delivery_state = billingState;
    if (billingZip) payload.delivery_zip = billingZip;
    if (billingCountry) payload.delivery_country = billingCountry;
    if (billingTel) payload.delivery_tel = billingTel;

    const merchantData = Object.entries(payload)
      .filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v).trim())}`)
      .join("&");

    const encryptedData = this.encrypt(merchantData, workingKey);

    const mode = (ENV.CCAVENUE_MODE || process.env.CCAVENUE_MODE || "test").trim().toLowerCase();
    const actionUrl = mode === "live"
      ? "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
      : "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction";

    return {
      gatewayOrderId: orderId,
      gatewayResponse: {
        command: "initiateTransaction",
        access_code: accessCode,
        encRequest: encryptedData,
        actionUrl,
      }
    };
  }

  async verifyPayment(payment: IPayment, verificationData: any): Promise<VerifyPaymentResult> {
    const workingKey = (ENV.CCAVENUE_WORKING_KEY || process.env.CCAVENUE_WORKING_KEY || "").trim();
    if (!workingKey) {
      throw new AppError("CCAvenue credentials are not configured", 500);
    }
    const { encResp } = verificationData;
    
    try {
      const decryptedData = this.decrypt(encResp, workingKey);
      const params = new URLSearchParams(decryptedData);
      
      const orderStatus = params.get("order_status");
      const trackingId = params.get("tracking_id");
      const paidAmountStr = params.get("amount") || "0";
      
      if (!trackingId || !orderStatus) {
        throw new AppError("Invalid CCavenue response data", 400);
      }
      
      const paidAmount = parseFloat(paidAmountStr);
      if (paidAmount < payment.amount) {
        logger.error(`CCAvenue Amount tampering detected! Expected ${payment.amount}, got ${paidAmount}`);
        return { success: false, message: "Amount mismatch detected" };
      }

      if (orderStatus === "Success") {
        return { success: true, gatewayPaymentId: trackingId };
      }
      return { success: false, message: `CCAvenue payment failed: ${orderStatus}` };
    } catch (err) {
      return { success: false, message: "Failed to decrypt CCAvenue response" };
    }
  }

  async handleWebhook(headers: any, rawBody: string): Promise<any> {
    const params = new URLSearchParams(rawBody);
    const encResp = params.get("encResp") || params.get("enc_response");
    
    if (!encResp) {
      throw new AppError("Invalid CCAvenue webhook payload: missing encResp", 400);
    }
    
    const workingKey = (ENV.CCAVENUE_WORKING_KEY || process.env.CCAVENUE_WORKING_KEY || "").trim();
    if (!workingKey) {
      throw new AppError("CCAvenue credentials are not configured", 500);
    }
    
    try {
      const decryptedData = this.decrypt(encResp, workingKey);
      const decParams = new URLSearchParams(decryptedData);
      
      const orderStatus = decParams.get("order_status");
      const orderId = decParams.get("order_id") || decParams.get("order_no");
      const trackingId = decParams.get("tracking_id") || "";
      const amount = decParams.get("amount") || "0";
      const statusMessage = decParams.get("status_message") || "";
      const bankRefNo = decParams.get("bank_ref_no") || "";
      const paymentMode = decParams.get("payment_mode") || "";
      
      if (!orderId) {
        throw new AppError("Missing order_id in CCAvenue webhook", 400);
      }
      
      const isSuccess = orderStatus === "Success";
      const eventName = isSuccess ? "payment.captured" : "payment.failed";
      
      return {
        event: eventName,
        gatewayOrderId: orderId,
        id: headers["x-ccavenue-event-id"] || trackingId || `evt_${Date.now()}`,
        payload: {
          id: trackingId,
          amount: parseFloat(amount),
          status: orderStatus,
          statusMessage,
          bankRefNo,
          paymentMode,
        }
      };
    } catch (err: any) {
      logger.error("Failed to decrypt CCAvenue webhook payload", { error: err.message });
      throw new AppError(err.message || "Failed to decrypt CCAvenue webhook payload", 400);
    }
  }

  async initiateRefund(payment: IPayment, amount?: number): Promise<RefundResult> {
    try {
      if (!ENV.CCAVENUE_MERCHANT_ID || !ENV.CCAVENUE_ACCESS_CODE || !ENV.CCAVENUE_WORKING_KEY) {
        throw new AppError("CCAvenue credentials are not configured", 500);
      }
      const merchantId = ENV.CCAVENUE_MERCHANT_ID;
      const accessCode = ENV.CCAVENUE_ACCESS_CODE;
      const workingKey = ENV.CCAVENUE_WORKING_KEY;
      
      const refundAmount = amount || payment.amount;
      const refNo = payment.gatewayPaymentId;

      if (!refNo) {
        throw new AppError("CCAvenue Tracking ID (Gateway Payment ID) missing", 400);
      }

      const refundData = {
        reference_no: refNo,
        refund_amount: refundAmount,
        refund_ref_no: `ref_${Date.now()}`
      };

      const encryptedData = this.encrypt(JSON.stringify(refundData), workingKey);
      
      const params = new URLSearchParams();
      params.append("request_type", "JSON");
      params.append("access_code", accessCode);
      params.append("command", "refundOrder");
      params.append("response_type", "JSON");
      params.append("version", "1.1");
      params.append("request_data", encryptedData);

      const ccavUrl = ENV.CCAVENUE_MODE === "live"
        ? "https://api.ccavenue.com/apis/servlet/DoWebTrans"
        : "https://apitest.ccavenue.com/apis/servlet/DoWebTrans";

      const response = await fetch(ccavUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        signal: AbortSignal.timeout(15000)
      });

      const responseText = await response.text();
      const paramsRes = new URLSearchParams(responseText);
      const encResponse = paramsRes.get("enc_response");
      const status = paramsRes.get("status");
      
      if (status === "0" && encResponse) {
        const decResp = this.decrypt(encResponse, workingKey);
        const result = JSON.parse(decResp);
        
        if (result.Refund_Order_Result?.refund_status === "0") {
          return {
            success: true,
            refundId: refundData.refund_ref_no,
            message: "Refund successful"
          };
        } else {
          return {
            success: false,
            message: result.Refund_Order_Result?.reason || "Refund failed at gateway"
          };
        }
      }

      return {
        success: false,
        message: "CCAvenue API Error or invalid response"
      };

    } catch (error: any) {
      logger.error("CCAvenue Refund Error", { error: error.message });
      return { success: false, message: error.message || "CCAvenue Refund API Error" };
    }
  }

  async getPaymentStatus(gatewayOrderId: string): Promise<any> {
    try {
      if (!ENV.CCAVENUE_MERCHANT_ID || !ENV.CCAVENUE_ACCESS_CODE || !ENV.CCAVENUE_WORKING_KEY) {
        throw new AppError("CCAvenue credentials are not configured", 500);
      }
      const merchantId = ENV.CCAVENUE_MERCHANT_ID;
      const accessCode = ENV.CCAVENUE_ACCESS_CODE;
      const workingKey = ENV.CCAVENUE_WORKING_KEY;

      const statusData = { order_no: gatewayOrderId };
      const encryptedData = this.encrypt(JSON.stringify(statusData), workingKey);

      const params = new URLSearchParams();
      params.append("request_type", "JSON");
      params.append("access_code", accessCode);
      params.append("command", "orderStatusTracker");
      params.append("response_type", "JSON");
      params.append("version", "1.1");
      params.append("request_data", encryptedData);

      const ccavUrl = ENV.CCAVENUE_MODE === "live"
        ? "https://api.ccavenue.com/apis/servlet/DoWebTrans"
        : "https://apitest.ccavenue.com/apis/servlet/DoWebTrans";

      const response = await fetch(ccavUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        signal: AbortSignal.timeout(15000)
      });

      const responseText = await response.text();
      const paramsRes = new URLSearchParams(responseText);
      const encResponse = paramsRes.get("enc_response");
      
      if (encResponse) {
         const decResp = this.decrypt(encResponse, workingKey);
         return JSON.parse(decResp);
      }
      throw new AppError("Invalid response from CCAvenue status API", 500);
    } catch (error: any) {
      logger.error("CCAvenue Status Error", { error: error.message });
      throw new AppError("Failed to fetch CCAvenue payment status", 500);
    }
  }
}
