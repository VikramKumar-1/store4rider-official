export interface ProductImage {
  url: string;
  altText: string;
  detectedColor?: string;
  angle?: number;
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
  _id?: string;
  id?: string;
  author: string;
  city?: string;
  rating: number;
  date: string;
  text: string;
  title?: string;
  link?: string;
  isVerified?: boolean;
}

export interface ColorOption {
  name: string;
  background: string;
  imageUrl?: string;
}

export interface PDPData {
  id: string;
  sku?: string;
  slug: string;
  brand?: string;
  brandSlug?: string;
  brandLogo?: string;
  productType?: string;
  category: string;
  categorySlug?: string;
  name: string;
  price?: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  originalPriceFormatted?: string;
  discountBadge?: string;
  priceFormatted: string;
  shortDescription: string;
  fullDescription: string;
  sizeChart?: string;
  images: ProductImage[];
  colorImages?: Record<string, string>;
  colorSwatches?: Record<string, string>;
  colors: ColorOption[];
  sizes: string[];
  sizeLabel?: string;
  variantsByColor?: Record<string, string[]>;
  kitProducts: KitProduct[];
  storeReviews: ReviewData[];
  productReviews: ReviewData[];
  upSellProducts: KitProduct[];
  crossSellProducts?: KitProduct[];
  rawVariants?: Array<{
    id?: string;
    _id?: string;
    sku: string;
    price: number;
    specialPrice?: number;
    stock: number;
    attributes?: Record<string, string>;
    imageUrl?: string;
  }>;
  isFreeShipping?: boolean;
  allowBackorders?: boolean;
  weight?: number;
  stockStatus?: number;
  videoUrl?: string;
  attributes?: Record<string, string>;
}

export interface ProductDetailProps {
  product: PDPData;
}
