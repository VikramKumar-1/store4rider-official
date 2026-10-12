import { IGuidePost, IBlogPostingSchema } from "@store4riders/shared-types";

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
 * Builds a 100% compliant Schema.org BlogPosting JSON-LD object.
 * Follows https://schema.org/BlogPosting specification and Google Search guidelines.
 */
export function buildBlogPostingSchema(
  post: IGuidePost,
  siteUrl = "https://www.store4riders.com"
): IBlogPostingSchema {
  const canonicalUrl = `${siteUrl}/guides/post/${post.slug}`;
  const cleanBody = stripHtmlToText(post.content);
  const wordCount = post.wordCount || cleanBody.split(" ").filter(Boolean).length;

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
    backstory:
      "Store4Riders was founded to provide authentic rider advice, technical maintenance guides, and certified safety apparel guidance for motorcyclists across India.",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".guide-headline", ".guide-article-body"],
    },
    image: {
      "@type": "ImageObject",
      url: post.featuredImage,
      width: 1200,
      height: 630,
    },
    datePublished: post.publishedDate,
    dateModified: post.modifiedDate || post.publishedDate,
    author: {
      "@type": "Person",
      name: post.author.name || "Vishwas Mokashi",
      url: post.author.url || `${siteUrl}/guides/author/vishwas-mokashi`,
      jobTitle: post.author.jobTitle || "Founder & Motorcycle Gear Specialist",
      sameAs: post.author.sameAs || [
        "https://www.instagram.com/store4riders/",
        "https://www.facebook.com/store4riders/",
        "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg",
      ],
    },
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

