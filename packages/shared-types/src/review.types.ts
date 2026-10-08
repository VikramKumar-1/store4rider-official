export interface IReview {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IStoreReview {
  id?: string;
  _id?: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  link?: string;
  avatarUrl?: string;
  source?: "google" | "manual";
  externalId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
