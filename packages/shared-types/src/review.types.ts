export interface IReview {
  id?: string;
  _id?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  city?: string;
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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
