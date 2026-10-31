export interface INewsletterSubscriber {
  id?: string;
  _id?: string;
  email: string;
  isActive: boolean;
  source?: string;
  token?: string;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
