import {
  IGuidePost,
  IBlogPostingSchema,
  IPersonSchema,
  IGuideAuthor,
} from "@store4riders/shared-types";

/**
 * Strips HTML tags and excessive whitespace to extract clean plain text.
 */
export function stripHtmlToText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Builds standalone Schema.org Person JSON-LD for the guide author.
 * Directly surfaces Author structured data in Google Search and Schema.org validators.
 */
export function buildAuthorSchema(
  author: IGuideAuthor,
  siteUrl = "https://www.store4riders.com"
): IPersonSchema {
  const authorUrl = author?.url || `${siteUrl}/guides/author/vishwas-mokashi`;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": authorUrl,
    name: author?.name || "Vishwas Mokashi",
    url: authorUrl,
    jobTitle: author?.jobTitle || "Founder & Motorcycle Gear Specialist",
    description:
      author?.bio ||
      "Founder of Store4Riders with over 15 years of motorcycle riding and protective gear expertise.",
    worksFor: {
      "@type": "Organization",
      name: "Store4Riders",
      url: siteUrl,
    },
    sameAs: author?.sameAs || [
      "https://www.instagram.com/store4riders/",
      "https://www.facebook.com/store4riders/",
      "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg",
    ],
  };
}

/**
 * Builds a 100% compliant Schema.org BlogPosting JSON-LD object.
 * Follows https://schema.org/BlogPosting specification and Google Search Article guidelines.
 */
export function buildBlogPostingSchema(
  post: IGuidePost,
  siteUrl = "https://www.store4riders.com"
): IBlogPostingSchema {
  const canonicalUrl = `${siteUrl}/guides/post/${post.slug}`;
  const cleanBody = stripHtmlToText(post.content);
  const wordCount = post.wordCount || cleanBody.split(" ").filter(Boolean).length;
  const authorUrl = post.author?.url || `${siteUrl}/guides/author/vishwas-mokashi`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": canonicalUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    headline: post.title,
    name: post.title,
    description: post.description,
    articleBody: cleanBody,
    articleSection: post.categoryName,
    inLanguage: "en-IN",
    isAccessibleForFree: true,
    isFamilyFriendly: true,
    wordCount: wordCount,
    keywords: post.tags?.join(", ") || `${post.categoryName}, motorcycle riding gear, store4riders`,
    image: {
      "@type": "ImageObject",
      url: post.featuredImage,
      width: 1200,
      height: 630,
    },
    datePublished: post.publishedDate,
    dateModified: post.modifiedDate || post.publishedDate,
    author: [
      {
        "@type": "Person",
        "@id": authorUrl,
        name: post.author?.name || "Vishwas Mokashi",
        url: authorUrl,
        jobTitle: post.author?.jobTitle || "Founder & Motorcycle Gear Specialist",
        sameAs: post.author?.sameAs || [
          "https://www.instagram.com/store4riders/",
          "https://www.facebook.com/store4riders/",
          "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg",
        ],
      },
    ],
    publisher: {
      "@type": "Organization",
      name: "Store4Riders",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/Store4riders-Logo.jpg`,
        width: 600,
        height: 120,
      },
      sameAs: [
        "https://www.instagram.com/store4riders/",
        "https://www.facebook.com/store4riders/",
        "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg",
      ],
    },
    isPartOf: {
      "@type": "Blog",
      name: "Store4Riders Guides",
      url: `${siteUrl}/guides`,
    },
  };
}

/**
 * Builds Schema.org Blog / CollectionPage JSON-LD for guides listing & category pages.
 */
export function buildBlogCollectionSchema(
  title: string,
  description: string,
  posts: IGuidePost[],
  pageUrl: string,
  siteUrl = "https://www.store4riders.com"
) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": pageUrl,
    name: title,
    description: description,
    url: pageUrl,
    publisher: {
      "@type": "Organization",
      name: "Store4Riders",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/Store4riders-Logo.jpg`,
      },
      sameAs: [
        "https://www.instagram.com/store4riders/",
        "https://www.facebook.com/store4riders/",
        "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg",
      ],
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${siteUrl}/guides/post/${post.slug}`,
      datePublished: post.publishedDate,
      author: {
        "@type": "Person",
        name: post.author.name,
        url: post.author.url || `${siteUrl}/guides/author/vishwas-mokashi`,
      },
    })),
  };
}

/**
 * Builds Schema.org BreadcrumbList JSON-LD for enhanced Google Search breadcrumb snippets.
 */
export function buildBreadcrumbSchema(
  items: { name: string; url: string }[],
  siteUrl = "https://www.store4riders.com"
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}

