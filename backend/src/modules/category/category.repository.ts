/**
 * @class CategoryRepository
 * @description Direct database access layer for Categories.
 * Keeps Mongoose specifics completely hidden from the Service layer.
 */
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
}
