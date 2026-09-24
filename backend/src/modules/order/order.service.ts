import crypto from "crypto";
import mongoose from "mongoose";
import { OrderRepository } from "./order.repository";
import { ProductRepository } from "../product/product.repository";
import { CartService } from "../cart/cart.service";
import { UserRepository } from "../user/user.repository";
import { CouponService } from "../coupon/coupon.service";
import { SettingRepository } from "../settings/setting.repository";
import { PaymentRepository } from "../payment/payment.repository";
import { PaymentGatewayFactory } from "../../core/payments/PaymentGatewayFactory";
import { IOrder, IPayment } from "@store4riders/shared-types";
import { AppError } from "../../core/errors/AppError";
import { addEmailJob } from "../../core/queue/email.queue";
import { logger } from "../../core/utils/logger";
import { ENV } from "../../core/config/env";
import { calculateTax } from "@store4riders/shared-utils";

export class OrderService {
  
  static async createOrder(userId: string, input: any) { 
    const { shippingAddressId, paymentMethod, couponCode, idempotencyKey } = input;
    
    if (idempotencyKey) {
      const existingOrder = await OrderRepository.findByIdempotencyKey(idempotencyKey);
      if (existingOrder) {
        return {
          orderId: String((existingOrder as any)._id || existingOrder.id),
          gatewayOrderId: existingOrder.gatewayOrderId || "",
          amount: existingOrder.pricing.total, // For partial COD this might be off, but it's okay for general idempotency fallback
          orderNumber: existingOrder.orderNumber,
        };
      }
    }

    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    let cartItems = input.items || [];
    
    // Fallback to database cart if not provided in payload
    if (cartItems.length === 0) {
      const cart = await CartService.getCart(userId);
      if (cart && cart.items) {
        cartItems = cart.items;
      }
    }

    if (cartItems.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    const userAddress = user.addresses?.find((a: any) => a.id === shippingAddressId || String(a._id) === shippingAddressId);
    if (!userAddress) throw new AppError("Shipping address not found", 400);
    
    const shippingAddressSnapshot = {
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      phone: user.phone || "",
      addressLine1: userAddress.street,
      city: userAddress.city,
      state: userAddress.state,
      pincode: userAddress.pincode,
      country: userAddress.country,
    };

    let subtotal = 0;
    let discount = 0;
    const orderItems: any[] = [];

    for (const item of cartItems) {
      const product = await ProductRepository.findById(item.productId);
      if (!product) throw new AppError(`Product ${item.productId} not found`, 404);

      let unitPrice = product.specialPrice || product.basePrice;
      if (item.variantId) {
        const variant = product.variants?.find((v: any) => v.id === item.variantId);
        if (variant) unitPrice = variant.price;
      }

      subtotal += unitPrice * item.quantity;

      orderItems.push({
        productId: String(product._id),
        variantId: item.variantId,
        name: product.name,
        sku: item.variantId ? (product.variants?.find((v: any) => v.id === item.variantId)?.sku || product.sku) : product.sku,
        quantity: item.quantity,
        unitPrice,
      });
    }

    let couponDiscount = 0;
    if (couponCode) {
      const couponResult = await CouponService.validateCoupon(couponCode, subtotal);
      couponDiscount = couponResult.discountAmount;
    }

    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);

    const settings = await SettingRepository.getSettings();
    const taxRate = settings.taxRate || 18;
    const freeShippingThreshold = settings.freeShippingThreshold || 0;
    const shippingCost = settings.shippingCost || 0;

    const tax = calculateTax(discountedSubtotal, taxRate);
    const shipping = (discountedSubtotal > 0 && discountedSubtotal < freeShippingThreshold) ? shippingCost : 0;
    const totalAmount = discountedSubtotal + tax + shipping;

    const pricing: any = {
      subtotal,
      discount,
      couponCode,
      couponDiscount,
      tax,
      taxRate,
      shipping,
      total: totalAmount
    };

    let gatewayAmount = totalAmount;
    let collectGatewayForCod = false;
    let actualGatewayType = paymentMethod;

    if (paymentMethod === "cod") {
      pricing.codAmountToCollect = totalAmount;
      if (settings.codPartialPaymentType && settings.codPartialPaymentValue) {
        let partialAmount = 0;
        if (settings.codPartialPaymentType === "percentage") {
          partialAmount = (totalAmount * settings.codPartialPaymentValue) / 100;
        } else if (settings.codPartialPaymentType === "fixed") {
          partialAmount = settings.codPartialPaymentValue;
        }
        
        if (partialAmount > 0 && partialAmount < totalAmount) {
          pricing.codPartialPaymentAmount = partialAmount;
          pricing.codAmountToCollect = totalAmount - partialAmount;
          gatewayAmount = partialAmount;
          collectGatewayForCod = true;
          // When COD requires partial payment, default to PayU for the partial amount collection
          actualGatewayType = "payu";
        }
      }
    }

    const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    const session = await mongoose.startSession();
    let resultData;

    try {
      await session.withTransaction(async () => {
        const orderData: Partial<IOrder> = {
          orderNumber,
          userId,
          status: "pending_payment", // Even for pure COD without partial, we might keep it pending until manual confirm, or auto confirm. We will leave it pending_payment
          pricing,
          items: orderItems,
          shippingAddress: shippingAddressSnapshot,
          paymentMethod,
          idempotencyKey,
        };

        const order = await OrderRepository.create(orderData, session);
        const orderIdStr = String((order as any)._id || (order as any).id || "");
        
        let gatewayOrderId = "";
        
        if (paymentMethod !== "cod" || collectGatewayForCod) {
          const gateway = PaymentGatewayFactory.create(actualGatewayType);
          const gatewayResult = await gateway.createOrder({ ...orderData, id: orderIdStr } as any, gatewayAmount);
          gatewayOrderId = gatewayResult.gatewayOrderId;
          
          await PaymentRepository.create({
            orderId: orderIdStr,
            status: "created",
            amount: gatewayAmount,
            gatewayOrderId,
            method: paymentMethod as any,
            gateway: actualGatewayType as any,
            webhookEvents: [],
            idempotencyKey,
          }, session);
        } else {
          // Pure COD without partial payment online
          
          let allStockDecremented = true;
          const decrementedItems = [];
          if (orderItems && orderItems.length > 0) {
            for (const itm of orderItems) {
              const success = await ProductRepository.decrementStock(itm.productId, itm.variantId, itm.quantity, session);
              if (success) {
                decrementedItems.push(itm);
              } else {
                allStockDecremented = false;
                break;
              }
            }
          }

          if (!allStockDecremented) {
            for (const itm of decrementedItems) {
              await ProductRepository.incrementStock(itm.productId, itm.variantId, itm.quantity, session);
            }
            throw new AppError("Insufficient stock for one or more items", 400); // Throws out of transaction since it's COD, it won't have payment to refund
          }

          // Auto-confirm the order since there's no gateway involved
          await OrderRepository.updateStatus(orderIdStr, "confirmed", {}, session);
          
          for (const itm of orderItems) {
            await ProductRepository.incrementSalesCount(itm.productId, itm.quantity, session);
          }
          if (couponCode) {
            await CouponService.incrementUsage(couponCode, userId, session);
          }
          await CartService.clearCart(userId, session);
        }

        if (gatewayOrderId) {
          await OrderRepository.updateStatus(orderIdStr, "pending_payment", {
            gatewayOrderId,
          }, session);
        }

        resultData = { 
          orderId: orderIdStr, 
          gatewayOrderId: gatewayOrderId, 
          amount: gatewayAmount, 
          orderNumber 
        };
      });
    } finally {
      await session.endSession();
    }

    return resultData;
  }

  static async verifyPayment(userId: string, gatewayOrderId: string, paymentId: string, signature: string) {
    const session = await mongoose.startSession();
    let stockFailed = false;
    let paymentRecord: any = null;
    try {
      await session.withTransaction(async () => {
        const order = await OrderRepository.findByGatewayOrderId(gatewayOrderId, session);
        if (!order) throw new AppError("Order not found", 404);

        // Ownership check
        if (String(order.userId) !== userId) throw new AppError("Order belongs to different user", 403);

        const payment = await PaymentRepository.findByGatewayOrderId(gatewayOrderId, session);
        if (!payment) throw new AppError("Payment record not found", 404);
        paymentRecord = payment;

        const gateway = PaymentGatewayFactory.create(payment.gateway);
        const verifyResult = await gateway.verifyPayment(payment as unknown as IPayment, { gatewayOrderId, paymentId, signature });

        if (!verifyResult.success) {
          throw new AppError(verifyResult.message || "Payment verification failed", 400);
        }

        if (order.status !== "confirmed") {
          const orderIdStr = String((order as any)._id || order.id);
          
          let allStockDecremented = true;
          const decrementedItems = [];
          if (order.items && order.items.length > 0) {
            for (const itm of order.items) {
              const success = await ProductRepository.decrementStock(itm.productId, itm.variantId, itm.quantity, session);
              if (success) {
                decrementedItems.push(itm);
              } else {
                allStockDecremented = false;
                break;
              }
            }
          }

          if (!allStockDecremented) {
            // Manual rollback of stock
            for (const itm of decrementedItems) {
              await ProductRepository.incrementStock(itm.productId, itm.variantId, itm.quantity, session);
            }
            
            await OrderRepository.updateStatus(orderIdStr, "failed", { paymentId, paymentSignature: signature }, session);
            await PaymentRepository.atomicStatusTransition(String((payment as any)._id || payment.id), "created", "captured", { gatewayPaymentId: verifyResult.gatewayPaymentId }, session);
            
            stockFailed = true;
            return;
          }

          await OrderRepository.updateStatus(orderIdStr, "confirmed", { paymentId, paymentSignature: signature }, session);
          await PaymentRepository.atomicStatusTransition(String((payment as any)._id || payment.id), "created", "captured", { gatewayPaymentId: verifyResult.gatewayPaymentId }, session);
          
          for (const itm of order.items) {
            await ProductRepository.incrementSalesCount(itm.productId, itm.quantity, session);
          }

          if (order.pricing && order.pricing.couponCode) {
            await CouponService.incrementUsage(order.pricing.couponCode, order.userId, session);
          }
          await CartService.clearCart(order.userId, session);

          const user = await UserRepository.findById(userId);
          if (user) {
            await addEmailJob(user.email, "Order Confirmed", `Your payment of ${paymentId} was successful.`);
          }
        }
      });
    } finally {
      await session.endSession();
    }

    if (stockFailed && paymentRecord) {
      // Initiate refund outside the transaction since it's an external API call
      try {
        const gateway = PaymentGatewayFactory.create(paymentRecord.gateway);
        await gateway.initiateRefund(paymentRecord as unknown as IPayment);
        logger.info(`Initiated refund for payment ${paymentRecord._id || paymentRecord.id} due to insufficient stock.`);
      } catch (err: any) {
        logger.error(`Failed to initiate refund for payment ${paymentRecord._id || paymentRecord.id}: ${err.message}`);
      }
      throw new AppError("Insufficient stock for one or more items. Your payment will be refunded.", 400);
    }
  }

  static async handleWebhook(rawBody: string, headers: any, gatewayType: string) {
    // Note: We now expect the gatewayRoute to pass the gatewayType explicitly (e.g. /webhooks/payu)
    if (!gatewayType || gatewayType === "unknown") throw new AppError("Unknown webhook source", 400);

    const gateway = PaymentGatewayFactory.create(gatewayType);
    const event = await gateway.handleWebhook(headers, rawBody);
    
    // Extract info specific to gateway
    let gatewayOrderId = event?.gatewayOrderId || "";
    let eventName = event?.event || "";
    let paymentEntity = event?.payload || null;

    if (!gatewayOrderId) {
      logger.warn(`Webhook received without gatewayOrderId for ${gatewayType}`);
      return;
    }

    let stockFailed = false;
    let paymentRecord: any = null;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await OrderRepository.findByGatewayOrderId(gatewayOrderId, session);
        if (!order) {
          logger.warn(`Order not found for Gateway Order ID: ${gatewayOrderId}`);
          return;
        }

        const payment = await PaymentRepository.findByGatewayOrderId(gatewayOrderId, session);
        if (!payment) {
          logger.warn(`Payment not found for Gateway Order ID: ${gatewayOrderId}`);
          return;
        }
        paymentRecord = payment;

        const orderIdStr = String((order as any)._id || order.id);
        const paymentIdStr = String((payment as any)._id || payment.id);
        const eventId = headers["x-payu-event-id"] || headers["x-ccavenue-event-id"] || event?.id;

        if (eventId) {
          const alreadyProcessed = await PaymentRepository.hasProcessedEvent(paymentIdStr, eventId);
          if (alreadyProcessed) {
            logger.info(`Webhook event ${eventId} already processed for payment ${paymentIdStr}`);
            return;
          }
          await PaymentRepository.addWebhookEvent(paymentIdStr, eventId, session);
        }

        if (eventName === "payment.captured") {
          if (order.status === "confirmed") return;
          
          let allStockDecremented = true;
          const decrementedItems = [];
          if (order.items && order.items.length > 0) {
            for (const itm of order.items) {
              const success = await ProductRepository.decrementStock(itm.productId, itm.variantId, itm.quantity, session);
              if (success) {
                decrementedItems.push(itm);
              } else {
                allStockDecremented = false;
                break;
              }
            }
          }

          if (!allStockDecremented) {
            for (const itm of decrementedItems) {
              await ProductRepository.incrementStock(itm.productId, itm.variantId, itm.quantity, session);
            }
            
            await OrderRepository.updateStatus(orderIdStr, "failed", { paymentId: paymentEntity?.id }, session);
            await PaymentRepository.atomicStatusTransition(paymentIdStr, ["created", "pending"], "captured", { gatewayPaymentId: paymentEntity?.id }, session);
            
            stockFailed = true;
            return;
          }

          await OrderRepository.updateStatus(orderIdStr, "confirmed", { paymentId: paymentEntity?.id }, session);
          await PaymentRepository.atomicStatusTransition(paymentIdStr, ["created", "pending"], "captured", { gatewayPaymentId: paymentEntity?.id }, session);
          
          for (const itm of order.items) {
            await ProductRepository.incrementSalesCount(itm.productId, itm.quantity, session);
          }

          if (order.pricing && order.pricing.couponCode) {
            await CouponService.incrementUsage(order.pricing.couponCode, order.userId, session);
          }
          await CartService.clearCart(order.userId, session);

          const user = await UserRepository.findById(order.userId);
          if (user) {
            await addEmailJob(user.email, "Order Confirmed", `Your payment was successfully captured.`);
          }
          logger.info(`Webhook successfully processed order ${orderIdStr}`);
        } 
        else if (eventName === "payment.failed") {
          if (order.status !== "pending_payment") return;
          await OrderRepository.updateStatus(orderIdStr, "failed", null, session);
          await PaymentRepository.atomicStatusTransition(paymentIdStr, ["created", "pending"], "failed", {}, session);
          const user = await UserRepository.findById(order.userId);
          if (user) {
            await addEmailJob(user.email, "Payment Failed", `Your payment attempt failed. Please try again.`);
          }
          logger.info(`Webhook processed failure for order ${orderIdStr}`);
        }
        else if (eventName === "refund.processed") {
          if (order.status === "refunded") return;
          await OrderRepository.updateStatus(orderIdStr, "refunded", null, session);
          await PaymentRepository.atomicStatusTransition(paymentIdStr, "captured", "refunded", {}, session);
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

    if (stockFailed && paymentRecord) {
      try {
        const refundGateway = PaymentGatewayFactory.create(paymentRecord.gateway);
        await refundGateway.initiateRefund(paymentRecord as unknown as IPayment);
        logger.info(`Webhook initiated refund for payment ${paymentRecord._id || paymentRecord.id} due to insufficient stock.`);
      } catch (err: any) {
        logger.error(`Webhook failed to initiate refund for payment ${paymentRecord._id || paymentRecord.id}: ${err.message}`);
      }
    }
  }

  static async requestRefund(orderId: string, amount?: number, reason?: string) {
    const session = await mongoose.startSession();
    let result: any = null;

    try {
      await session.withTransaction(async () => {
        const order = await OrderRepository.findById(orderId, session);
        if (!order) throw new AppError("Order not found", 404);

        if (order.status !== "confirmed" && order.status !== "processing" && order.status !== "shipped" && order.status !== "delivered") {
          throw new AppError(`Cannot refund order in ${order.status} status`, 400);
        }

        const payment = await PaymentRepository.findByGatewayOrderId(order.gatewayOrderId || "", session);
        if (!payment) throw new AppError("Payment record not found", 404);

        if (payment.status !== "captured" && payment.status !== "partially_refunded") {
          throw new AppError(`Cannot refund payment in ${payment.status} status`, 400);
        }

        const refundAmount = amount || payment.amount;
        const totalRefundedSoFar = payment.refunds?.reduce((sum: number, r: any) => sum + r.amount, 0) || 0;

        if (totalRefundedSoFar + refundAmount > payment.amount) {
          throw new AppError("Refund amount exceeds total payment amount", 400);
        }

        const gateway = PaymentGatewayFactory.create(payment.gateway);
        const refundResult = await gateway.initiateRefund(payment as unknown as IPayment, refundAmount);

        if (!refundResult.success) {
          throw new AppError(refundResult.message || "Refund initiation failed", 400);
        }

        const refundRecord = {
          refundId: refundResult.refundId || `ref_${Date.now()}`,
          amount: refundAmount,
          reason: reason || "Customer request",
          createdAt: new Date(),
          status: "processed"
        };

        await PaymentRepository.addRefund(String((payment as any)._id || payment.id), refundRecord as any, session);

        const isFullRefund = (totalRefundedSoFar + refundAmount) >= payment.amount;
        const newPaymentStatus = isFullRefund ? "refunded" : "partially_refunded";

        await PaymentRepository.atomicStatusTransition(
          String((payment as any)._id || payment.id), 
          ["captured", "partially_refunded"], 
          newPaymentStatus, 
          {}, 
          session
        );

        if (isFullRefund) {
          await OrderRepository.updateStatus(orderId, "cancelled", { cancelReason: reason || "Refunded" }, session);
          
          // Restore stock for all items
          if (order.items && order.items.length > 0) {
            for (const itm of order.items) {
              await ProductRepository.incrementStock(itm.productId, itm.variantId, itm.quantity, session);
              await ProductRepository.decrementSalesCount(itm.productId, itm.quantity, session);
            }
          }
        }

        result = { success: true, refundId: refundRecord.refundId, status: newPaymentStatus };
      });
    } finally {
      await session.endSession();
    }

    return result;
  }
}

