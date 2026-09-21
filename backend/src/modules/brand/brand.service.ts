import { BrandRepository } from "./brand.repository";
import { IBrand } from "@store4riders/shared-types";
import { NotFoundError } from "../../core/errors/AppError";

export class BrandService {
  static async getAllBrands() {
    return await BrandRepository.findAll();
  }

  static async getBrandById(id: string) {
    const brand = await BrandRepository.findById(id);
    if (!brand) throw new NotFoundError("Brand not found");
    return brand;
  }

  static async createBrand(data: Partial<IBrand>) {
    return await BrandRepository.create(data);
  }

  static async updateBrand(id: string, data: Partial<IBrand>) {
    const brand = await BrandRepository.update(id, data);
    if (!brand) throw new NotFoundError("Brand not found");
    return brand;
  }

  static async deleteBrand(id: string) {
    const brand = await BrandRepository.delete(id);
    if (!brand) throw new NotFoundError("Brand not found");
    return brand;
  }
}
