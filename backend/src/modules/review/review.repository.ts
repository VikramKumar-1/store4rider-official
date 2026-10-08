import { ReviewModel, StoreReviewModel } from "./review.model";
import { IReview, IStoreReview } from "@store4riders/shared-types";

export class ReviewRepository {
  static async create(data: Partial<IReview>): Promise<IReview> {
    const review = new ReviewModel(data);
    return (await review.save()).toObject() as IReview;
  }

  static async findByProductId(productId: string): Promise<IReview[]> {
    return ReviewModel.find({ productId }).sort({ createdAt: -1 }).lean().exec() as unknown as IReview[];
  }

  static async findByUserAndProduct(userId: string, productId: string): Promise<IReview | null> {
    return ReviewModel.findOne({ userId, productId }).lean().exec() as unknown as IReview | null;
  }

  static async getStoreReviews(): Promise<IStoreReview[]> {
    return StoreReviewModel.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec() as unknown as IStoreReview[];
  }

  static async saveStoreReviews(reviews: Partial<IStoreReview>[]): Promise<IStoreReview[]> {
    await StoreReviewModel.deleteMany({});
    const created = await StoreReviewModel.insertMany(reviews);
    return JSON.parse(JSON.stringify(created)) as IStoreReview[];
  }
}
