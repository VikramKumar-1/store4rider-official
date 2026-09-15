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

  static async findByRazorpayOrderId(razorpayOrderId: string, session?: ClientSession): Promise<IOrder | null> {
    return OrderModel.findOne({ razorpayOrderId }).session(session || null).lean().exec() as unknown as IOrder | null;
  }

  static async updateStatus(id: string, status: string, razorpayData?: any, session?: ClientSession): Promise<IOrder | null> {
    const update: any = { status };
    if (razorpayData) {
      if (razorpayData.razorpayOrderId) update.razorpayOrderId = razorpayData.razorpayOrderId;
      if (razorpayData.paymentId) update.paymentId = razorpayData.paymentId;
      if (razorpayData.paymentSignature) update.paymentSignature = razorpayData.paymentSignature;
    }
    return OrderModel.findByIdAndUpdate(id, update, { new: true, session }).lean().exec() as unknown as IOrder | null;
  }
}
