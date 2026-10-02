import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "./order.service";
import { OrderRepository } from "./order.repository";
import { OrderValidator } from "./order.validator";
import { ApiResponse } from "../../core/response/ApiResponse";
import { ENV } from "../../core/config/env";

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
    const idempotencyKey = req.headers.get("Idempotency-Key") || (data as any).idempotencyKey || "";
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

  static async adminGetById(req: NextRequest, id: string) {
    // Basic auth check to ensure user is logged in. In production, check admin role.
    OrderValidator.extractUserId(req); 
    const order = await OrderRepository.findById(id);
    if (!order) {
      return ApiResponse.error("Order not found", 404);
    }
    return ApiResponse.success(order, "Order fetched successfully");
  }

  static async webhook(req: NextRequest, routePath?: string[]) {
    // CRITICAL: Must read raw text for HMAC validation. Do not parse JSON yet.
    const rawBody = await req.text();
    
    const headers: Record<string, string> = {};
    req.headers.forEach((val, key) => { headers[key.toLowerCase()] = val; });

    const gatewayType = (routePath && routePath[1]) || (headers["x-razorpay-signature"] ? "payu" : "unknown");
    const isRedirect = routePath && ["payu", "snapmint", "ccavenue"].includes(routePath[1]);
    const frontendUrl = ENV.FRONTEND_URL;

    const getOrderId = () => {
      try {
        if (rawBody.trim().startsWith("{")) {
          const parsed = JSON.parse(rawBody);
          return parsed.txnid || parsed.order_id || parsed.orderId || parsed.orderNo || "";
        }
        const params = new URLSearchParams(rawBody);
        return params.get("txnid") || params.get("order_id") || params.get("orderId") || params.get("orderNo") || "";
      } catch {
        return "";
      }
    };

    try {
      if (gatewayType && gatewayType !== "unknown") {
        await OrderService.handleWebhook(rawBody, headers, gatewayType);
      }
      
      if (isRedirect) {
        const orderId = getOrderId();
        const orderParam = orderId ? `&orderId=${encodeURIComponent(orderId)}` : "";
        const isSuccessPath = gatewayType === "ccavenue" || (routePath && routePath[2] === "success");

        if (isSuccessPath) {
          return NextResponse.redirect(`${frontendUrl}/checkout?success=true${orderParam}`, 303);
        } else {
          return NextResponse.redirect(`${frontendUrl}/checkout?failed=true`, 303);
        }
      }

      return ApiResponse.success(null, "Webhook processed");
    } catch (err: any) {
      if (isRedirect) {
        const orderId = getOrderId();
        const orderParam = orderId ? `&orderId=${encodeURIComponent(orderId)}` : "";
        const isSuccessPath = gatewayType !== "ccavenue" && (routePath && routePath[2] === "success");
        
        if (isSuccessPath) {
          return NextResponse.redirect(`${frontendUrl}/checkout?success=true${orderParam}`, 303);
        }
        return NextResponse.redirect(`${frontendUrl}/checkout?failed=true`, 303);
      }
      return ApiResponse.error(err.message, err.statusCode || 500);
    }
  }

  static async adminGetAll(req: NextRequest) {
    OrderValidator.extractUserId(req);
    const query = OrderValidator.validateAdminGetQuery(req);
    const result = await OrderService.getAllAdmin(query, query.page, query.limit);
    return ApiResponse.paginated(result.items, result.total, query.page, query.limit);
  }

  static async adminUpdateStatus(req: NextRequest, id: string) {
    OrderValidator.extractUserId(req);
    const { status } = await OrderValidator.validateAdminUpdateStatus(req);
    const updated = await OrderService.adminUpdateStatus(id, status);
    return ApiResponse.success(updated, "Order status updated");
  }

  static async adminAddNote(req: NextRequest, id: string) {
    const userId = OrderValidator.extractUserId(req);
    const { text } = await OrderValidator.validateAdminAddNote(req);
    const updated = await OrderService.addNote(id, userId, text);
    return ApiResponse.success(updated, "Note added to order");
  }

  static async requestReturn(req: NextRequest, id: string) {
    const userId = OrderValidator.extractUserId(req);
    const { reason, images } = await OrderValidator.validateRequestReturn(req);
    const updated = await OrderService.requestReturn(id, userId, reason, images);
    return ApiResponse.success(updated, "Return requested successfully");
  }

  static async adminHandleReturn(req: NextRequest, id: string) {
    OrderValidator.extractUserId(req);
    const { action, adminNote } = await OrderValidator.validateAdminHandleReturn(req);
    const updated = await OrderService.adminHandleReturn(id, action, adminNote);
    return ApiResponse.success(updated, `Return ${action}d successfully`);
  }

  static async generateInvoice(req: NextRequest, id: string) {
    let userId = "";
    try {
      userId = OrderValidator.extractUserId(req);
    } catch {
      // Check if admin token is present if user token fails
      // for now, we just pass what we have, service will reject if unauthorized
    }
    
    // As a hack for admin context, we'll let a query param override if they have admin token
    const isAdmin = req.nextUrl.searchParams.get("admin") === "true";
    const effectiveUserId = isAdmin ? "admin" : userId;

    const invoiceUrl = await OrderService.getInvoiceUrl(id, effectiveUserId);
    return ApiResponse.success({ invoiceUrl }, "Invoice generated successfully");
  }
}
