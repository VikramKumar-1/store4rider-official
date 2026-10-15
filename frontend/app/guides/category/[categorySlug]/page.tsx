import type { Metadata } from "next";
import {
  GuidesCategoryModule,
  getCategoryBySlug,
  GUIDE_CATEGORIES,
  GUIDE_POSTS,
  buildBlogCollectionSchema,
  buildBreadcrumbSchema,
} from "@/modules/guides";

export const dynamic = "force-static";

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
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return {
      title: "Guides Category Not Found | Store4Riders",
      description: "The requested guides category could not be found.",
    };
  }

  const title = `${category.name} Guides | Store4Riders`;
  const description =
    category.description ||
    `Expert motorcycle guides and advice for ${category.name} at Store4Riders.`;
  const canonical = `https://www.store4riders.com/guides/category/${category.slug}`;

  return {
    title,
    description,
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
  };
}

export default async function GuidesCategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";

  if (category) {
    const posts = GUIDE_POSTS.filter((p) => p.categorySlug === category.slug);
    const collectionSchema = buildBlogCollectionSchema(
      `${category.name} Guides`,
      category.description || `Expert motorcycle guides and advice for ${category.name}`,
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

