import { NextRequest } from "next/server";
import { createCategorySchema } from "@store4riders/shared-validation";

/**
 * CategoryValidator
 * 
 * Handles extracting data from incoming HTTP requests and validating it
 * against the predefined Zod schemas. This keeps controllers clean.
 */
export class CategoryValidator {
  /**
   * Validates the payload for creating a new category.
   * 
   * @param {NextRequest} req - The incoming HTTP request containing the JSON body.
   * @returns {Promise<any>} The parsed and validated category data.
   * @throws Will throw a validation error if the payload is invalid.
   */
  static async validateCreate(req: NextRequest) {
    const body = await req.json();
    return createCategorySchema.parse(body);
  }

  static async validateUpdate(req: NextRequest) {
    const body = await req.json();
    const { updateCategorySchema } = await import("@store4riders/shared-validation");
    return updateCategorySchema.parse(body);
  }
}
