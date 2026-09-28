import { WarehouseModel, WarehouseDocument } from "./warehouse.model";
import { IWarehouse } from "@store4riders/shared-types";

// Lean document type (plain JS object returned by .lean())
type LeanWarehouse = IWarehouse & { _id: string };

export class WarehouseRepository {
  static async create(data: Partial<IWarehouse>): Promise<WarehouseDocument> {
    const warehouse = new WarehouseModel(data);
    return warehouse.save();
  }

  static async findById(id: string): Promise<LeanWarehouse | null> {
    return WarehouseModel.findById(id).lean<LeanWarehouse>().exec();
  }

  static async findByCode(code: string): Promise<LeanWarehouse | null> {
    return WarehouseModel.findOne({ warehouseCode: code }).lean<LeanWarehouse>().exec();
  }

  static async findDefault(): Promise<LeanWarehouse | null> {
    return WarehouseModel.findOne({ isDefault: true }).lean<LeanWarehouse>().exec();
  }

  static async findAll(): Promise<LeanWarehouse[]> {
    return WarehouseModel.find().lean<LeanWarehouse[]>().exec();
  }

  static async update(id: string, data: Partial<IWarehouse>): Promise<LeanWarehouse | null> {
    return WarehouseModel.findByIdAndUpdate(id, data, { new: true }).lean<LeanWarehouse>().exec();
  }

  static async delete(id: string): Promise<LeanWarehouse | null> {
    return WarehouseModel.findByIdAndDelete(id).lean<LeanWarehouse>().exec();
  }

  static async unsetAllDefault(excludeId?: string): Promise<void> {
    const query: any = {};
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    await WarehouseModel.updateMany(query, { $set: { isDefault: false } }).exec();
  }
}
