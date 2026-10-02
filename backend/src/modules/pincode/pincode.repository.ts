import { PincodeModel } from "./pincode.model";
import { IPincode } from "@store4riders/shared-types";

export class PincodeRepository {
  static async findByPincode(pincode: string): Promise<IPincode | null> {
    return PincodeModel.findOne({ pincode }).lean().exec() as unknown as IPincode | null;
  }

  static async bulkWrite(operations: any[]) {
    return PincodeModel.bulkWrite(operations, { ordered: false });
  }

  static async count(): Promise<number> {
    return PincodeModel.countDocuments().exec();
  }

  static async getDistinctStates(): Promise<string[]> {
    return PincodeModel.distinct("state").exec();
  }
}
