export interface IBrandFaq {
  question: string;
  answer: string;
}

export interface IBrand {
  _id: string;
  name: string;
  slug: string;
  aliases?: string[];
  logo?: string;
  description?: string;
  faqs?: IBrandFaq[];
  isActive: boolean;
  showInMenu?: boolean;
  menuGroup?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: Date;
  updatedAt: Date;
}
