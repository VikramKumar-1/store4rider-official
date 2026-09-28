import { ClientSession } from "mongoose";
import { ReturnModel, IReturn } from "./return.model";

export class ReturnRepository {
  static async create(data: Partial<IReturn>, session?: ClientSession): Promise<IReturn> {
    const returnDoc = new ReturnModel(data);
    return await returnDoc.save({ session });
  }

  static async findById(id: string, session?: ClientSession): Promise<IReturn | null> {
    return await ReturnModel.findById(id).session(session || null).exec();
  }

  static async findByOrderId(orderId: string): Promise<IReturn[]> {
    return await ReturnModel.find({ orderId }).exec();
  }

  static async updateStatus(
    id: string, 
    status: IReturn["status"], 
    extraData: Partial<IReturn> = {},
    session?: ClientSession
  ): Promise<IReturn | null> {
    return await ReturnModel.findByIdAndUpdate(
      id,
      { $set: { status, ...extraData } },
      { new: true, session: session || null }
    ).exec();
  }

  static async findPendingAutoRefunds(hoursThreshold: number = 48): Promise<IReturn[]> {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

    return await ReturnModel.find({
      status: "inwarded_for_qc",
      inwardedAt: { $lte: thresholdDate }
    }).exec();
  }
}
