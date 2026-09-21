import { BrandModel } from "./brand.model";
import { IBrand } from "@store4riders/shared-types";

export class BrandRepository {
  static async findAll(): Promise<IBrand[]> {
    return BrandModel.find().lean().exec() as unknown as IBrand[];
  }

  static async findById(id: string): Promise<IBrand | null> {
    return BrandModel.findById(id).lean().exec() as unknown as IBrand | null;
  }

  static async create(data: Partial<IBrand>): Promise<IBrand> {
    const brand = new BrandModel(data);
    return (await brand.save()).toObject() as IBrand;
  }

  static async update(id: string, data: Partial<IBrand>): Promise<IBrand | null> {
    return BrandModel.findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec() as unknown as IBrand | null;
  }

  static async delete(id: string): Promise<IBrand | null> {
    return BrandModel.findByIdAndDelete(id).lean().exec() as unknown as IBrand | null;
  }
}
