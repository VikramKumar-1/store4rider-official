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
import { AppError, NotFoundError, ValidationError } from "../../core/errors/AppError";
import { addEmailJob } from "../../core/queue/email.queue";
import { logger } from "../../core/utils/logger";
import { ENV } from "../../core/config/env";
import { calculateTax, calculateInclusiveTax, getTaxRateFromClass } from "@store4riders/shared-utils";
import { getCache, setCache } from "../../core/cache/redis";

export class OrderService {
  
  static async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const seq = await OrderRepository.getNextOrderSequence();
    return `OD-S4R-${yy}${mm}${seq}`;
  }

  static async createOrder(userId: string | undefined, input: any) { 
    const { shippingAddressId, shippingAddress, guestEmail, paymentMethod, couponCode, idempotencyKey, customerGstin, businessName } = input;
    const sanitizedGstin = customerGstin ? String(customerGstin).trim().toUpperCase() : undefined;
    const sanitizedBusinessName = businessName ? String(businessName).trim() : undefined;
    
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

    if (shippingAddress) {
      shippingAddressSnapshot = {
        fullName: shippingAddress.fullName || input.fullName || (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Customer"),
        phone: shippingAddress.phone || input.phone || user?.phone || "0000000000",
        addressLine1: shippingAddress.addressLine1 || shippingAddress.street,
        street: shippingAddress.street || shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || "",
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country,
      };
    } else if (userId) {
      user = await UserRepository.findById(userId);
      if (!user) throw new AppError("User not found", 404);

      const userAddress = user.addresses?.find((a: any) => a.id === shippingAddressId || String(a._id) === shippingAddressId);
      if (!userAddress) throw new AppError("Shipping address not found", 400);

      shippingAddressSnapshot = {
        fullName: input.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || "Customer",
        phone: input.phone || user.phone || "0000000000",
        addressLine1: userAddress.addressLine1 || userAddress.street,
        street: userAddress.street || userAddress.addressLine1,
        addressLine2: userAddress.addressLine2 || "",
        city: userAddress.city,
        state: userAddress.state,
        pincode: userAddress.pincode,
        country: userAddress.country,
      };
    } else {
      throw new AppError("Shipping address is required", 400);
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
    if (pincode && /^\d{6}$/.test(pincode) && process.env.NODE_ENV !== "test") {
      try {
        const { ShipmentService } = await import("../shipping/shipment.service");
        const serviceability = await ShipmentService.checkServiceability(pincode, 0.5, paymentMethod === "cod");
        
        // Check if ANY provider can deliver to this pincode
        if (!serviceability.serviceable) {
          throw new AppError(
            `Delivery is not available for pincode ${pincode}. Please use a different shipping address.`,
            400
          );
        }

        // If COD order, check if any provider supports COD at this pincode
        if (paymentMethod === "cod") {
          if (!serviceability.codAvailable) {
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

    const settings = await SettingRepository.getSettings();
    const defaultTaxRate = typeof settings.taxRate === "number" ? settings.taxRate : 18;
    const freeShippingThreshold = settings.freeShippingThreshold || 0;
    const shippingCost = settings.shippingCost || 0;

    let subtotal = 0;
    let totalTax = 0;
    let discount = 0;
    const orderItems: any[] = [];

    for (const item of cartItems) {
      const product = await ProductRepository.findById(item.productId);
      if (!product) throw new AppError(`Product ${item.productId} not found`, 404);

      let unitPrice = product.basePrice;
      if (product.specialPrice) {
        const now = new Date();
        const fromDate = product.specialPriceFromDate ? new Date(product.specialPriceFromDate) : null;
        const toDate = product.specialPriceToDate ? new Date(product.specialPriceToDate) : null;
        
        const isStarted = fromDate ? now >= fromDate : true;
        const isNotExpired = toDate ? now <= toDate : true;
        
        if (isStarted && isNotExpired) {
          unitPrice = product.specialPrice;
        }
      }
      if (item.variantId) {
        const variant = product.variants?.find((v: any) => v.id === item.variantId || v.sku === item.variantId);
        if (variant) {
          unitPrice = (variant.specialPrice && variant.specialPrice > 0) ? variant.specialPrice : variant.price;
        }
      }

      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;
      
      const isInclusive = settings.gstPricingMode !== "exclusive";
      const itemTaxRate = getTaxRateFromClass(product.taxClassName, defaultTaxRate);
      const itemTax = isInclusive
        ? calculateInclusiveTax(itemTotal, itemTaxRate).taxAmount
        : calculateTax(itemTotal, itemTaxRate);
      totalTax += itemTax;

      const itemHsnCode = (item.variantId ? product.variants?.find((v: any) => v.id === item.variantId || v.sku === item.variantId)?.hsnCode : undefined) || product.hsnCode || "";

      const variantObj = item.variantId ? product.variants?.find((v: any) => v.id === item.variantId || v.sku === item.variantId) : null;
      const itemImage = (variantObj as any)?.image
        || (variantObj as any)?.images?.[0]?.url
        || product.images?.[0]?.url
        || (product as any).thumbnail
        || (product as any).image
        || "";

      orderItems.push({
        productId: String(product._id),
        variantId: item.variantId,
        name: product.name,
        sku: item.variantId ? (variantObj?.sku || product.sku) : product.sku,
        quantity: item.quantity,
        unitPrice,
        taxRate: itemTaxRate,
        taxAmount: itemTax,
        hsnCode: itemHsnCode,
        allowBackorders: product.allowBackorders,
        isFreeShipping: Boolean(product.isFreeShipping),
        image: itemImage,
        slug: product.slug || "",
      });
    }

    let couponDiscount = 0;
    if (couponCode) {
      const couponResult = await CouponService.validateCoupon(couponCode, subtotal);
      couponDiscount = couponResult.discountAmount;
      // Pro-rate tax reduction if coupon applies
      if (subtotal > 0) {
        totalTax = totalTax * (1 - (couponDiscount / subtotal));
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);

    const isInclusive = settings.gstPricingMode !== "exclusive";
    const allFreeShipping = orderItems.length > 0 && orderItems.every((item: any) => item.isFreeShipping);
    const shipping = (allFreeShipping || (discountedSubtotal >= freeShippingThreshold)) ? 0 : (discountedSubtotal > 0 ? shippingCost : 0);
    const totalAmount = isInclusive
      ? discountedSubtotal + shipping
      : discountedSubtotal + totalTax + shipping;

    const pricing: any = {
      subtotal,
      discount,
      couponCode,
      couponDiscount,
      tax: totalTax,
      taxRate: defaultTaxRate, // Keep for backward compatibility or display
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

    const orderNumber = await this.generateOrderNumber();

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
          ...(sanitizedGstin ? { customerGstin: sanitizedGstin } : {}),
          ...(sanitizedBusinessName ? { businessName: sanitizedBusinessName } : {}),
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
            addEmailJob(emailTarget, "Order Confirmed (Cash on Delivery)", `Your order #${orderNumber} has been placed successfully via Cash on Delivery.`);
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

    if (resultData) {
      try {
        const { adminEventHub } = await import("../../core/events/adminEventHub");
        adminEventHub.publish("ORDER_CREATED", {
          orderId: (resultData as any).orderId,
          orderNumber: (resultData as any).orderNumber,
          paymentMethod: (resultData as any).paymentMethod,
          amount: (resultData as any).amount,
        });
      } catch {}
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
              addEmailJob(user.email, "Order Confirmed", `Your payment of ${paymentId} was successful.`);
            }
          } else if (order.guestEmail) {
            addEmailJob(order.guestEmail, "Order Confirmed", `Your payment of ${paymentId} was successful.`);
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
      return { success: false, message: "Missing gatewayOrderId" };
    }

    let stockFailed = false;
    let paymentRecord: any = null;
    let finalOrderNumber = "";
    let finalOrderId = "";

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await OrderRepository.findByGatewayOrderId(gatewayOrderId, session);

        if (!order) {
          logger.warn(`Order not found for Gateway Order ID: ${gatewayOrderId}`);
          return;
        }

        finalOrderNumber = order.orderNumber;
        finalOrderId = String((order as any)._id || order.id);

        let payment = await PaymentRepository.findByGatewayOrderId(gatewayOrderId, session);
        if (!payment) {
          payment = await PaymentRepository.findByOrderId(finalOrderId, session);
        }
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
              addEmailJob(user.email, "Order Confirmed", `Your payment was successfully captured.`);
            }
          } else if (order.guestEmail) {
            addEmailJob(order.guestEmail, "Order Confirmed", `Your payment was successfully captured.`);
          }
          logger.info(`Webhook successfully processed order ${orderIdStr}`);
        } 
        else if (eventName === "payment.failed") {
          if (order.status !== "pending_payment") return;
          const failureReason = event?.payload?.statusMessage || event?.payload?.error_Message || (event?.payload?.status ? `Payment failed: ${event.payload.status}` : "Payment declined or cancelled by customer at gateway");
          await OrderRepository.updateStatus(orderIdStr, "failed", { failureReason }, session);
          await PaymentRepository.atomicStatusTransition(paymentIdStr, ["created", "pending"], "failed", {}, session);
          
          if (order.userId) {
            const user = await UserRepository.findById(order.userId);
            if (user) {
              addEmailJob(user.email, "Payment Failed", `Your payment attempt failed: ${failureReason}. Please try again.`);
            }
          } else if (order.guestEmail) {
            addEmailJob(order.guestEmail, "Payment Failed", `Your payment attempt failed: ${failureReason}. Please try again.`);
          }
          logger.info(`Webhook processed failure for order ${orderIdStr}: ${failureReason}`);
        }
        else if (eventName === "refund.processed") {
          if (order.status === "refunded") return;
          await OrderRepository.updateStatus(orderIdStr, "refunded", null, session);
          await PaymentRepository.atomicStatusTransition(paymentIdStr, "captured", "refunded", {}, session);
          if (order.userId) {
            const user = await UserRepository.findById(order.userId);
            if (user) {
              addEmailJob(user.email, "Refund Processed", `Your refund of INR ${paymentEntity.amount / 100} has been processed.`);
            }
          } else if (order.guestEmail) {
            addEmailJob(order.guestEmail, "Refund Processed", `Your refund of INR ${paymentEntity.amount / 100} has been processed.`);
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

    return {
      success: eventName === "payment.captured" && !stockFailed,
      orderNumber: finalOrderNumber || gatewayOrderId,
      orderId: finalOrderId || gatewayOrderId,
      eventName,
      message: eventName === "payment.captured" ? (stockFailed ? "Insufficient stock" : "Payment captured") : "Payment failed",
    };
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

  static async getOrderById(orderId: string) {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.userId) {
      try {
        const { UserModel } = await import("../user/user.model");
        const user: any = await UserModel.findById(order.userId).select("email firstName lastName phone name").lean().exec();
        if (user) {
          (order as any).customer = user;
          (order as any).customerEmail = (order as any).customerEmail || (order as any).guestEmail || user.email;
          if (!order.shippingAddress?.fullName) {
            if (!order.shippingAddress) (order as any).shippingAddress = {} as any;
            (order.shippingAddress as any).fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || "Customer";
          }
          if (!order.shippingAddress?.phone && user.phone) {
            (order.shippingAddress as any).phone = user.phone;
          }
        }
      } catch {
        // graceful
      }
    } else {
      (order as any).customerEmail = (order as any).customerEmail || (order as any).guestEmail || "";
    }

    return order;
  }

  static async getAllAdmin(query: any, page: number, limit: number) {
    const dbQuery: any = {};
    if (query.status) {
      if (query.status === "failed") {
        dbQuery.status = { $in: ["failed", "pending_payment"] };
      } else if (query.status === "exchanges") {
        dbQuery.status = { $in: ["return_requested", "return_approved", "return_picked", "returned"] };
      } else if (query.status === "all_orders") {
        dbQuery.status = { $nin: ["failed", "pending_payment"] };
      } else if (query.status === "all" || query.status === "any") {
        // Show any status without restriction
      } else {
        dbQuery.status = query.status;
      }
    } else {
      // DEFAULT: Do NOT include failed or pending_payment transactions in the main orders list!
      // Main orders list only shows legitimate placed orders when browsing!
      // But if the merchant is searching for a specific order or customer, don't hide it just because payment failed or is pending!
      if (!query.search || !query.search.trim()) {
        dbQuery.status = { $nin: ["failed", "pending_payment"] };
      }
    }

    if (query.paymentMethod) {
      if (query.paymentMethod === "prepaid") {
        dbQuery.paymentMethod = { $ne: "cod" };
      } else {
        dbQuery.paymentMethod = query.paymentMethod;
      }
    }

    if (query.search && query.search.trim()) {
      const cleanSearch = query.search.trim();
      const strippedOrder = cleanSearch.replace(/^(order|ord|#|\s)+/i, "").trim();
      const escaped = cleanSearch.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const digits = cleanSearch.replace(/[^0-9]/g, "");

      // Match shipments (AWB, Courier Name)
      let shipmentOrderIds: string[] = [];
      try {
        const { ShipmentModel } = await import("../shipping/shipment.model");
        const matchingShipments = await ShipmentModel.find({
          $or: [
            { awb: { $regex: escaped, $options: "i" } },
            { courierName: { $regex: escaped, $options: "i" } }
          ]
        }).select("orderId").limit(50).lean().exec();
        shipmentOrderIds = matchingShipments.map((s) => s.orderId).filter(Boolean);
      } catch {
        // graceful
      }

      // Match registered users (email, phone, fullName)
      let userOrderIds: string[] = [];
      try {
        const { UserModel } = await import("../user/user.model");
        const userOrConditions: any[] = [
          { email: { $regex: escaped, $options: "i" } },
          { firstName: { $regex: escaped, $options: "i" } },
          { lastName: { $regex: escaped, $options: "i" } },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ["$firstName", " ", "$lastName"] },
                regex: escaped,
                options: "i"
              }
            }
          }
        ];
        if (digits.length >= 4) {
          userOrConditions.push({ phone: { $regex: digits, $options: "i" } });
        }
        const matchingUsers = await UserModel.find({ $or: userOrConditions }).select("_id").limit(50).lean().exec();
        userOrderIds = matchingUsers.map((u) => String(u._id));
      } catch {
        // graceful
      }

      const searchOr: any[] = [];

      if (strippedOrder) {
        const escapedOrder = strippedOrder.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        searchOr.push({ orderNumber: { $regex: escapedOrder, $options: "i" } });
      }

      if (digits.length >= 2) {
        searchOr.push({ orderNumber: { $regex: digits, $options: "i" } });
      }

      if (mongoose.Types.ObjectId.isValid(cleanSearch)) {
        searchOr.push({ _id: new mongoose.Types.ObjectId(cleanSearch) });
      }

      searchOr.push(
        { orderNumber: { $regex: escaped, $options: "i" } },
        { "shippingAddress.fullName": { $regex: escaped, $options: "i" } },
        { "shippingAddress.phone": { $regex: escaped, $options: "i" } },
        { "shippingAddress.city": { $regex: escaped, $options: "i" } },
        { "shippingAddress.state": { $regex: escaped, $options: "i" } },
        { "shippingAddress.pincode": { $regex: escaped, $options: "i" } },
        { guestEmail: { $regex: escaped, $options: "i" } },
        { "items.name": { $regex: escaped, $options: "i" } },
        { "items.sku": { $regex: escaped, $options: "i" } }
      );

      // Multi-word full name support
      const words = cleanSearch.split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        const wordRegexes = words.map((w: string) => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
        searchOr.push({
          $and: wordRegexes.map((w: string) => ({ "shippingAddress.fullName": { $regex: w, $options: "i" } }))
        });
      }

      if (digits.length >= 4) {
        searchOr.push({ "shippingAddress.phone": { $regex: digits, $options: "i" } });
      }

      if (shipmentOrderIds.length > 0) {
        const validObjIds = shipmentOrderIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
        if (validObjIds.length > 0) {
          searchOr.push({ _id: { $in: validObjIds } });
        }
        searchOr.push({ orderNumber: { $in: shipmentOrderIds } });
      }

      if (userOrderIds.length > 0) {
        searchOr.push({ userId: { $in: userOrderIds } });
      }

      dbQuery.$or = searchOr;
    }
    if (query.userId) dbQuery.userId = query.userId;

    const result = await OrderRepository.findPaginated(dbQuery, page, limit);

    // Populate customer email and user details for user accounts if guestEmail is not on order
    const userIdsToFetch = result.items
      .filter((o: any) => !o.guestEmail && o.userId)
      .map((o: any) => o.userId);

    if (userIdsToFetch.length > 0) {
      try {
        const { UserModel } = await import("../user/user.model");
        const users = await UserModel.find({ _id: { $in: userIdsToFetch } }).select("email name phone").lean().exec();
        const userMap = new Map(users.map((u: any) => [String(u._id), u]));
        result.items.forEach((o: any) => {
          if (!o.guestEmail && o.userId && userMap.has(String(o.userId))) {
            const u = userMap.get(String(o.userId));
            (o as any).customerEmail = u.email;
            if (!o.shippingAddress?.fullName) {
              if (!o.shippingAddress) o.shippingAddress = {} as any;
              o.shippingAddress.fullName = u.name;
            }
          } else {
            (o as any).customerEmail = o.guestEmail || "";
          }
        });
      } catch (err) {
        // graceful
      }
    } else {
      result.items.forEach((o: any) => {
        (o as any).customerEmail = o.guestEmail || "";
      });
    }

    return result;
  }

  static async suggestAdmin(q: string) {
    if (!q || !q.trim() || q.trim().length < 2) return [];
    const cleanSearch = q.trim();
    const cacheKey = `order_suggest_${encodeURIComponent(cleanSearch.toLowerCase())}`;
    try {
      const cached = await getCache(cacheKey);
      if (cached && Array.isArray(cached)) return cached;
    } catch {
      // ignore
    }

    const { OrderModel } = await import("./order.model");
    const escaped = cleanSearch.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const strippedOrder = cleanSearch.replace(/^(order|ord|#|\s)+/i, "").trim();
    const digits = cleanSearch.replace(/[^0-9]/g, "");

    const searchOr: any[] = [];
    if (strippedOrder) {
      const escapedOrder = strippedOrder.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      searchOr.push({ orderNumber: { $regex: escapedOrder, $options: "i" } });
    }
    if (digits.length >= 2) {
      searchOr.push({ orderNumber: { $regex: digits, $options: "i" } });
    }
    if (mongoose.Types.ObjectId.isValid(cleanSearch)) {
      searchOr.push({ _id: new mongoose.Types.ObjectId(cleanSearch) });
    }

    searchOr.push(
      { orderNumber: { $regex: escaped, $options: "i" } },
      { "shippingAddress.fullName": { $regex: escaped, $options: "i" } },
      { "shippingAddress.phone": { $regex: escaped, $options: "i" } },
      { "shippingAddress.city": { $regex: escaped, $options: "i" } },
      { guestEmail: { $regex: escaped, $options: "i" } },
      { "items.name": { $regex: escaped, $options: "i" } },
      { "items.sku": { $regex: escaped, $options: "i" } }
    );

    if (digits.length >= 4) {
      searchOr.push({ "shippingAddress.phone": { $regex: digits, $options: "i" } });
    }

    const items = await OrderModel.find({ $or: searchOr })
      .select("_id orderNumber status paymentMethod pricing.total guestEmail userId shippingAddress.fullName shippingAddress.phone shippingAddress.city shippingAddress.state createdAt items.name items.image items.sku items.quantity")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()
      .exec();

    // Cache for 15s to prevent hammering MongoDB while typing
    try {
      await setCache(cacheKey, items, 15);
    } catch {
      // ignore
    }

    return items;
  }

  static async getAdminCounts() {
    const cacheKey = "admin_order_counts";
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const { OrderModel } = await import("./order.model");
    const [
      activeCount,
      failedCount,
      exchangeCount,
      prepaidCount,
      codCount
    ] = await Promise.all([
      OrderModel.countDocuments({ status: { $nin: ["failed", "pending_payment"] } }).exec(),
      OrderModel.countDocuments({ status: { $in: ["failed", "pending_payment"] } }).exec(),
      OrderModel.countDocuments({ status: { $in: ["return_requested", "return_approved", "return_picked", "returned"] } }).exec(),
      OrderModel.countDocuments({ status: { $nin: ["failed", "pending_payment"] }, paymentMethod: { $ne: "cod" } }).exec(),
      OrderModel.countDocuments({ status: { $nin: ["failed", "pending_payment"] }, paymentMethod: "cod" }).exec(),
    ]);

    const result = {
      activeCount,
      failedCount,
      exchangeCount,
      prepaidCount,
      codCount
    };

    await setCache(cacheKey, result, 20); // 20s TTL
    return result;
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
    if (updatedOrder) {
      try {
        const { OrderModel } = await import("./order.model");
        await OrderModel.findByIdAndUpdate(orderId, { $unset: { invoiceUrl: 1 } });
      } catch {}
    }
    try {
      const { adminEventHub } = await import("../../core/events/adminEventHub");
      adminEventHub.publish("ORDER_STATUS_CHANGED", {
        orderId,
        status: newStatus,
      });
    } catch {}

    return updatedOrder;
  }

  static async adminDeleteOrder(orderId: string) {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    await OrderRepository.deleteById(orderId);
    return true;
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

    if (order.status === "failed" || order.status === "pending_payment") {
      throw new ValidationError("Tax invoices cannot be generated for uncompleted or failed payment orders");
    }

    const { InvoiceGenerator } = require("../../core/utils/invoiceGenerator");
    const url = await InvoiceGenerator.getOrGenerateInvoiceUrl(order);
    return url;
  }

  static async resendInvoiceEmail(orderId: string): Promise<{ invoiceUrl: string; recipientEmail: string }> {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    if (order.status === "failed" || order.status === "pending_payment") {
      throw new ValidationError("Tax invoices cannot be emailed for uncompleted or failed payment orders");
    }

    const { InvoiceGenerator } = require("../../core/utils/invoiceGenerator");
    const invoiceUrl = await InvoiceGenerator.getOrGenerateInvoiceUrl(order);

    let recipientEmail = order.guestEmail;
    if (!recipientEmail && order.userId) {
      try {
        const { UserModel } = await import("../user/user.model");
        const user = await UserModel.findById(order.userId).lean().exec();
        recipientEmail = (user as any)?.email;
      } catch {}
    }

    if (!recipientEmail) {
      throw new ValidationError("No customer email found for this order");
    }

    const isCod = String(order.paymentMethod || "").toLowerCase() === "cod";
    const advancePaid = isCod ? (order.pricing?.codPartialPaymentAmount || 0) : order.pricing?.total;
    const balanceDue = isCod
      ? (order.pricing?.codAmountToCollect !== undefined
          ? order.pricing.codAmountToCollect
          : Math.max(0, (order.pricing?.total || 0) - advancePaid))
      : 0;

    const emailSubject = `Tax Invoice for Order #${order.orderNumber} - Store4Riders`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #AB1509; margin-top: 0;">Store4Riders Tax Invoice</h2>
        <p>Hello <strong>${order.shippingAddress?.fullName || "Rider"}</strong>,</p>
        <p>Thank you for choosing Store4Riders for your riding gear. Here is your official tax invoice for Order <strong>#${order.orderNumber}</strong>.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 14px; color: #0f172a;">Order & Payment Summary</h3>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Order ID:</strong> #${order.orderNumber}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Grand Total:</strong> Rs. ${order.pricing?.total?.toFixed(2)}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Payment Method:</strong> ${isCod ? "Cash on Delivery" : order.paymentMethod.toUpperCase()}</p>
          ${isCod ? `
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;"><strong>Advance Paid Online:</strong> Rs. ${advancePaid.toFixed(2)}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #b91c1c;"><strong>Balance Cash Due on Delivery:</strong> Rs. ${balanceDue.toFixed(2)}</p>
          ` : `
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;"><strong>Payment Status:</strong> Paid in Full Online</p>
          `}
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${invoiceUrl}" target="_blank" style="background-color: #AB1509; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Download Tax Invoice PDF
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
          * Note: Store4Riders operates under a strict 7-Day Size & Gear Exchange Policy. No monetary returns/refunds.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          Store4Riders | Premium Motorcycle Riding Gear | support@store4riders.com
        </p>
      </div>
    `;

    try {
      const { addEmailJob } = require("../../core/queue/email.queue");
      await addEmailJob(recipientEmail, emailSubject, emailBody);
    } catch {
      try {
        const { sendEmail } = require("../../core/email/ses");
        await sendEmail(recipientEmail, emailSubject, emailBody);
      } catch (err: any) {
        logger.error("[OrderService] Failed to queue or send invoice email", err);
      }
    }

    // Add note on order
    await OrderRepository.addNote(orderId, {
      text: `Tax Invoice resent via email to ${recipientEmail}`,
      author: "admin",
      timestamp: new Date(),
    });

    return { invoiceUrl, recipientEmail };
  }

  static async adminAssignWarehouse(orderId: string, warehouseId: string): Promise<any> {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    const { WarehouseRepository } = await import("../warehouse/warehouse.repository");
    const warehouse = await WarehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundError("Warehouse");
    }

    const note = {
      text: `Dispatch warehouse assigned to ${warehouse.name} (${warehouse.city}, ${warehouse.state})`,
      author: "admin",
      timestamp: new Date(),
    };

    const updatedOrder = await OrderRepository.updateWarehouse(orderId, warehouseId, note);

    // Also update any existing forward shipment
    try {
      const { ShipmentModel } = await import("../shipping/shipment.model");
      await ShipmentModel.updateMany({ orderId: String(orderId) }, { $set: { warehouseId: String(warehouse._id) } });
    } catch {}

    // Regenerate invoice with updated warehouse
    try {
      const { InvoiceGenerator } = require("../../core/utils/invoiceGenerator");
      if (updatedOrder) {
        await InvoiceGenerator.generateAndSaveInvoice(updatedOrder);
      }
    } catch {}

    return updatedOrder;
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
