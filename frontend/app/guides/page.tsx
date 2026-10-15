import type { Metadata } from "next";
import {
  GuidesHubModule,
  GUIDE_POSTS,
  buildBlogCollectionSchema,
  buildBreadcrumbSchema,
} from "@/modules/guides";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Motorcycle Guides & Expert Advice | Store4Riders",
  description:
    "Comprehensive buying guides, gear care advice, maintenance checklists, and touring preparation tips by Store4Riders.",
  keywords: [
    "motorcycle guides",
    "riding gear guides",
    "helmet guide",
    "chain maintenance",
    "touring checklist",
    "store4riders",
  ],
  alternates: {
    canonical: "https://www.store4riders.com/guides",
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
    title: "Motorcycle Guides & Expert Advice | Store4Riders",
    description:
      "Comprehensive buying guides, gear care advice, maintenance checklists, and touring preparation tips by Store4Riders.",
    url: "https://www.store4riders.com/guides",
    siteName: "Store4Riders",
    type: "website",
  },
};

export default function GuidesPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";
  const blogSchema = buildBlogCollectionSchema(
    "Motorcycle Guides & Expert Advice",
    "Comprehensive buying guides, gear care advice, maintenance checklists, and touring preparation tips by Store4Riders.",
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
      <GuidesHubModule />
    </>
  );
}
