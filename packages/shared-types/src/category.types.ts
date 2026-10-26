import { IFaq } from "./product.types";

export interface ISpecFieldDefinition {
  key: string;
  label: string;
  placeholder?: string;
  presets?: string[];
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  faqs?: IFaq[];
  parentId?: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  videoUrl?: string;
  filterConfig?: ICategoryFilterConfig[];
  includeInMenu?: boolean;
  menuGroup?: string;
  heroCategoryIds?: string[];
  heroCategories?: any[];
  badge?: string;
  badgeColor?: string;
  attributeSetCode?: string;
  hsnCode?: string;
  taxClassName?: string;
  weightUnit?: "kg" | "g" | "ml" | "L";
  sizeChart?: string;
  specDefinitions?: ISpecFieldDefinition[];
}

export interface ICategoryFilterConfig {
  code: string;
  label: string;
  type: "checkbox" | "swatch" | "range";
  sortOrder: number;
  isActive: boolean;
}
