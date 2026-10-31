/**
 * @class OrderRepository
 * @description Direct database access layer for Orders.
 * Keeps Mongoose specifics completely hidden from the Service layer.
 */
import mongoose, { ClientSession } from "mongoose";
import { OrderModel, OrderCounterModel, IOrderCounter } from "./order.model";
import { IOrder } from "@store4riders/shared-types";

export class OrderRepository {
  static async create(data: Partial<IOrder>, session?: ClientSession): Promise<IOrder> {
    const order = new OrderModel(data);
    return (await order.save({ session })).toObject() as IOrder;
  }

  static async getNextOrderSequence(): Promise<number> {
    let counter = (await OrderCounterModel.findByIdAndUpdate(
      "order_sequence",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    ).lean().exec()) as unknown as IOrderCounter | null;

    if (!counter || counter.seq < 100001) {
      const existingCount = await OrderModel.countDocuments().exec();
      const initialSeq = Math.max(100000 + existingCount + 1, 100001);
      counter = (await OrderCounterModel.findByIdAndUpdate(
        "order_sequence",
        { $set: { seq: initialSeq } },
        { new: true, upsert: true }
      ).lean().exec()) as unknown as IOrderCounter | null;
    }

    return counter?.seq || 100001;
  }

  private static async populateItemImages(orders: any[]): Promise<void> {
    if (!orders || orders.length === 0) return;
    
    const missingProductIds = new Set<string>();
    const missingSkus = new Set<string>();
    for (const order of orders) {
      if (order && order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (!item.image) {
            if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
              missingProductIds.add(String(item.productId));
            } else if (item.sku) {
              missingSkus.add(String(item.sku));
            }
          }
        }
      }
    }

    if (missingProductIds.size === 0 && missingSkus.size === 0) return;

    try {
      const { ProductModel } = await import("../product/product.model");
      const orClauses: any[] = [];
      if (missingProductIds.size > 0) {
        orClauses.push({ _id: { $in: Array.from(missingProductIds) } });
      }
      if (missingSkus.size > 0) {
        orClauses.push({ sku: { $in: Array.from(missingSkus) } });
      }

      const products = await ProductModel.find({ $or: orClauses })
        .select("name images slug thumbnail image variants sku")
        .lean()
        .exec();

      const productMap = new Map<string, any>();
      const skuMap = new Map<string, any>();
      for (const p of products) {
        productMap.set(String(p._id), p);
        if (p.sku) skuMap.set(String(p.sku), p);
      }

      for (const order of orders) {
        if (order && order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            if (!item.image) {
              const p = (item.productId ? productMap.get(String(item.productId)) : null) || (item.sku ? skuMap.get(String(item.sku)) : null);
              if (p) {
                const variantObj = item.variantId ? p.variants?.find((v: any) => v.id === item.variantId || v.sku === item.variantId) : null;
                item.image = variantObj?.image || p.images?.[0]?.url || p.thumbnail || p.image || "";
                if (!item.slug) item.slug = p.slug || "";
                if (!item.name && p.name) item.name = p.name;
              }
            }
          }
        }
      }
    } catch {
      // Non-fatal, return plain orders
    }
  }

  static async findByUserId(userId: string, session?: ClientSession): Promise<IOrder[]> {
    const orders = await OrderModel.find({ userId }).session(session || null).sort({ createdAt: -1 }).lean().exec() as unknown as IOrder[];
    await OrderRepository.populateItemImages(orders);
    return orders;
  }

  static async findById(id: string, session?: ClientSession): Promise<IOrder | null> {
    const order = await OrderModel.findById(id).session(session || null).lean().exec() as unknown as IOrder | null;
    if (order) await OrderRepository.populateItemImages([order]);
    return order;
  }

  static async findByGatewayOrderId(gatewayOrderId: string, session?: ClientSession): Promise<IOrder | null> {
    const isObjectId = mongoose.Types.ObjectId.isValid(gatewayOrderId);
    return OrderModel.findOne({
      $or: [
        { gatewayOrderId },
        { orderNumber: gatewayOrderId },
        ...(isObjectId ? [{ _id: gatewayOrderId }] : [])
      ]
    }).session(session || null).lean().exec() as unknown as IOrder | null;
  }

  static async linkGuestOrders(email: string, userId: string): Promise<number> {
    if (!email || !userId) return 0;
    const cleanEmail = email.trim();
    const escaped = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const emailRegex = new RegExp(`^${escaped}$`, "i");

    const result = await OrderModel.updateMany(
      {
        $and: [
          {
            $or: [
              { guestEmail: emailRegex },
              { "shippingAddress.email": emailRegex },
            ],
          },
          {
            $or: [
              { userId: { $exists: false } },
              { userId: null },
              { userId: "" },
            ],
          },
        ],
      },
      {
        $set: {
          userId,
          guestEmail: cleanEmail.toLowerCase(),
        },
      }
    ).exec();
    return result.modifiedCount;
  }

  static async markStaleOrdersAsFailed(): Promise<number> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const result = await OrderModel.updateMany(
      { status: "pending_payment", createdAt: { $lt: thirtyMinutesAgo } },
      { $set: { status: "failed", failureReason: "Checkout abandoned / Payment window expired (30m)" } }
    ).exec();
    return result.modifiedCount;
  }
  static async findByIdempotencyKey(idempotencyKey: string, session?: ClientSession): Promise<IOrder | null> {
    return OrderModel.findOne({ idempotencyKey }).session(session || null).lean().exec() as unknown as IOrder | null;
  }

  static async atomicStatusTransition(id: string, fromStatus: string, toStatus: string, updateData?: any, session?: ClientSession): Promise<IOrder | null> {
    const update = { $set: { status: toStatus, ...updateData } };
    return OrderModel.findOneAndUpdate({ _id: id, status: fromStatus }, update, { new: true, session }).lean().exec() as unknown as IOrder | null;
  }

  static async updateStatus(id: string, status: string, gatewayData?: any, session?: ClientSession): Promise<IOrder | null> {
    const update: any = { status };
    if (gatewayData) {
      if (gatewayData.gatewayOrderId) update.gatewayOrderId = gatewayData.gatewayOrderId;
      if (gatewayData.paymentId) update.paymentId = gatewayData.paymentId;
      if (gatewayData.paymentSignature) update.paymentSignature = gatewayData.paymentSignature;
      if (gatewayData.failureReason) update.failureReason = gatewayData.failureReason;
    }
    return OrderModel.findByIdAndUpdate(id, update, { new: true, session }).lean().exec() as unknown as IOrder | null;
  }

  static async findPaginated(query: any, page: number, limit: number, session?: ClientSession) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      OrderModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).session(session || null).lean().exec(),
      OrderModel.countDocuments(query).session(session || null).exec()
    ]);
    await OrderRepository.populateItemImages(items);
    return { items, total };
  }

  static async deleteById(id: string, session?: ClientSession): Promise<void> {
    await OrderModel.findByIdAndDelete(id).session(session || null).exec();
  }

  static async addNote(id: string, note: import("@store4riders/shared-types").IOrderNote, session?: ClientSession): Promise<IOrder | null> {
    return OrderModel.findByIdAndUpdate(
      id,
      { $push: { notes: note } },
      { new: true, session }
    ).lean().exec() as unknown as IOrder | null;
  }

  static async updateWarehouse(id: string, warehouseId: string, note?: import("@store4riders/shared-types").IOrderNote, session?: ClientSession): Promise<IOrder | null> {
    const update: any = { $set: { warehouseId } };
    if (note) {
      update.$push = { notes: note };
    }
    return OrderModel.findByIdAndUpdate(id, update, { new: true, session }).lean().exec() as unknown as IOrder | null;
  }

  static async countUserOrders(userId?: string, guestEmail?: string): Promise<number> {
    const orConditions: any[] = [];
    if (userId) orConditions.push({ userId });
    if (guestEmail) orConditions.push({ guestEmail: guestEmail.toLowerCase().trim() });
    if (orConditions.length === 0) return 0;

    // Only count genuine confirmed/completed orders, ignore abandoned pending payments, cancellations or refunds
    return OrderModel.countDocuments({
      $or: orConditions,
      status: { $in: ["confirmed", "processing", "packed", "shipped", "delivered"] }
    }).exec();
  }

  static async countUserCouponUsage(couponCode: string, userId?: string, guestEmail?: string): Promise<number> {
    const orConditions: any[] = [];
    if (userId) orConditions.push({ userId });
    if (guestEmail) orConditions.push({ guestEmail: guestEmail.toLowerCase().trim() });
    if (orConditions.length === 0) return 0;

    // Only count coupon as redeemed if order was confirmed/paid
    return OrderModel.countDocuments({
      $or: orConditions,
      "pricing.couponCode": couponCode.toUpperCase().trim(),
      status: { $in: ["confirmed", "processing", "packed", "shipped", "delivered"] }
    }).exec();
  }
}


