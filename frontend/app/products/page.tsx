import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";
import ProductsLoading from "./loading";
import { buildCollectionSchema, buildBreadcrumbSchema } from "@/core/utils/seo-schema";

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; brand?: string; search?: string }>;
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const { category, brand, search } = await searchParams;

  if (category) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const fetchUrl = baseUrl.includes('/v1') ? `${baseUrl}/categories/tree` : `${baseUrl}/v1/categories/tree`;
      const res = await fetch(fetchUrl, { next: { revalidate: 60 } });
      if (res.ok) {
        const data = await res.json();
        const findCategory = (nodes: any[]): any => {
          for (const n of nodes) {
            if (n.slug === category) return n;
            if (n.children) {
              const found = findCategory(n.children);
              if (found) return found;
            }
          }
          return null;
        };
        const catNode = findCategory(data?.data || []);
        if (catNode) {
          return {
            title: catNode.metaTitle || `${catNode.name} - Motorcycle Gear | Store4Riders`,
            description: catNode.metaDescription || `Explore the best collection of ${catNode.name} at Store4Riders.`,
            keywords: catNode.metaKeywords ? catNode.metaKeywords.split(',') : [],
          };
        }
      }
    } catch (e) {
      // Fallback
    }
    const formatted = category.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: `${formatted} - Motorcycle Gear | Store4Riders`,
      description: `Explore the best collection of ${formatted} at Store4Riders. High quality, certified motorcycle safety gear with fast shipping across India.`,
    };
  }

  if (brand) {
    const formatted = brand.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: `${formatted} Riding Gear & Accessories | Store4Riders`,
      description: `Shop authentic ${formatted} helmets, jackets, boots and riding gear at Store4Riders. Official warranty and guaranteed best prices.`,
    };
  }

  if (search) {
    return {
      title: `Search results for "${search}" | Store4Riders`,
      description: `Explore search results for "${search}" across our motorcycle helmets, jackets, pants, boots and riding gear catalog.`,
    };
  }

  return {
    title: "All Products - Motorcycle Riding Gear | Store4Riders",
    description: "Browse our extensive catalog of certified motorcycle riding helmets, jackets, boots, gloves and luggage.",
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, brand, search } = await searchParams;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";

  let title = "Motorcycle Riding Gear & Accessories";
  let description = "Browse our extensive catalog of certified motorcycle riding helmets, jackets, boots, gloves and luggage at Store4Riders.";
  let pageUrl = `${siteUrl}/products`;

  if (category) {
    const formatted = category.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    title = `${formatted} Collection`;
    description = `Explore the best collection of ${formatted} at Store4Riders. High quality, certified motorcycle safety gear with fast shipping across India.`;
    pageUrl = `${siteUrl}/products?category=${encodeURIComponent(category)}`;
  } else if (brand) {
    const formatted = brand.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    title = `${formatted} Riding Gear & Accessories`;
    description = `Shop authentic ${formatted} helmets, jackets, boots and riding gear at Store4Riders.`;
    pageUrl = `${siteUrl}/products?brand=${encodeURIComponent(brand)}`;
  } else if (search) {
    title = `Search Results for "${search}"`;
    description = `Explore search results for "${search}" across our motorcycle gear catalog.`;
    pageUrl = `${siteUrl}/products?search=${encodeURIComponent(search)}`;
  }

  const collectionSchema = buildCollectionSchema({
    title,
    description,
    url: pageUrl,
    siteUrl,
  });

  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: category ? title : "Products", url: pageUrl },
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
      <Suspense fallback={<ProductsLoading />}>
        <ProductsPageModule />
      </Suspense>
    </>
  );
}
