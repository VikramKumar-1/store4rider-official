import crypto from "crypto";
import { PaymentGateway, GatewayOrderResult, VerifyPaymentResult, RefundResult } from "./PaymentGateway";
import { IOrder, IPayment } from "@store4riders/shared-types";
import { ENV } from "../config/env";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

export class CCavenueGateway implements PaymentGateway {
  
  private encrypt(plainText: string, workingKey: string): string {
    const m = crypto.createHash('md5');
    m.update(workingKey);
    const key = m.digest();
    const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let encoded = cipher.update(plainText, 'utf8', 'hex');
    encoded += cipher.final('hex');
    return encoded;
  }

  private decrypt(encText: string, workingKey: string): string {
    const m = crypto.createHash('md5');
    m.update(workingKey);
    const key = m.digest();
    const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decoded = decipher.update(encText, 'hex', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
  }

  async createOrder(order: IOrder, amount: number): Promise<GatewayOrderResult> {
    if (!ENV.CCAVENUE_MERCHANT_ID || !ENV.CCAVENUE_ACCESS_CODE || !ENV.CCAVENUE_WORKING_KEY) {
      throw new AppError("CCAvenue credentials are not configured", 500);
    }
    const merchantId = ENV.CCAVENUE_MERCHANT_ID;
    const accessCode = ENV.CCAVENUE_ACCESS_CODE;
    const workingKey = ENV.CCAVENUE_WORKING_KEY;

    const orderId = String((order as any)._id || order.id || order.orderNumber);
    
    const redirectUrl = `${ENV.NEXT_PUBLIC_API_URL}/api/v1/orders/webhook/ccavenue`;
    const cancelUrl = `${ENV.NEXT_PUBLIC_API_URL}/api/v1/orders/webhook/ccavenue`;
    
    const merchantData = `merchant_id=${merchantId}&order_id=${orderId}&currency=INR&amount=${amount}&redirect_url=${redirectUrl}&cancel_url=${cancelUrl}`;
    
    const encryptedData = this.encrypt(merchantData, workingKey);

    return {
      gatewayOrderId: orderId,
      gatewayResponse: {
        access_code: accessCode,
        encRequest: encryptedData,
      }
    };
  }

  async verifyPayment(payment: IPayment, verificationData: any): Promise<VerifyPaymentResult> {
    if (!ENV.CCAVENUE_WORKING_KEY) {
      throw new AppError("CCAvenue credentials are not configured", 500);
    }
    const { encResp } = verificationData;
    const workingKey = ENV.CCAVENUE_WORKING_KEY;
    
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
      throw new AppError("Invalid CCAvenue webhook payload", 400);
    }
    
    if (!ENV.CCAVENUE_WORKING_KEY) {
      throw new AppError("CCAvenue credentials are not configured", 500);
    }
    
    const workingKey = ENV.CCAVENUE_WORKING_KEY;
    
    try {
      const decryptedData = this.decrypt(encResp, workingKey);
      const decParams = new URLSearchParams(decryptedData);
      
      const orderStatus = decParams.get("order_status");
      const orderId = decParams.get("order_id") || decParams.get("order_no");
      const trackingId = decParams.get("tracking_id");
      const amount = decParams.get("amount") || "0";
      
      if (!orderId) {
        throw new AppError("Missing order_id in CCAvenue webhook", 400);
      }
      
      const eventName = orderStatus === "Success" ? "payment.captured" : "payment.failed";
      
      return {
        event: eventName,
        gatewayOrderId: orderId,
        id: headers["x-ccavenue-event-id"] || trackingId || `evt_${Date.now()}`,
        payload: {
          id: trackingId,
          amount: parseFloat(amount)
        }
      };
    } catch (err) {
      throw new AppError("Failed to decrypt CCAvenue webhook payload", 400);
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

      const ccavUrl = ENV.NODE_ENV === "production"
        ? "https://api.ccavenue.com/apis/servlet/DoWebTrans"
        : "https://apitest.ccavenue.com/apis/servlet/DoWebTrans";

      const response = await fetch(ccavUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
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

      const ccavUrl = ENV.NODE_ENV === "production"
        ? "https://api.ccavenue.com/apis/servlet/DoWebTrans"
        : "https://apitest.ccavenue.com/apis/servlet/DoWebTrans";

      const response = await fetch(ccavUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
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
