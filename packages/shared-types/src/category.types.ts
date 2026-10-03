export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
  bannerImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  videoUrl?: string;
  filterConfig?: ICategoryFilterConfig[];
}

export interface ICategoryFilterConfig {
  code: string;
  label: string;
  type: "checkbox" | "swatch" | "range";
  sortOrder: number;
  isActive: boolean;
}
