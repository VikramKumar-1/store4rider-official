import type { Metadata } from "next";
import {
  GuidesHubModule,
  GUIDE_POSTS,
  buildBlogCollectionSchema,
  buildBreadcrumbSchema,
} from "@/modules/guides";

export const revalidate = 60;

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const API_BASE = rawApiBase.includes("/v1")
  ? rawApiBase
  : rawApiBase.endsWith("/api")
  ? `${rawApiBase}/v1`
  : `${rawApiBase}/api/v1`;

async function getGuidesPageSeo() {
  try {
    const res = await fetch(`${API_BASE}/blog/page-seo`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getGuidesPageSeo();
  const title =
    seo?.metaTitle?.trim() || "Motorcycle Guides & Expert Advice | Store4Riders";
  const description =
    seo?.metaDescription?.trim() ||
    "Comprehensive buying guides, gear care advice, maintenance checklists, and touring preparation tips by Store4Riders.";
  const keywords = seo?.metaKeywords
    ? seo.metaKeywords.split(",").map((k: string) => k.trim()).filter(Boolean)
    : [
        "motorcycle guides",
        "riding gear guides",
        "helmet guide",
        "chain maintenance",
        "touring checklist",
        "store4riders",
      ];
  const canonical = "https://www.store4riders.com/guides";

  return {
    title: {
      absolute: title,
    },
    description,
    keywords,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Store4Riders",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function GuidesPage() {
  const seo = await getGuidesPageSeo();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://store4riders.com";
  const title =
    seo?.metaTitle?.trim() || "Motorcycle Guides & Expert Advice";
  const description =
    seo?.metaDescription?.trim() ||
    "Comprehensive buying guides, gear care advice, maintenance checklists, and touring preparation tips by Store4Riders.";

  const blogSchema = buildBlogCollectionSchema(
    title,
    description,
    GUIDE_POSTS,
    `${siteUrl}/guides`,
    siteUrl
  );
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Guides", url: "/guides" },
    ],
    siteUrl
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <GuidesHubModule
        heroTitle={seo?.heroTitle}
        heroDescription={seo?.heroDescription}
      />
    </>
  );
}
