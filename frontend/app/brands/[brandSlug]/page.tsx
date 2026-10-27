import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";
import ProductsLoading from "../../products/loading";

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const API_BASE = rawApiBase.includes("/v1")
  ? rawApiBase
  : rawApiBase.endsWith("/api")
  ? `${rawApiBase}/v1`
  : `${rawApiBase}/api/v1`;

async function getBrand(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/brands/${slug}`, {
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

interface BrandPageProps {
  params: Promise<{ brandSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { brandSlug } = await params;
  const brand = await getBrand(brandSlug);

  const formattedName = brand?.name || brandSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = brand?.metaTitle?.trim() || `${formattedName} Riding Gear & Accessories | Store4Riders`;
  const description =
    brand?.metaDescription?.trim() ||
    brand?.description?.trim() ||
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
    description,
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
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "Store4Riders",
      images: brand?.logo ? [{ url: brand.logo, alt: formattedName }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: brand?.logo ? [brand.logo] : [],
    },
  };
}

export default function BrandPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsPageModule />
    </Suspense>
  );
}
