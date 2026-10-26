import { slugify } from "@store4riders/shared-utils";
import {
  IGuidePost,
  IBlogPost,
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
  author?: IGuideAuthor | any,
  siteUrl = "https://www.store4riders.com"
): IPersonSchema {
  const authorSlug = author?.name ? slugify(author.name) : "store4riders-team";
  const authorUrl = author?.url || `${siteUrl}/guides/author/${authorSlug}`;
  const socialLinks = Array.isArray(author?.sameAs) && author.sameAs.length > 0
    ? author.sameAs
    : [
        "https://www.instagram.com/store4riders/",
        "https://www.facebook.com/store4riders/",
        "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg",
      ];

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": authorUrl,
    name: author?.name || "Store4Riders Editorial Team",
    url: authorUrl,
    jobTitle: author?.jobTitle || "Motorcycle Gear Specialist",
    description:
      author?.bio ||
      "Senior motorcycle gear specialist and technical contributor at Store4Riders India.",
    worksFor: {
      "@type": "Organization",
      name: "Store4Riders",
      url: siteUrl,
    },
    sameAs: socialLinks,
  };
}

/**
 * Builds a 100% compliant Schema.org BlogPosting JSON-LD object.
 * Follows https://schema.org/BlogPosting specification and Google Search Article guidelines.
 */
export function buildBlogPostingSchema(
  post: IGuidePost | IBlogPost | any,
  siteUrl = "https://www.store4riders.com"
): IBlogPostingSchema {
  const canonicalUrl = `${siteUrl}/guides/post/${post.slug}`;
  const cleanBody = stripHtmlToText(post.content || "");
  const wordCount = post.wordCount || (cleanBody ? cleanBody.split(" ").filter(Boolean).length : 0);
  const authorSlug = post.author?.name ? slugify(post.author.name) : "store4riders-team";
  const authorUrl = post.author?.url || `${siteUrl}/guides/author/${authorSlug}`;
  const authorSocials = Array.isArray(post.author?.sameAs) && post.author.sameAs.length > 0
    ? post.author.sameAs
    : [
        "https://www.instagram.com/store4riders/",
        "https://www.facebook.com/store4riders/",
        "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg",
      ];
  const description = post.description || post.excerpt || post.metaDescription || cleanBody.slice(0, 160);
  const datePublished = post.publishedDate || (post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString());
  const dateModified = post.modifiedDate || (post.updatedAt ? new Date(post.updatedAt).toISOString() : datePublished);
  const categoryName = post.categoryName || post.category?.name || "Motorcycle Guides";

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
    description: description,
    articleBody: cleanBody,
    articleSection: categoryName,
    inLanguage: "en-IN",
    isAccessibleForFree: true,
    isFamilyFriendly: true,
    wordCount: wordCount,
    keywords: Array.isArray(post.tags) ? post.tags.join(", ") : `${categoryName}, motorcycle riding gear, store4riders`,
    image: {
      "@type": "ImageObject",
      url: post.featuredImage || `${siteUrl}/Store4riders-Logo.jpg`,
      width: 1200,
      height: 630,
    },
    datePublished: datePublished,
    dateModified: dateModified,
    author: [
      {
        "@type": "Person",
        "@id": authorUrl,
        name: post.author?.name || "Store4Riders Editorial Team",
        url: authorUrl,
        jobTitle: post.author?.jobTitle || "Motorcycle Gear Specialist",
        sameAs: authorSocials,
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
  posts: Array<IGuidePost | IBlogPost | any>,
  canonicalUrl: string,
  siteUrl = "https://www.store4riders.com"
) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": canonicalUrl,
    name: title,
    description: description,
    url: canonicalUrl,
    inLanguage: "en-IN",
    publisher: {
      "@type": "Organization",
      name: "Store4Riders",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/Store4riders-Logo.jpg`,
      },
    },
    blogPost: posts.slice(0, 10).map((post) => ({
      "@type": "BlogPosting",
      "@id": `${siteUrl}/guides/post/${post.slug}`,
      headline: post.title,
      description: post.description || post.excerpt,
      url: `${siteUrl}/guides/post/${post.slug}`,
      datePublished: post.publishedDate || post.publishedAt,
      image: post.featuredImage,
    })),
  };
}

/**
 * Builds Schema.org BreadcrumbList JSON-LD.
 */
export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
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
