import { ReviewRepository } from "./review.repository";
import { IReview, IStoreReview } from "@store4riders/shared-types";
import { ConflictError, ValidationError, AppError, NotFoundError } from "../../core/errors/AppError";
import { logger } from "../../core/utils/logger";

/**
 * @class ReviewService
 * @description Core business logic for Product & Store (Google) Reviews.
 */
export class ReviewService {
  
  static async addReview(userId: string, data: Partial<IReview>): Promise<IReview> {
    const existing = await ReviewRepository.findByUserAndProduct(userId, data.productId!);
    if (existing) {
      throw new ConflictError("You have already reviewed this product");
    }

    const review = await ReviewRepository.create({ ...data, userId });
    return review;
  }

  static async getProductReviews(productId: string): Promise<IReview[]> {
    return ReviewRepository.findByProductId(productId);
  }

  static async getStoreReviews(): Promise<IStoreReview[]> {
    return ReviewRepository.getStoreReviews();
  }

  static async syncGoogleReviews(apiKey?: string): Promise<IStoreReview[]> {
    const resolvedKey = apiKey || process.env.SERPAPI_KEY;
    if (!resolvedKey) {
      throw new ValidationError("SerpApi key is required. Please provide it in the request or set SERPAPI_KEY in environment variables.");
    }

    const url = `https://serpapi.com/search.json?engine=google_maps_reviews&data_id=0x3bc2c00d5a48819f:0xd4b529549919577c&api_key=${resolvedKey}&sort_by=newestFirst`;
    
    logger.info("Fetching Google Reviews from SerpApi", { urlSnippet: "serpapi.com/search.json?engine=google_maps_reviews" });

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      logger.error("SerpApi returned error", { error: data.error });
      throw new AppError(`SerpApi error: ${data.error}`, 502);
    }

    if (!data.reviews || !Array.isArray(data.reviews) || data.reviews.length === 0) {
      throw new NotFoundError("No reviews returned from SerpApi for this location");
    }

    const latest10 = data.reviews.slice(0, 10).map((r: any, idx: number) => ({
      author: r.user?.name || "Customer",
      rating: typeof r.rating === "number" ? r.rating : 5,
      date: r.date || "Recently",
      text: r.snippet || "",
      link: r.link || r.share_link || "https://www.google.com/search?q=Store4Riders+Pune#lrd=0x3bc2c00d5a48819f:0xd4b529549919577c,1,,,,",
      avatarUrl: r.user?.thumbnail || undefined,
      source: "google" as const,
      externalId: r.review_id || `google-rev-${idx}`,
      isActive: true,
    }));

    const saved = await ReviewRepository.saveStoreReviews(latest10);
    logger.info(`Successfully saved ${saved.length} store reviews to database`);
    return saved;
  }
}
