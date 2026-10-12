export interface IGuideAuthor {
  name: string;
  url: string;
  jobTitle?: string;
  bio?: string;
  sameAs: string[];
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
  author: {
    "@type": "Person";
    name: string;
    url: string;
    jobTitle?: string;
    sameAs?: string[];
  };
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
