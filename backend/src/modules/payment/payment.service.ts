import { PaymentRepository } from "./payment.repository";
import { OrderService } from "../order/order.service";
import { AppError } from "../../core/errors/AppError";

export class PaymentService {
  
  static async processWebhook(gateway: string, rawBody: string, signature: string, headers: Record<string, string>) {
    // We delegate the business logic of order fulfillment via webhook to the OrderService,
    // which internally uses PaymentGatewayFactory and transitions both Payment and Order.
    
    // Check if gateway is valid
    const validGateways = ["payu", "ccavenue", "snapmint"];
    if (!validGateways.includes(gateway)) {
      throw new AppError(`Invalid gateway specified in webhook URL: ${gateway}`, 400);
    }
    
    // The OrderService currently handles the heavy lifting of atomic transitions and emails
    // We pass the actual gateway
    await OrderService.handleWebhook(rawBody, { ...headers, "x-gateway-source": gateway }, gateway);
  }

  static async getPaymentStatus(paymentId: string) {
    const payment = await PaymentRepository.findById(paymentId);
    if (!payment) throw new AppError("Payment not found", 404);
    
    return {
      id: payment._id,
      status: payment.status,
      gatewayOrderId: payment.gatewayOrderId,
      amount: payment.amount,
      method: payment.method
    };
  }
}
