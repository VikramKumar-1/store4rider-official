import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  GuidesCategoryModule,
  GuideDetailModule,
  getCategoryBySlug,
  getGuideBySlug,
  GUIDE_CATEGORIES,
  GUIDE_POSTS,
  buildBlogPostingSchema,
  buildBlogCollectionSchema,
  buildBreadcrumbSchema,
} from "@/modules/guides";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const catSlugs = GUIDE_CATEGORIES.map((cat) => ({ slug: cat.slug }));
  const postSlugs = GUIDE_POSTS.map((post) => ({ slug: post.slug }));
  return [...catSlugs, ...postSlugs];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (category) {
    const title = `${category.name} Guides | Store4Riders`;
    const description =
      category.description ||
      `Expert motorcycle guides and advice for ${category.name} at Store4Riders.`;
    const canonical = `https://www.store4riders.com/guides/category/${category.slug}`;

    return {
      title,
      description,
      alternates: { canonical },
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

  const post = getGuideBySlug(slug);
  if (post) {
    const title = `${post.title} | Store4Riders Guides`;
    const description = post.description;
    const canonical = `https://www.store4riders.com/guides/post/${post.slug}`;

    return {
      title,
      description,
      keywords: post.tags,
      alternates: { canonical },
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
        type: "article",
        publishedTime: post.publishedDate,
        modifiedTime: post.modifiedDate || post.publishedDate,
        authors: [post.author.name],
        section: post.categoryName,
        images: post.featuredImage
          ? [{ url: post.featuredImage, width: 1200, height: 630, alt: post.title }]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: post.featuredImage ? [post.featuredImage] : [],
      },
    };
  }

  return {
    title: "Guide Not Found | Store4Riders",
    description: "The requested guide could not be found.",
  };
}

export default async function GuidesDynamicSlugPage({ params }: Props) {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";

  const category = getCategoryBySlug(slug);
  if (category) {
    const posts = GUIDE_POSTS.filter((p) => p.categorySlug === category.slug);
    const collectionSchema = buildBlogCollectionSchema(
      `${category.name} Guides`,
      category.description || `Expert motorcycle guides and advice for ${category.name}`,
      posts,
      `${siteUrl}/guides/${category.slug}`,
      siteUrl
    );
    const breadcrumbSchema = buildBreadcrumbSchema(
      [
        { name: "Home", url: "/" },
        { name: "Guides", url: "/guides" },
        { name: category.name, url: `/guides/${category.slug}` },
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
        <GuidesCategoryModule categorySlug={slug} />
      </>
    );
  }

  const post = getGuideBySlug(slug);
  if (post) {
    const blogPostingSchema = buildBlogPostingSchema(post, siteUrl);
    const breadcrumbSchema = buildBreadcrumbSchema(
      [
        { name: "Home", url: "/" },
        { name: "Guides", url: "/guides" },
        { name: post.categoryName, url: `/guides/category/${post.categorySlug}` },
        { name: post.title, url: `/guides/post/${post.slug}` },
      ],
      siteUrl
    );

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <GuideDetailModule slug={slug} />
      </>
    );
  }

  notFound();
}
