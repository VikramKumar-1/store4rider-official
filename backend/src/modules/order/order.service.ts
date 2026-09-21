import crypto from "crypto";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import { OrderRepository } from "./order.repository";
import { ProductRepository } from "../product/product.repository";
import { CartService } from "../cart/cart.service";
import { UserRepository } from "../user/user.repository";
import { IOrder } from "@store4riders/shared-types";
import { AppError } from "../../core/errors/AppError";
import { addEmailJob } from "../../core/queue/email.queue";
import { logger } from "../../core/utils/logger";
import { ENV } from "../../core/config/env";

if (!ENV.RAZORPAY_KEY_ID || !ENV.RAZORPAY_KEY_SECRET) {
  logger.warn("Razorpay keys are missing. Payments will fail.");
}

let razorpay: Razorpay;
if (ENV.RAZORPAY_KEY_ID && ENV.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: ENV.RAZORPAY_KEY_ID,
      key_secret: ENV.RAZORPAY_KEY_SECRET,
    });
  } catch (error) {
    logger.warn("Razorpay SDK initialization failed. Payments will not work.");
  }
}

export class OrderService {
  
  static async createOrder(userId: string, shippingAddressId: string) {
    if (!ENV.RAZORPAY_KEY_ID || !ENV.RAZORPAY_KEY_SECRET) {
      throw new AppError("Payment gateway is not configured", 500);
    }

    const cart = await CartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    // ACID Transaction for creating order securely
    const session = await mongoose.startSession();
    let resultData;

    try {
      await session.withTransaction(async () => {
        const orderData: Partial<IOrder> = {
          userId,
          shippingAddressId,
          status: "pending",
          totalAmount: cart.summary.total,
          items: cart.items.map((item: any) => ({
            id: crypto.randomUUID(),
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price || 0,
          })),
        };

        const order = await OrderRepository.create(orderData, session);
        const orderIdStr = String((order as any)._id || (order as any).id || "");
        
        let razorpayOrder;
        try {
          razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.totalAmount * 100), // in paise
            currency: "INR",
            receipt: orderIdStr,
          });
        } catch (err) {
          logger.error("Razorpay Error:", err);
          throw new AppError("Failed to initiate payment gateway", 502);
        }

        await OrderRepository.updateStatus(orderIdStr, "pending", {
          razorpayOrderId: razorpayOrder.id,
        }, session);

        resultData = { orderId: orderIdStr, razorpayOrderId: razorpayOrder.id, amount: order.totalAmount };
      });
    } finally {
      await session.endSession();
    }

    return resultData;
  }

  static async verifyPayment(userId: string, razorpayOrderId: string, paymentId: string, signature: string) {
    const secret = ENV.RAZORPAY_KEY_SECRET;
    if (!secret) throw new AppError("Payment gateway is not configured", 500);
    
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${razorpayOrderId}|${paymentId}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      throw new AppError("Invalid payment signature", 400);
    }

    // Handled mainly by webhook, but as fallback we process here
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await OrderRepository.findByRazorpayOrderId(razorpayOrderId, session);
        if (order && order.status !== "paid") {
          await OrderRepository.updateStatus(String((order as any)._id || order.id), "paid", { paymentId, paymentSignature: signature }, session);
          
          // Atomically decrement stock in MongoDB
          if (order.items && order.items.length > 0) {
            for (const itm of order.items) {
              await ProductRepository.decrementStock(itm.productId, itm.quantity, session);
              await ProductRepository.incrementSalesCount(itm.productId, itm.quantity, session);
            }
          }

          const user = await UserRepository.findById(userId);
          if (user) {
            await addEmailJob(user.email, "Order Confirmed", `Your payment of ${paymentId} was successful.`);
          }
        }
      });
    } finally {
      await session.endSession();
    }
  }

  static async handleWebhook(rawBody: string, signature: string) {
    const secret = ENV.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      logger.error("Razorpay webhook secret is missing");
      throw new AppError("Webhook configuration error", 500);
    }

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBody);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      logger.warn("Invalid webhook signature received");
      throw new AppError("Invalid signature", 400);
    }

    const event = JSON.parse(rawBody);
    const paymentEntity = event.payload?.payment?.entity;
    
    if (!paymentEntity || !paymentEntity.order_id) {
      logger.warn("Webhook received without order_id");
      return;
    }

    const razorpayOrderId = paymentEntity.order_id;
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const order = await OrderRepository.findByRazorpayOrderId(razorpayOrderId, session);
        if (!order) {
          logger.warn(`Order not found for Razorpay Order ID: ${razorpayOrderId}`);
          return;
        }

        const orderIdStr = String((order as any)._id || order.id);

        if (event.event === "payment.captured") {
          if (order.status === "paid") return; // Idempotency
          await OrderRepository.updateStatus(orderIdStr, "paid", { paymentId: paymentEntity.id }, session);
          
          // Atomically decrement stock in MongoDB
          if (order.items && order.items.length > 0) {
            for (const itm of order.items) {
              await ProductRepository.decrementStock(itm.productId, itm.quantity, session);
              await ProductRepository.incrementSalesCount(itm.productId, itm.quantity, session);
            }
          }

          const user = await UserRepository.findById(order.userId);
          if (user) {
            await addEmailJob(user.email, "Order Confirmed", `Your payment was successfully captured.`);
          }
          logger.info(`Webhook successfully processed order ${orderIdStr}`);
        } 
        
        else if (event.event === "payment.failed") {
          if (order.status !== "pending") return; // Idempotency
          await OrderRepository.updateStatus(orderIdStr, "failed", null, session);
          const user = await UserRepository.findById(order.userId);
          if (user) {
            await addEmailJob(user.email, "Payment Failed", `Your payment attempt failed. Please try again.`);
          }
          logger.info(`Webhook processed failure for order ${orderIdStr}`);
        }
        
        else if (event.event === "refund.processed") {
          if (order.status === "refunded") return; // Idempotency
          await OrderRepository.updateStatus(orderIdStr, "refunded", null, session);
          const user = await UserRepository.findById(order.userId);
          if (user) {
            await addEmailJob(user.email, "Refund Processed", `Your refund of INR ${paymentEntity.amount / 100} has been processed.`);
          }
          logger.info(`Webhook processed refund for order ${orderIdStr}`);
        }
      });
    } finally {
      await session.endSession();
    }
  }
}
