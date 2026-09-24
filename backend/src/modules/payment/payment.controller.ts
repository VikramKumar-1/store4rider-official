import { NextRequest } from "next/server";
import { PaymentService } from "./payment.service";
import { PaymentValidator } from "./payment.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

export class PaymentController {
  
  static async handleWebhook(req: NextRequest, { params }: { params: { gateway: string } }) {
    const gateway = params.gateway;
    const signature = req.headers.get("x-payu-signature") || req.headers.get("x-ccavenue-signature") || "";
    
    // Read raw body for validation
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((val, key) => { headers[key.toLowerCase()] = val; });

    try {
      await PaymentService.processWebhook(gateway, rawBody, "", headers);
      return ApiResponse.success(null, "Webhook processed successfully");
    } catch (err: any) {
      return ApiResponse.error(err.message, err.statusCode || 500);
    }
  }

  static async getPaymentStatus(req: NextRequest, { params }: { params: { id: string } }) {
    const paymentId = params.id;
    try {
      const status = await PaymentService.getPaymentStatus(paymentId);
      return ApiResponse.success(status, "Payment status fetched");
    } catch (err: any) {
      return ApiResponse.error(err.message, err.statusCode || 500);
    }
  }
}
