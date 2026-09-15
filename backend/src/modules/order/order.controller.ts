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
    const result = await OrderService.createOrder(userId, data.shippingAddressId);
    return ApiResponse.success(result, "Order created", 201);
  }

  static async verify(req: NextRequest) {
    const { userId, data } = await OrderValidator.validateVerify(req);
    await OrderService.verifyPayment(
      userId,
      data.razorpayOrderId,
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
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return ApiResponse.error("Missing Razorpay signature", 400);
    }
    
    // CRITICAL: Must read raw text for HMAC validation. Do not parse JSON yet.
    const rawBody = await req.text();
    
    try {
      await OrderService.handleWebhook(rawBody, signature);
      return ApiResponse.success(null, "Webhook processed");
    } catch (err: any) {
      return ApiResponse.error(err.message, err.statusCode || 500);
    }
  }
}
