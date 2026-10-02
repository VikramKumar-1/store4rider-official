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
  
  static async createOrder(userId: string | undefined, input: any) { 
    const { shippingAddressId, shippingAddress, guestEmail, paymentMethod, couponCode, idempotencyKey } = input;
    
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

    let user: any = null;
    let shippingAddressSnapshot: any;

    if (userId) {
      user = await UserRepository.findById(userId);
      if (!user) throw new AppError("User not found", 404);

      const userAddress = user.addresses?.find((a: any) => a.id === shippingAddressId || String(a._id) === shippingAddressId);
      if (!userAddress && !shippingAddress) throw new AppError("Shipping address not found", 400);
      
      shippingAddressSnapshot = shippingAddress || {
        fullName: input.fullName || `${user.firstName} ${user.lastName}`.trim(),
        phone: input.phone || user.phone || "0000000000",
        addressLine1: userAddress.street,
        city: userAddress.city,
        state: userAddress.state,
        pincode: userAddress.pincode,
        country: userAddress.country,
      };
    } else {
      if (!shippingAddress) {
        throw new AppError("Shipping address is required for guest checkout", 400);
      }
      shippingAddressSnapshot = {
        fullName: shippingAddress.fullName || input.fullName,
        phone: shippingAddress.phone || input.phone,
        addressLine1: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country,
      };
    }

    let cartItems = input.items || [];
    
    // Fallback to database cart if not provided in payload (only for logged-in users)
    if (cartItems.length === 0 && userId) {
      const cart = await CartService.getCart(userId);
      if (cart && cart.items) {
        cartItems = cart.items;
      }
    }

    // SERVER-SIDE SERVICEABILITY GATE — prevents orders for undeliverable pincodes
    // Frontend check is just UX; this is the real backend guard. Cannot be bypassed.
    const pincode = shippingAddressSnapshot.pincode;
    if (pincode && /^\d{6}$/.test(pincode)) {
      try {
        const { ShipmentService } = require("../shipping/shipment.service");
        const serviceability = await ShipmentService.checkServiceability(pincode, 0.5, paymentMethod === "cod");
        
        // Check if ANY provider can deliver to this pincode
        const isServiceable = serviceability.some((s: any) => s.serviceable);
        if (!isServiceable) {
          throw new AppError(
            `Delivery is not available for pincode ${pincode}. Please use a different shipping address.`,
            400
          );
        }

        // If COD order, check if any provider supports COD at this pincode
        if (paymentMethod === "cod") {
          const codSupported = serviceability.some((s: any) => s.serviceable && s.codAvailable);
          if (!codSupported) {
            throw new AppError(
              `Cash on Delivery is not available for pincode ${pincode}. Please use online payment.`,
              400
            );
          }
        }
      } catch (error: any) {
        // If it's our AppError (serviceability failed), re-throw it
        if (error instanceof AppError) throw error;
        // If external API failed, log warning but allow order (graceful degradation)
        // We don't want courier API downtime to block all orders
        logger.warn(`[OrderService] Serviceability check failed for pincode ${pincode}, allowing order: ${error.message}`);
      }
    }

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
    let actualGatewayType = paymentMethod === "upi" ? "payu" : paymentMethod;

    if (paymentMethod === "cod") {
      pricing.codAmountToCollect = totalAmount;
      if (settings.codPartialPaymentEnabled && settings.codPartialPaymentType && settings.codPartialPaymentValue && ENV.PAYU_MERCHANT_KEY && ENV.PAYU_SALT) {
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
          ...(userId ? { userId } : {}),
          ...(guestEmail ? { guestEmail } : {}),
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
        let gatewayResponse: any = null;
        
        if (paymentMethod !== "cod" || collectGatewayForCod) {
          const gateway = PaymentGatewayFactory.create(actualGatewayType);
          const gatewayResult = await gateway.createOrder({ ...orderData, id: orderIdStr, userEmail: user?.email } as any, gatewayAmount);
          gatewayOrderId = gatewayResult.gatewayOrderId;
          gatewayResponse = gatewayResult.gatewayResponse;
          
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
          if (couponCode && userId) {
            await CouponService.incrementUsage(couponCode, userId, session);
          }
          if (userId) {
            await CartService.clearCart(userId, session);
          }
          if (user?.email || guestEmail) {
            const emailTarget = user?.email || guestEmail;
            await addEmailJob(emailTarget, "Order Confirmed (Cash on Delivery)", `Your order #${orderNumber} has been placed successfully via Cash on Delivery.`);
          }
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
          orderNumber,
          gatewayResponse,
          paymentMethod: actualGatewayType
        };
      });
    } finally {
      await session.endSession();
    }

    return resultData;
  }

  static async verifyPayment(userId: string | undefined, gatewayOrderId: string, paymentId: string, signature: string) {
    const session = await mongoose.startSession();
    let stockFailed = false;
    let paymentRecord: any = null;
    try {
      await session.withTransaction(async () => {
        const order = await OrderRepository.findByGatewayOrderId(gatewayOrderId, session);
        if (!order) throw new AppError("Order not found", 404);

        // Ownership check
        if (userId && order.userId && String(order.userId) !== userId) throw new AppError("Order belongs to different user", 403);

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

          if (order.pricing && order.pricing.couponCode && order.userId) {
            await CouponService.incrementUsage(order.pricing.couponCode, order.userId, session);
          }
          if (order.userId) {
            await CartService.clearCart(order.userId, session);
          }

          if (order.userId) {
            const user = await UserRepository.findById(order.userId);
            if (user) {
              await addEmailJob(user.email, "Order Confirmed", `Your payment of ${paymentId} was successful.`);
            }
          } else if (order.guestEmail) {
            await addEmailJob(order.guestEmail, "Order Confirmed", `Your payment of ${paymentId} was successful.`);
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

          if (order.pricing && order.pricing.couponCode && order.userId) {
            await CouponService.incrementUsage(order.pricing.couponCode, order.userId, session);
          }
          if (order.userId) {
            await CartService.clearCart(order.userId, session);
          }

          if (order.userId) {
            const user = await UserRepository.findById(order.userId);
            if (user) {
              await addEmailJob(user.email, "Order Confirmed", `Your payment was successfully captured.`);
            }
          } else if (order.guestEmail) {
            await addEmailJob(order.guestEmail, "Order Confirmed", `Your payment was successfully captured.`);
          }
          logger.info(`Webhook successfully processed order ${orderIdStr}`);
        } 
        else if (eventName === "payment.failed") {
          if (order.status !== "pending_payment") return;
          await OrderRepository.updateStatus(orderIdStr, "failed", null, session);
          await PaymentRepository.atomicStatusTransition(paymentIdStr, ["created", "pending"], "failed", {}, session);
          
          if (order.userId) {
            const user = await UserRepository.findById(order.userId);
            if (user) {
              await addEmailJob(user.email, "Payment Failed", `Your payment attempt failed. Please try again.`);
            }
          } else if (order.guestEmail) {
            await addEmailJob(order.guestEmail, "Payment Failed", `Your payment attempt failed. Please try again.`);
          }
          logger.info(`Webhook processed failure for order ${orderIdStr}`);
        }
        else if (eventName === "refund.processed") {
          if (order.status === "refunded") return;
          await OrderRepository.updateStatus(orderIdStr, "refunded", null, session);
          await PaymentRepository.atomicStatusTransition(paymentIdStr, "captured", "refunded", {}, session);
          if (order.userId) {
            const user = await UserRepository.findById(order.userId);
            if (user) {
              await addEmailJob(user.email, "Refund Processed", `Your refund of INR ${paymentEntity.amount / 100} has been processed.`);
            }
          } else if (order.guestEmail) {
            await addEmailJob(order.guestEmail, "Refund Processed", `Your refund of INR ${paymentEntity.amount / 100} has been processed.`);
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

  static async getAllAdmin(query: any, page: number, limit: number) {
    const dbQuery: any = {};
    if (query.status) dbQuery.status = query.status;
    if (query.paymentMethod) dbQuery.paymentMethod = query.paymentMethod;
    if (query.search) {
      dbQuery.$or = [
        { orderNumber: { $regex: query.search, $options: "i" } },
        { "shippingAddress.fullName": { $regex: query.search, $options: "i" } },
        { "shippingAddress.phone": { $regex: query.search, $options: "i" } },
      ];
    }
    if (query.userId) dbQuery.userId = query.userId;

    return await OrderRepository.findPaginated(dbQuery, page, limit);
  }

  static async addNote(orderId: string, author: string, text: string) {
    const note = {
      text,
      author,
      timestamp: new Date()
    };
    const order = await OrderRepository.addNote(orderId, note);
    if (!order) throw new AppError("Order not found", 404);
    return order;
  }

  static async adminUpdateStatus(orderId: string, newStatus: string) {
    const allowedStatuses = [
      "pending_payment", "confirmed", "processing", "packed", "shipped", 
      "delivered", "cancelled", "failed", "refunded", 
      "return_requested", "return_approved", "return_picked", "returned"
    ];

    if (!allowedStatuses.includes(newStatus)) {
      throw new AppError(`Invalid status: ${newStatus}`, 400);
    }

    const order = await OrderRepository.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);

    // Business Logic for status transition can be added here
    // e.g., restoring stock if cancelled/returned

    const updatedOrder = await OrderRepository.updateStatus(orderId, newStatus);
    return updatedOrder;
  }

  static async requestReturn(orderId: string, userId: string, reason: string, images?: string[]) {
    const order = await OrderRepository.findById(orderId);
    if (!order || order.userId !== userId) {
      throw new AppError("Order not found", 404);
    }
    
    if (order.status !== "delivered") {
      throw new AppError("Only delivered orders can be returned", 400);
    }

    const note = {
      text: `Return requested: ${reason}`,
      author: userId,
      timestamp: new Date()
    };
    
    await OrderRepository.addNote(orderId, note);
    return await OrderRepository.updateStatus(orderId, "return_requested");
  }

  static async adminHandleReturn(orderId: string, action: string, adminNote?: string) {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    
    if (order.status !== "return_requested") {
      throw new AppError("Order is not in return_requested status", 400);
    }

    const status = action === "approve" ? "return_approved" : "delivered";
    
    const noteText = action === "approve" ? "Return approved." : "Return rejected.";
    await OrderRepository.addNote(orderId, {
      text: adminNote ? `${noteText} Reason: ${adminNote}` : noteText,
      author: "Admin",
      timestamp: new Date()
    });

    return await OrderRepository.updateStatus(orderId, status);
  }

  static async getInvoiceUrl(orderId: string, userId: string) {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    // Allow admin to skip userId check (if userId is "admin") or normal user check
    if (userId !== "admin" && order.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    const { InvoiceGenerator } = require("../../core/utils/invoiceGenerator");
    const url = await InvoiceGenerator.getOrGenerateInvoiceUrl(order);
    return url;
  }

  static async cleanupAbandonedOrders(): Promise<number> {
    try {
      const count = await OrderRepository.markStaleOrdersAsFailed();
      if (count > 0) {
        logger.info(`Cleaned up ${count} abandoned orders stuck in pending_payment`);
      }
      return count;
    } catch (error: any) {
      logger.error("Failed to cleanup abandoned orders", { error: error.message });
      return 0;
    }
  }
}
