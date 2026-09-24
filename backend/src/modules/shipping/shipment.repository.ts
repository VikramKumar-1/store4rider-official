import { IShipment, ShipmentStatus, ITrackingEvent } from "@store4riders/shared-types";
import { ShipmentModel, ShipmentDocument } from "./shipment.model";
import { ClientSession } from "mongoose";

export class ShipmentRepository {
  static async create(data: Partial<IShipment>, session?: ClientSession): Promise<ShipmentDocument> {
    const shipment = new ShipmentModel(data);
    return shipment.save({ session });
  }

  static async findById(id: string, session?: ClientSession): Promise<ShipmentDocument | null> {
    return ShipmentModel.findById(id).session(session || null).exec();
  }

  static async findByOrderId(orderId: string, session?: ClientSession): Promise<ShipmentDocument[]> {
    return ShipmentModel.find({ orderId }).session(session || null).exec();
  }

  static async findByAwb(awb: string, session?: ClientSession): Promise<ShipmentDocument | null> {
    return ShipmentModel.findOne({ awb }).session(session || null).exec();
  }

  static async updateStatus(
    id: string,
    status: ShipmentStatus,
    updates: Partial<IShipment> = {},
    session?: ClientSession
  ): Promise<ShipmentDocument | null> {
    return ShipmentModel.findByIdAndUpdate(
      id,
      { $set: { status, ...updates } },
      { new: true, session }
    ).exec();
  }

  static async addTrackingEvent(id: string, event: ITrackingEvent, session?: ClientSession): Promise<ShipmentDocument | null> {
    return ShipmentModel.findByIdAndUpdate(
      id,
      { $push: { events: event } },
      { new: true, session }
    ).exec();
  }
}
