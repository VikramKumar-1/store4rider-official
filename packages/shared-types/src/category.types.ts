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
}
