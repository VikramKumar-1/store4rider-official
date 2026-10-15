import type { Metadata } from "next";
import {
  GuideDetailModule,
  getGuideBySlug,
  GUIDE_POSTS,
  buildAuthorSchema,
  buildBlogPostingSchema,
  buildBreadcrumbSchema,
} from "@/modules/guides";

export const dynamic = "force-static";

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
  const post = getGuideBySlug(slug);

  if (!post) {
    return {
      title: "Guide Not Found | Store4Riders",
      description: "The requested motorcycle guide could not be found.",
    };
  }

  const title = `${post.title} | Store4Riders Guides`;
  const description = post.description;
  const canonical = `https://www.store4riders.com/guides/post/${post.slug}`;

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
      publishedTime: post.publishedDate,
      modifiedTime: post.modifiedDate || post.publishedDate,
      authors: [post.author.name],
      section: post.categoryName,
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
  const post = getGuideBySlug(slug);

  if (!post) {
    return <GuideDetailModule slug={slug} />;
  }

  const siteUrl = "https://www.store4riders.com";
  const authorSchema = buildAuthorSchema(post.author, siteUrl);
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
      <GuideDetailModule slug={slug} />
    </>
  );
}

