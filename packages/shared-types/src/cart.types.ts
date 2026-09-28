export interface ICartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product?: any;
}
export interface ICartSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}
export interface ICart {
  id: string;
  userId: string;
  items: ICartItem[];
  summary: ICartSummary;
  updatedAt: Date;
}
