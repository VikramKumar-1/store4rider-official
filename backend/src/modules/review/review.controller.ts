import { NextRequest } from "next/server";
import { ReviewService } from "./review.service";
import { ReviewValidator } from "./review.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

/**
 * @class ReviewController
 * @description Minimal HTTP controller for Product Reviews.
 * Responsibilities:
 * 1. Extract and validate payloads via ReviewValidator.
 * 2. Delegate to ReviewService.
 * 3. Return standardized API responses.
 */
export class ReviewController {
  
  static async create(req: NextRequest) {
    const { userId, data } = await ReviewValidator.validateCreate(req);
    const review = await ReviewService.addReview(userId, data);
    return ApiResponse.success(review, "Review added successfully", 201);
  }

  static async getByProduct(req: NextRequest, productId: string) {
    const reviews = await ReviewService.getProductReviews(productId);
    return ApiResponse.success(reviews, "Reviews fetched successfully");
  }
}
