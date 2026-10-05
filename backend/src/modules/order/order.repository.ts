/**
 * @class OrderRepository
 * @description Direct database access layer for Orders.
 * Keeps Mongoose specifics completely hidden from the Service layer.
 */
import mongoose, { ClientSession } from "mongoose";
import { OrderModel } from "./order.model";
import { IOrder } from "@store4riders/shared-types";

export class OrderRepository {
  static async create(data: Partial<IOrder>, session?: ClientSession): Promise<IOrder> {
    const order = new OrderModel(data);
    return (await order.save({ session })).toObject() as IOrder;
  }

  static async findByUserId(userId: string, session?: ClientSession): Promise<IOrder[]> {
    return OrderModel.find({ userId }).session(session || null).sort({ createdAt: -1 }).lean().exec() as unknown as IOrder[];
  }

  static async findById(id: string, session?: ClientSession): Promise<IOrder | null> {
    return OrderModel.findById(id).session(session || null).lean().exec() as unknown as IOrder | null;
  }

  static async findByGatewayOrderId(gatewayOrderId: string, session?: ClientSession): Promise<IOrder | null> {
    return OrderModel.findOne({ gatewayOrderId }).session(session || null).lean().exec() as unknown as IOrder | null;
  }

  static async linkGuestOrders(email: string, userId: string): Promise<number> {
    const result = await OrderModel.updateMany(
      { "customerInfo.email": email, userId: { $exists: false } },
      { $set: { userId } }
    ).exec();
    return result.modifiedCount;
  }

  static async markStaleOrdersAsFailed(): Promise<number> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const result = await OrderModel.updateMany(
      { status: "pending_payment", createdAt: { $lt: thirtyMinutesAgo } },
      { $set: { status: "failed" } }
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
    }
    return OrderModel.findByIdAndUpdate(id, update, { new: true, session }).lean().exec() as unknown as IOrder | null;
  }

  static async findPaginated(query: any, page: number, limit: number, session?: ClientSession) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      OrderModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).session(session || null).lean().exec(),
      OrderModel.countDocuments(query).session(session || null).exec()
    ]);
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
}

