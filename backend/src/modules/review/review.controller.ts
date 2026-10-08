import { NextRequest } from "next/server";
import { ReviewService } from "./review.service";
import { ReviewValidator } from "./review.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

/**
 * @class ReviewController
 * @description Minimal HTTP controller for Product & Store Reviews.
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

  static async getStoreReviews(req: NextRequest) {
    const reviews = await ReviewService.getStoreReviews();
    return ApiResponse.success(reviews, "Store reviews fetched successfully");
  }

  static async syncGoogleReviews(req: NextRequest) {
    let apiKey: string | undefined;
    try {
      const body = await req.json();
      apiKey = body.apiKey;
    } catch {
      // Body may be empty if key is in env
    }

    const reviews = await ReviewService.syncGoogleReviews(apiKey);
    return ApiResponse.success(reviews, `Successfully fetched and saved ${reviews.length} Google reviews`, 200);
  }
}
