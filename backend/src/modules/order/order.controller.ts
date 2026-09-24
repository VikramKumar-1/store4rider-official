import { NextRequest } from "next/server";
import { OrderService } from "./order.service";
import { OrderRepository } from "./order.repository";
import { OrderValidator } from "./order.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

/**
 * @class OrderController
 * @description Minimal HTTP controller for Orders and Payments.
 * Responsibilities:
 * 1. Extract payloads via OrderValidator.
 * 2. Delegate to OrderService.
 * 3. Return standardized API responses.
 */
export class OrderController {
  
  static async create(req: NextRequest) {
    const { userId, data } = await OrderValidator.validateCreate(req);
    const idempotencyKey = req.headers.get("Idempotency-Key") || "";
    const result = await OrderService.createOrder(userId, { ...data, idempotencyKey });
    return ApiResponse.success(result, "Order created", 201);
  }

  static async verify(req: NextRequest) {
    const { userId, data } = await OrderValidator.validateVerify(req);
    await OrderService.verifyPayment(
      userId,
      data.gatewayOrderId,
      data.paymentId,
      data.signature
    );
    return ApiResponse.success(null, "Payment verified successfully");
  }

  static async myOrders(req: NextRequest) {
    const userId = OrderValidator.extractUserId(req);
    const orders = await OrderRepository.findByUserId(userId);
    return ApiResponse.success(orders, "Orders fetched successfully");
  }

  static async getById(req: NextRequest, id: string) {
    const userId = OrderValidator.extractUserId(req);
    const order = await OrderRepository.findById(id);
    if (!order || order.userId !== userId) {
      return ApiResponse.error("Order not found", 404);
    }
    return ApiResponse.success(order, "Order fetched successfully");
  }

  static async webhook(req: NextRequest) {
    // CRITICAL: Must read raw text for HMAC validation. Do not parse JSON yet.
    const rawBody = await req.text();
    
    const headers: Record<string, string> = {};
    req.headers.forEach((val, key) => { headers[key.toLowerCase()] = val; });

    try {
      // In this catch-all webhook, we rely on the body to deduce the type, or we pass a generic string
      await OrderService.handleWebhook(rawBody, headers, "unknown");
      return ApiResponse.success(null, "Webhook processed");
    } catch (err: any) {
      return ApiResponse.error(err.message, err.statusCode || 500);
    }
  }
}
