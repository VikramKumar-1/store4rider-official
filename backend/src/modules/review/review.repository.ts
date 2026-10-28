import { Types } from "mongoose";
import { ReviewModel, StoreReviewModel } from "./review.model";
import { IReview, IStoreReview } from "@store4riders/shared-types";

export class ReviewRepository {
  static async create(data: Partial<IReview>): Promise<IReview> {
    const review = new ReviewModel(data);
    return (await review.save()).toObject() as IReview;
  }

  static async findByProductId(productId: string): Promise<IReview[]> {
    return ReviewModel.find({ productId })
      .sort({ createdAt: -1 })
      .select("-userEmail")
      .lean()
      .exec() as unknown as IReview[];
  }

  static async findByUserAndProduct(userId: string, productId: string): Promise<IReview | null> {
    return ReviewModel.findOne({ userId, productId }).lean().exec() as unknown as IReview | null;
  }

  static async calculateRatingStats(productId: string): Promise<{ avgRating: number; reviewCount: number }> {
    const reviews = await ReviewModel.find({ productId }).select("rating").lean().exec();
    if (!reviews || reviews.length === 0) {
      return { avgRating: 0, reviewCount: 0 };
    }
    const total = reviews.reduce((sum, r: any) => sum + (r.rating || 0), 0);
    const avgRating = Number((total / reviews.length).toFixed(1));
    return { avgRating, reviewCount: reviews.length };
  }

  static async getStoreReviews(
    limit: number = 20,
    random: boolean = false,
    excludeIds: string[] = []
  ): Promise<IStoreReview[]> {
    const matchConditions: any = { isActive: true };

    if (excludeIds && excludeIds.length > 0) {
      const validObjectIds = excludeIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      matchConditions.$and = [
        ...(validObjectIds.length > 0 ? [{ _id: { $nin: validObjectIds } }] : []),
        { externalId: { $nin: excludeIds } },
      ];
    }

    if (random) {
      return StoreReviewModel.aggregate([
        { $match: matchConditions },
        { $sort: { createdAt: -1 } },
        { $limit: 50 },
        { $sample: { size: limit } },
      ]).exec() as unknown as IStoreReview[];
    }

    return StoreReviewModel.find(matchConditions)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec() as unknown as IStoreReview[];
  }

  static async countStoreReviews(): Promise<number> {
    return StoreReviewModel.countDocuments({ isActive: true });
  }

  static async saveStoreReviews(reviews: Partial<IStoreReview>[]): Promise<IStoreReview[]> {
    if (!reviews || reviews.length === 0) {
      return this.getStoreReviews(100);
    }

    const operations = reviews.map((r, idx) => {
      const externalId =
        r.externalId ||
        `google-review-${(r.author || "customer").toLowerCase().replace(/[^a-z0-9]/g, "-")}-${idx}`;

      return {
        updateOne: {
          filter: { externalId },
          update: {
            $set: {
              author: r.author,
              rating: typeof r.rating === "number" ? r.rating : 5,
              date: r.date || "Recently",
              text: r.text || "",
              link: r.link,
              avatarUrl: r.avatarUrl,
              source: r.source || "google",
              externalId,
              isActive: r.isActive !== undefined ? r.isActive : true,
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    await StoreReviewModel.bulkWrite(operations);
    return this.getStoreReviews(100);
  }
}
