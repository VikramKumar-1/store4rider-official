import { NextRequest } from "next/server";
import { PaymentController } from "./payment.controller";
import { ApiResponse } from "../../core/response/ApiResponse";

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management and webhooks
 */
export async function paymentRouter(req: NextRequest, routePath: string) {
  const method = req.method;

  // Pattern: POST /api/v1/payments/webhook/:gateway
  if (method === "POST" && routePath.startsWith("/webhook/")) {
    const gateway = routePath.split("/")[2]; // e.g., "/webhook/payu" -> ["", "webhook", "payu"]
    if (!gateway) return ApiResponse.error("Gateway required", 400);
    return PaymentController.handleWebhook(req, { params: { gateway } });
  }

  // Pattern: GET /api/v1/payments/:id
  if (method === "GET" && routePath !== "/") {
    const id = routePath.split("/")[1];
    if (id) {
      return PaymentController.getPaymentStatus(req, { params: { id } });
    }
  }

  return ApiResponse.error("Method Not Allowed in Payment Router", 405);
}
