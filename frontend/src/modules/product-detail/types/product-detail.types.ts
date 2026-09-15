export interface ProductImage {
  url: string;
  altText: string;
}

export interface KitProduct {
  id: string;
  name: string;
  category: string;
  priceFormatted: string;
  imageUrl: string;
  productUrl: string;
}

export interface ReviewData {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
}

export interface ColorOption {
  name: string;
  background: string;
}

export interface PDPData {
  id: string;
  slug: string;
  category: string;
  name: string;
  rating: number;
  reviewCount: number;
  originalPriceFormatted?: string;
  discountBadge?: string;
  priceFormatted: string;
  shortDescription: string;
  fullDescription: string;
  images: ProductImage[];
  colors: ColorOption[];
  sizes: string[];
  kitProducts: KitProduct[];
  storeReviews: ReviewData[];
  productReviews: ReviewData[];
  upSellProducts: KitProduct[];
}

export interface ProductDetailProps {
  product: PDPData;
}
