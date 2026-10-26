import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  GuideDetailModule,
  fetchGuideOrBlogPost,
  GUIDE_POSTS,
  buildAuthorSchema,
  buildBlogPostingSchema,
  buildBreadcrumbSchema,
} from "@/modules/guides";

export const revalidate = 60;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GUIDE_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchGuideOrBlogPost(slug);

  if (!post) {
    return {
      title: "Guide Not Found | Store4Riders",
      description: "The requested motorcycle guide could not be found.",
    };
  }

  const title = post.metaTitle?.trim() || `${post.title} | Store4Riders Guides`;
  const description =
    post.metaDescription?.trim() ||
    post.description?.trim() ||
    post.excerpt?.trim() ||
    "Expert motorcycle riding guides, gear care advice, and maintenance tips by Store4Riders.";
  const canonical = `https://www.store4riders.com/guides/post/${post.slug}`;
  const rawPublished = post.publishedDate || post.publishedAt || new Date().toISOString();
  const rawModified = post.modifiedDate || post.updatedAt || rawPublished;

  return {
    title,
    description,
    keywords: post.tags,
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
      type: "article",
      publishedTime: typeof rawPublished === "string" ? rawPublished : rawPublished.toISOString?.() || undefined,
      modifiedTime: typeof rawModified === "string" ? rawModified : rawModified.toISOString?.() || undefined,
      authors: [post.author?.name || "Store4Riders Team"],
      section: post.categoryName || "Motorcycle Guides",
      images: post.featuredImage
        ? [
            {
              url: post.featuredImage,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
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

export default async function GuidePostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchGuideOrBlogPost(slug);

  if (!post) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.store4riders.com";
  const authorSchema = buildAuthorSchema(post.author, siteUrl);
  const blogPostingSchema = buildBlogPostingSchema(post, siteUrl);
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Guides", url: "/guides" },
      { name: post.categoryName || "Guides", url: `/guides/category/${post.categorySlug || "general"}` },
      { name: post.title, url: `/guides/post/${post.slug}` },
    ],
    siteUrl
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <GuideDetailModule slug={slug} initialPost={post} />
    </>
  );
}
