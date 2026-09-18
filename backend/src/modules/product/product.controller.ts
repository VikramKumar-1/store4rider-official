import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "./product.service";
import { ApiResponse } from "../../core/response/ApiResponse";
import { ProductValidator } from "./product.validator";

/**
 * @class ProductController
 * @description Minimal HTTP controller for Products.
 * Responsibilities:
 * 1. Extract search queries and JSON payloads via ProductValidator.
 * 2. Delegate to ProductService.
 * 3. Return paginated or standard API responses.
 */
export class ProductController {
  
  static async list(req: NextRequest) {
    const { filters, page, limit, sort } = ProductValidator.validateListQuery(req);
    const { items, totalCount } = await ProductService.getProducts(filters, page, limit, sort);
    return ApiResponse.paginated(items, totalCount, page, limit);
  }

  static async getBySlug(req: NextRequest, slug: string) {
    const product = await ProductService.getProductBySlug(slug);
    return ApiResponse.success(product, "Product fetched successfully");
  }

  static async getBySkus(req: NextRequest) {
    const url = new URL(req.url);
    const skusParam = url.searchParams.get('skus') || '';
    const skus = skusParam.split(',').map(s => s.trim()).filter(Boolean);
    const products = await ProductService.getProductsBySkus(skus);
    return ApiResponse.success(products, 'Products fetched successfully');
  }

  static async create(req: NextRequest) {
    const validatedData = await ProductValidator.validateCreate(req);
    const product = await ProductService.createProduct(validatedData as any);
    return ApiResponse.success(product, "Product created successfully", 201);
  }

  static async update(req: NextRequest, id: string) {
    const validatedData = await ProductValidator.validateUpdate(req);
    const product = await ProductService.updateProduct(id, validatedData as any);
    return ApiResponse.success(product, "Product updated successfully");
  }

  static async delete(req: NextRequest, id: string) {
    await ProductService.deleteProduct(id);
    return ApiResponse.success(null, "Product deleted successfully");
  }
}
