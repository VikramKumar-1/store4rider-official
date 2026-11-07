/**
 * @class CategoryRepository
 * @description Direct database access layer for Categories.
 * Keeps Mongoose specifics completely hidden from the Service layer.
 */
import mongoose from "mongoose";
import { CategoryModel } from "./category.model";
import { ICategory } from "@store4riders/shared-types";

export class CategoryRepository {
  static async findAll(): Promise<ICategory[]> {
    return CategoryModel.find().lean().exec() as unknown as ICategory[];
  }

  static async findBySlug(slug: string): Promise<ICategory | null> {
    return CategoryModel.findOne({ slug }).lean().exec() as unknown as ICategory | null;
  }

  static async create(data: Partial<ICategory>): Promise<ICategory> {
    const category = new CategoryModel(data);
    return (await category.save()).toObject() as ICategory;
  }

  static async findById(id: string): Promise<ICategory | null> {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const byId = await CategoryModel.findById(id).lean().exec();
      if (byId) return byId as unknown as ICategory;
    }
    return CategoryModel.findOne({ $or: [{ slug: id }, { id }] }).lean().exec() as unknown as ICategory | null;
  }

  static async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const updated = await CategoryModel.findByIdAndUpdate(id, data, { new: true }).lean().exec();
      if (updated) return updated as unknown as ICategory;
    }
    return CategoryModel.findOneAndUpdate({ $or: [{ slug: id }, { id }] }, data, { new: true }).lean().exec() as unknown as ICategory | null;
  }

  static async updateMany(filter: Record<string, any>, data: Record<string, any>): Promise<void> {
    await CategoryModel.updateMany(filter, data).exec();
  }

  static async delete(id: string): Promise<void> {
    if (mongoose.Types.ObjectId.isValid(id)) {
      await CategoryModel.findByIdAndDelete(id).exec();
      return;
    }
    await CategoryModel.findOneAndDelete({ $or: [{ slug: id }, { id }] }).exec();
  }
}
