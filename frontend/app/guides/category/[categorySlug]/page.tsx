import type { Metadata } from "next";
import {
  GuidesCategoryModule,
  getCategoryBySlug,
  GUIDE_CATEGORIES,
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

async function getCategoryFromApi(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/blog/categories/${slug}`, {
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

interface Props {
  params: Promise<{ categorySlug: string }>;
}

export async function generateStaticParams() {
  return GUIDE_CATEGORIES.map((cat) => ({
    categorySlug: cat.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const apiCat = await getCategoryFromApi(categorySlug);
  const staticCat = getCategoryBySlug(categorySlug);
  const category = apiCat || staticCat;

  if (!category) {
    return {
      title: "Guides Category Not Found | Store4Riders",
      description: "The requested guides category could not be found.",
    };
  }

  const title = category.metaTitle?.trim() || `${category.name} Guides | Store4Riders`;
  const description =
    category.metaDescription?.trim() ||
    category.description?.trim() ||
    `Expert motorcycle guides and advice for ${category.name} at Store4Riders.`;
  const keywords = category.metaKeywords
    ? category.metaKeywords
        .split(",")
        .map((k: string) => k.trim())
        .filter(Boolean)
    : [category.name, "motorcycle guides", "riding advice", "store4riders"];
  const canonical = `https://www.store4riders.com/guides/category/${category.slug}`;

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

export default async function GuidesCategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const apiCat = await getCategoryFromApi(categorySlug);
  const staticCat = getCategoryBySlug(categorySlug);
  const category = apiCat || staticCat;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";

  if (category) {
    const posts = GUIDE_POSTS.filter((p) => p.categorySlug === category.slug);
    const collectionSchema = buildBlogCollectionSchema(
      `${category.name} Guides`,
      category.metaDescription?.trim() || category.description || `Expert motorcycle guides and advice for ${category.name}`,
      posts,
      `${siteUrl}/guides/category/${category.slug}`,
      siteUrl
    );
    const breadcrumbSchema = buildBreadcrumbSchema(
      [
        { name: "Home", url: "/" },
        { name: "Guides", url: "/guides" },
        { name: category.name, url: `/guides/category/${category.slug}` },
      ],
      siteUrl
    );

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <GuidesCategoryModule categorySlug={categorySlug} />
      </>
    );
  }

  return <GuidesCategoryModule categorySlug={categorySlug} />;
}
