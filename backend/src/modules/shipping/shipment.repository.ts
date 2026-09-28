import { IShipment, ShipmentStatus, ITrackingEvent } from "@store4riders/shared-types";
import { ShipmentModel, ShipmentDocument } from "./shipment.model";
import { ClientSession } from "mongoose";

// Lean document type (plain JS object returned by .lean())
type LeanShipment = IShipment & { _id: string };

export class ShipmentRepository {
  static async create(data: Partial<IShipment>, session?: ClientSession): Promise<ShipmentDocument> {
    const shipment = new ShipmentModel(data);
    return shipment.save({ session });
  }

  static async findById(id: string, session?: ClientSession): Promise<LeanShipment | null> {
    return ShipmentModel.findById(id).session(session || null).lean<LeanShipment>().exec();
  }

  static async findByOrderId(orderId: string, session?: ClientSession): Promise<LeanShipment[]> {
    return ShipmentModel.find({ orderId }).session(session || null).lean<LeanShipment[]>().exec();
  }

  static async findByAwb(awb: string, session?: ClientSession): Promise<LeanShipment | null> {
    return ShipmentModel.findOne({ awb }).session(session || null).lean<LeanShipment>().exec();
  }

  static async findPaginated(query: any, page: number, limit: number, session?: ClientSession) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      ShipmentModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).session(session || null).lean<LeanShipment[]>().exec(),
      ShipmentModel.countDocuments(query).session(session || null).exec()
    ]);
    return { items, total };
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
