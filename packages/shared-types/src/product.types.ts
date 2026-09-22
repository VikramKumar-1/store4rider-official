export interface IProductImage { id: string; url: string; altText?: string; }
export interface IProductVariant { id: string; sku: string; price: number; stock: number; attributes: Record<string, string>; }
export interface IProduct {
  _id: string;
  name: string;
  description: string;
  slug: string;
  sku: string;
  categoryId?: string; // made optional for migration
  basePrice: number;
  specialPrice?: number;
  weight?: number;
  stockStatus?: number;
  productType?: string;
  magentoCategories?: string;
  images: IProductImage[];
  variants: IProductVariant[];
  shortDescription?: string;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  relatedSkus?: string[];
  upsellSkus?: string[];
  brand?: string;
  configurableVariations?: string;
  status?: "draft" | "published" | "archived";
  isFeatured?: boolean;
  tags?: string[];
  videoUrl?: string;
  documents?: { name: string; url: string }[];
  salesCount?: number;
  avgRating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
