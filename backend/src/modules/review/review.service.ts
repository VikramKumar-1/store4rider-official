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

    // Recalculate average rating & review count for the product
    try {
      const stats = await ReviewRepository.calculateRatingStats(data.productId!);
      const { ProductRepository } = await import("../product/product.repository");
      await ProductRepository.updateRatingStats(data.productId!, stats.avgRating, stats.reviewCount);
      logger.info(`Updated rating stats for product ${data.productId}`, stats);
    } catch (err: any) {
      logger.error("Failed to update product rating stats", { error: err.message, productId: data.productId });
    }

    return review;
  }

  static async getProductReviews(productId: string): Promise<IReview[]> {
    return ReviewRepository.findByProductId(productId);
  }

  static async getStoreReviews(
    limit: number = 10,
    random: boolean = false,
    excludeIds: string[] = []
  ): Promise<IStoreReview[]> {
    let reviews = await ReviewRepository.getStoreReviews(limit, random, excludeIds);
    if (reviews.length === 0 && process.env.SERPAPI_KEY) {
      try {
        logger.info("Store reviews collection is empty in DB. Auto-syncing from Google via SerpApi...");
        reviews = await this.syncGoogleReviews();
      } catch (err: any) {
        logger.warn("Auto-syncing Google reviews on empty state failed", { error: err.message });
      }
    }
    return reviews;
  }

  static async syncGoogleReviews(apiKey?: string, pages: number = 1): Promise<IStoreReview[]> {
    const resolvedKey = apiKey || process.env.SERPAPI_KEY;
    if (!resolvedKey) {
      throw new ValidationError("SerpApi key is required. Please provide it in the request or set SERPAPI_KEY in environment variables.");
    }

    const maxPages = Math.min(Math.max(pages, 1), 10);
    const allReviews: any[] = [];
    let nextToken: string | undefined = undefined;

    logger.info(`Fetching up to ${maxPages} page(s) of Google Reviews from SerpApi`);

    for (let p = 0; p < maxPages; p++) {
      let url = `https://serpapi.com/search.json?engine=google_maps_reviews&data_id=0x3bc2c00d5a48819f:0xd4b529549919577c&api_key=${resolvedKey}`;
      if (nextToken) {
        url += `&next_page_token=${encodeURIComponent(nextToken)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        if (allReviews.length > 0) break;
        logger.error("SerpApi returned error", { error: data.error });
        throw new AppError(`SerpApi error: ${data.error}`, 502);
      }

      if (!data.reviews || !Array.isArray(data.reviews) || data.reviews.length === 0) {
        break;
      }

      allReviews.push(...data.reviews);
      nextToken = data.serpapi_pagination?.next_page_token;
      if (!nextToken) break;
    }

    if (allReviews.length === 0) {
      throw new NotFoundError("No reviews returned from SerpApi for this location");
    }

    const mapped = allReviews.map((r: any, idx: number) => ({
      author: r.user?.name || "Customer",
      rating: typeof r.rating === "number" ? r.rating : 5,
      date: r.date || "Recently",
      text: r.snippet || r.extracted_snippet?.original || "",
      link: r.link || r.share_link || "https://www.google.com/search?q=Store4Riders+Pune#lrd=0x3bc2c00d5a48819f:0xd4b529549919577c,1,,,,",
      avatarUrl: r.user?.thumbnail || undefined,
      source: "google" as const,
      externalId: r.review_id || `google-rev-${(r.user?.name || "customer").toLowerCase().replace(/[^a-z0-9]/g, "-")}-${idx}`,
      isActive: true,
    }));

    const saved = await ReviewRepository.saveStoreReviews(mapped);
    logger.info(`Successfully saved ${saved.length} store reviews to database across ${maxPages} page(s)`);
    return saved;
  }

  static async getAccountStatus(apiKey?: string): Promise<{
    planName: string;
    searchesPerMonth: number;
    searchesLeft: number;
    usageThisMonth: number;
    renewalDate: string | null;
  } | null> {
    const resolvedKey = apiKey || process.env.SERPAPI_KEY;
    if (!resolvedKey) return null;

    try {
      const res = await fetch(`https://serpapi.com/account.json?api_key=${resolvedKey}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        planName: data.plan_name || "Free Plan",
        searchesPerMonth: data.searches_per_month ?? 250,
        searchesLeft: data.total_searches_left ?? data.plan_searches_left ?? 0,
        usageThisMonth: data.this_month_usage ?? 0,
        renewalDate: data.plan_renewal_date || null,
      };
    } catch {
      return null;
    }
  }

}
