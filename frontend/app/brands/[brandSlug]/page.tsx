import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";
import ProductsLoading from "../../products/loading";
import {
  buildBreadcrumbSchema,
  buildCollectionSchema,
  buildFAQSchema,
} from "@/core/utils/seo-schema";

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const API_BASE = rawApiBase.includes("/v1")
  ? rawApiBase
  : rawApiBase.endsWith("/api")
  ? `${rawApiBase}/v1`
  : `${rawApiBase}/api/v1`;

async function getBrand(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/brands/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

interface BrandPageProps {
  params: Promise<{ brandSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { brandSlug } = await params;
  const brand = await getBrand(brandSlug);

  const formattedName = brand?.name || brandSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = brand?.metaTitle?.trim() || `${formattedName} Riding Gear & Accessories | Store4Riders`;
  const cleanDescription =
    brand?.metaDescription?.trim() ||
    brand?.description?.replace(/<[^>]*>?/gm, "").slice(0, 160).trim() ||
    `Shop authentic ${formattedName} helmets, jackets, boots and riding gear at Store4Riders. Official warranty and guaranteed best prices.`;
  const keywords = brand?.metaKeywords
    ? brand.metaKeywords
        .split(",")
        .map((k: string) => k.trim())
        .filter(Boolean)
    : [formattedName, "riding gear", "helmets", "motorcycle accessories", "store4riders"];
  const canonicalUrl = `https://www.store4riders.com/brands/${brandSlug}`;

  return {
    title: {
      absolute: title,
    },
    description: cleanDescription,
    keywords,
    alternates: {
      canonical: canonicalUrl,
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
      description: cleanDescription,
      url: canonicalUrl,
      type: "website",
      siteName: "Store4Riders",
      images: brand?.logo ? [{ url: brand.logo, alt: formattedName }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: cleanDescription,
      images: brand?.logo ? [brand.logo] : [],
    },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brandSlug } = await params;
  const brand = await getBrand(brandSlug);

  if (!brand) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";
  const formattedName = brand.name || brandSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Fetch sample products for CollectionPage ItemList schema
  let collectionProducts: any[] = [];
  try {
    const prodUrl = `${API_BASE}/products?brand=${encodeURIComponent(brandSlug)}&limit=12`;
    const prodRes = await fetch(prodUrl, { next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) });
    if (prodRes.ok) {
      const prodData = await prodRes.json();
      collectionProducts = prodData?.data?.items || prodData?.data || [];
    }
  } catch {
    // Ignore
  }

  const cleanRawDesc = (brand.metaDescription || brand.description || "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const brandDescription =
    cleanRawDesc ||
    `Explore authentic ${formattedName} helmets, riding gear, and accessories at Store4Riders. High quality motorcycle gear with fast delivery across India.`;

  const collectionSchema = buildCollectionSchema({
    title: formattedName,
    description: brandDescription,
    url: `${siteUrl}/brands/${brandSlug}`,
    siteUrl,
    products: collectionProducts,
  });

  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Brands", url: "/brands" },
      { name: formattedName, url: `/brands/${brandSlug}` },
    ],
    siteUrl
  );

  const faqSchema = buildFAQSchema(brand.faqs);

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <Suspense fallback={<ProductsLoading />}>
        <ProductsPageModule initialCategoryNode={brand} />
      </Suspense>
    </>
  );
}
