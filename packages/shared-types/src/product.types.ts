export interface IFaq { question: string; answer: string; }
export interface IProductImage { id: string; url: string; altText?: string; }
export interface IProductVariant { id: string; sku: string; price: number; stock: number; attributes: Record<string, string>; imageUrl?: string; }
export interface IProduct {
  _id: string;
  name: string;
  description: string;
  faqs?: IFaq[];
  slug: string;
  sku: string;
  categoryId?: string; // made optional for migration
  basePrice: number;
  specialPrice?: number;
  specialPriceFromDate?: Date | string;
  specialPriceToDate?: Date | string;
  weight?: number;
  stockStatus?: number;
  allowBackorders?: boolean;
  productType?: string;
  taxClassName?: string;
  magentoCategories?: string;
  categorySlugs?: string[];
  images: IProductImage[];
  colorImages?: Record<string, string>;
  variants: IProductVariant[];
  shortDescription?: string;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  relatedSkus?: string[];
  upsellSkus?: string[];
  crosssellSkus?: string[];
  brand?: string;
  gender?: string;
  attributes?: Record<string, string>;
  countryOfManufacture?: string;
  attributeSetCode?: string;
  configurableVariationLabels?: string;
  qty?: number;
  sizeChart?: string;
  size_chart?: string;
  isFreeShipping?: boolean;
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
