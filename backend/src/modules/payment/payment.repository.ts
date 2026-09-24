import { IPayment, PaymentStatus, IRefund } from "@store4riders/shared-types";
import { PaymentModel, PaymentDocument } from "./payment.model";
import { ClientSession } from "mongoose";

export class PaymentRepository {
  static async create(data: Partial<IPayment>, session?: ClientSession): Promise<PaymentDocument> {
    const payment = new PaymentModel(data);
    return payment.save({ session });
  }

  static async findById(id: string, session?: ClientSession): Promise<PaymentDocument | null> {
    return PaymentModel.findById(id).session(session || null).exec();
  }

  static async findByGatewayOrderId(gatewayOrderId: string, session?: ClientSession): Promise<PaymentDocument | null> {
    return PaymentModel.findOne({ gatewayOrderId }).session(session || null).exec();
  }

  static async findByIdempotencyKey(idempotencyKey: string, session?: ClientSession): Promise<PaymentDocument | null> {
    return PaymentModel.findOne({ idempotencyKey }).session(session || null).exec();
  }

  static async atomicStatusTransition(
    id: string,
    fromStatus: PaymentStatus | PaymentStatus[],
    toStatus: PaymentStatus,
    updates: Partial<IPayment> = {},
    session?: ClientSession
  ): Promise<PaymentDocument | null> {
    const statuses = Array.isArray(fromStatus) ? fromStatus : [fromStatus];
    
    return PaymentModel.findOneAndUpdate(
      { _id: id, status: { $in: statuses } },
      { $set: { status: toStatus, ...updates } },
      { new: true, session }
    ).exec();
  }

  static async addWebhookEvent(id: string, eventId: string, session?: ClientSession): Promise<PaymentDocument | null> {
    return PaymentModel.findByIdAndUpdate(
      id,
      { $addToSet: { webhookEvents: eventId } },
      { new: true, session }
    ).exec();
  }

  static async hasProcessedEvent(id: string, eventId: string): Promise<boolean> {
    const payment = await PaymentModel.findOne({ _id: id, webhookEvents: eventId }).lean().exec();
    return !!payment;
  }

  static async addRefund(id: string, refund: IRefund, session?: ClientSession): Promise<PaymentDocument | null> {
    return PaymentModel.findByIdAndUpdate(
      id,
      { $push: { refunds: refund } },
      { new: true, session }
    ).exec();
  }
}
