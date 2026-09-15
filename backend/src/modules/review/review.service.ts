import { ReviewRepository } from "./review.repository";
import { IReview } from "@store4riders/shared-types";
import { ConflictError } from "../../core/errors/AppError";

/**
 * @class ReviewService
 * @description Core business logic for Product Reviews.
 * Highlights:
 * - Prevents users from reviewing the same product twice.
 */
export class ReviewService {
  
  static async addReview(userId: string, data: Partial<IReview>): Promise<IReview> {
    const existing = await ReviewRepository.findByUserAndProduct(userId, data.productId!);
    if (existing) {
      throw new ConflictError("You have already reviewed this product");
    }

    const review = await ReviewRepository.create({ ...data, userId });
    
    // In a real app we'd recalculate the product's average rating here using aggregate
    // and update the Product document.
    
    return review;
  }

  static async getProductReviews(productId: string): Promise<IReview[]> {
    return ReviewRepository.findByProductId(productId);
  }
}
