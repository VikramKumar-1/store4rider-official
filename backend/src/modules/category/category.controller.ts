import { NextRequest } from "next/server";
import { CategoryService } from "./category.service";
import { CategoryValidator } from "./category.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

/**
 * @class CategoryController
 * @description Minimal HTTP controller for Category operations.
 * Responsibilities:
 * 1. Extract request data via CategoryValidator.
 * 2. Delegate business logic to CategoryService.
 * 3. Return standardized API responses.
 */
export class CategoryController {
  
  static async getTree(req: NextRequest) {
    const tree = await CategoryService.getCategoryTree();
    return ApiResponse.success(tree, "Category tree fetched successfully");
  }

  static async create(req: NextRequest) {
    const validatedData = await CategoryValidator.validateCreate(req);
    const category = await CategoryService.createCategory(validatedData);
    return ApiResponse.success(category, "Category created successfully", 201);
  }

  static async update(req: NextRequest, id: string) {
    const validatedData = await CategoryValidator.validateUpdate(req);
    const category = await CategoryService.updateCategory(id, validatedData);
    return ApiResponse.success(category, "Category updated successfully");
  }

  static async delete(req: NextRequest, id: string) {
    await CategoryService.deleteCategory(id);
    return ApiResponse.success(null, "Category deleted successfully");
  }
}
