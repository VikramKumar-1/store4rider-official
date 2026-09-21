import { NextRequest } from "next/server";
import { BrandService } from "./brand.service";
import { BrandValidator } from "./brand.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

export class BrandController {
  static async getAll(req: NextRequest) {
    const brands = await BrandService.getAllBrands();
    return ApiResponse.success(brands, "Brands fetched successfully");
  }

  static async getById(req: NextRequest, id: string) {
    const brand = await BrandService.getBrandById(id);
    return ApiResponse.success(brand, "Brand fetched successfully");
  }

  static async create(req: NextRequest) {
    const validatedData = await BrandValidator.validateCreate(req);
    const brand = await BrandService.createBrand(validatedData);
    return ApiResponse.success(brand, "Brand created successfully", 201);
  }

  static async update(req: NextRequest, id: string) {
    const validatedData = await BrandValidator.validateUpdate(req);
    const brand = await BrandService.updateBrand(id, validatedData);
    return ApiResponse.success(brand, "Brand updated successfully");
  }

  static async delete(req: NextRequest, id: string) {
    const brand = await BrandService.deleteBrand(id);
    return ApiResponse.success(brand, "Brand deleted successfully");
  }
}
