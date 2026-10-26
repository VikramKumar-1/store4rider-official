export interface IGuideAuthor {
  name: string;
  url: string;
  jobTitle?: string;
  avatar?: string;
  bio?: string;
  sameAs: string[];
}

export interface IBlogCategory {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  articleCount?: number;
  order?: number;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IBlogAuthor {
  name: string;
  url?: string;
  jobTitle?: string;
  avatar?: string;
  bio?: string;
  sameAs?: string[];
}

export interface IBlogPost {
  _id?: string;
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  videoUrl?: string;
  categoryId?: string;
  category?: IBlogCategory;
  categoryName?: string;
  categorySlug?: string;
  tags?: string[];
  author?: IBlogAuthor;
  status: "draft" | "published";
  publishedAt?: Date | string;
  readingTimeMinutes?: number;
  wordCount?: number;
  views?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IBlogPostQuery {
  page?: number;
  limit?: number;
  status?: "all" | "draft" | "published";
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  tag?: string;
  sortBy?: "publishedAt" | "createdAt" | "views" | "title";
  sortOrder?: "asc" | "desc";
}

export interface IGuideCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  articleCount?: number;
}

export interface IGuidePost {
  slug: string;
  title: string;
  description: string;
  content: string;
  featuredImage: string;
  categorySlug: string;
  categoryName: string;
  publishedDate: string;
  modifiedDate?: string;
  author: IGuideAuthor;
  tags?: string[];
  readingTimeMinutes?: number;
  wordCount?: number;
}

export interface IPersonSchema {
  "@context": "https://schema.org";
  "@type": "Person";
  "@id"?: string;
  name: string;
  url: string;
  jobTitle?: string;
  description?: string;
  worksFor?: {
    "@type": "Organization";
    name: string;
    url?: string;
  };
  sameAs?: string[];
}

export interface IBlogPostingSchema {
  "@context": "https://schema.org";
  "@type": "BlogPosting";
  "@id": string;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  headline: string;
  name: string;
  description: string;
  articleBody?: string;
  articleSection?: string;
  inLanguage?: string;
  isAccessibleForFree?: boolean;
  isFamilyFriendly?: boolean;
  wordCount?: number;
  keywords?: string;
  backstory?: string;
  speakable?: {
    "@type": "SpeakableSpecification";
    cssSelector: string[];
  };
  image:
    | {
        "@type": "ImageObject";
        url: string;
        width?: number;
        height?: number;
      }
    | string[];
  datePublished: string;
  dateModified: string;
  author:
    | {
        "@type": "Person";
        "@id"?: string;
        name: string;
        url: string;
        jobTitle?: string;
        sameAs?: string[];
      }
    | Array<{
        "@type": "Person";
        "@id"?: string;
        name: string;
        url: string;
        jobTitle?: string;
        sameAs?: string[];
      }>;
  publisher: {
    "@type": "Organization";
    name: string;
    url: string;
    logo: {
      "@type": "ImageObject";
      url: string;
      width?: number;
      height?: number;
    };
    sameAs?: string[];
  };
  isPartOf?: {
    "@type": "Blog";
    name: string;
    url: string;
  };
}
