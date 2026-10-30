import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";
import { ProductDetailPageModule } from "@/modules/product-detail/components/ProductDetailPageModule";
import ProductsLoading from "../products/loading";
import {
  buildProductSchema,
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

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

async function getCategoryNode(categorySlug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    const treeUrl = baseUrl.includes("/v1") ? `${baseUrl}/categories/tree` : `${baseUrl}/v1/categories/tree`;
    const res = await fetch(treeUrl, { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      const findCategory = (nodes: any[]): any => {
        for (const n of nodes) {
          if (n.slug === categorySlug || n.slug.replace(/s$/, "") === categorySlug.replace(/s$/, "")) return n;
          if (n.children) {
            const found = findCategory(n.children);
            if (found) return found;
          }
        }
        return null;
      };
      const node = findCategory(data?.data || []);
      if (node) return node;
    }

    const singleUrl = baseUrl.includes("/v1")
      ? `${baseUrl}/categories/${encodeURIComponent(categorySlug)}`
      : `${baseUrl}/v1/categories/${encodeURIComponent(categorySlug)}`;
    const singleRes = await fetch(singleUrl, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (singleRes.ok) {
      const singleData = await singleRes.json();
      if (singleData?.data) return singleData.data;
    }
    return null;
  } catch {
    return null;
  }
}

interface CategoryPageProps {
  params: Promise<{ categorySlug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slugArray = resolvedParams.categorySlug || [];
  const candidateSlug = (slugArray[slugArray.length - 1] || "").replace(/\.html$/i, "");

  // 1. Check if this slug resolves to a Product
  if (candidateSlug) {
    const product = await getProduct(candidateSlug);
    if (product) {
      const title = product.metaTitle?.trim() || `${product.name} | Store4Riders`;
      const cleanDescription =
        product.metaDescription?.trim() ||
        product.shortDescription?.trim() ||
        `Buy ${product.name} at Store4Riders. Certified motorcycle riding gear with best prices & express delivery.`;
      const keywords = product.metaKeywords
        ? product.metaKeywords
            .split(",")
            .map((k: string) => k.trim())
            .filter(Boolean)
        : ["riding gear", "motorcycle", "store4riders", product.name];
      const imageUrl = product.images?.[0]?.url;
      const canonicalPath = `/${candidateSlug}`;

      return {
        title: {
          absolute: title,
        },
        description: cleanDescription,
        keywords,
        alternates: {
          canonical: canonicalPath,
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
          url: canonicalPath,
          type: "website",
          siteName: "Store4Riders",
          images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description: cleanDescription,
          images: imageUrl ? [imageUrl] : [],
        },
      };
    }
  }

  // 2. Check if this resolves to a Category
  const categoryNode = candidateSlug ? await getCategoryNode(candidateSlug) : null;
  if (categoryNode) {
    const title = categoryNode.metaTitle || `${categoryNode.name} - Motorcycle Gear | Store4Riders`;
    const description =
      categoryNode.metaDescription ||
      `Explore the best collection of ${categoryNode.name} at Store4Riders. Certified gear, best prices & express delivery across India.`;
    const canonicalPath = `/${slugArray.join("/")}`;

    return {
      title: {
        absolute: title,
      },
      description,
      keywords: categoryNode.metaKeywords ? categoryNode.metaKeywords.split(",").map((k: string) => k.trim()) : [],
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title,
        description,
        url: canonicalPath,
        type: "website",
        siteName: "Store4Riders",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  return {
    title: "Page Not Found | Store4Riders",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slugArray = resolvedParams.categorySlug || [];
  const candidateSlug = (slugArray[slugArray.length - 1] || "").replace(/\.html$/i, "");

  if (!candidateSlug) {
    notFound();
  }

  // 1. If candidateSlug resolves to a Product, render the Product Detail Page directly!
  const product = await getProduct(candidateSlug);
  if (product) {
    // If accessed via a multi-segment path (e.g. /riding-gear/gloves/furygan-jet-d3o-riding-gloves),
    // permanently redirect (HTTP 301) to the canonical root-level product URL: /furygan-jet-d3o-riding-gloves
    if (slugArray.length > 1) {
      const qsParams = new URLSearchParams();
      for (const [key, val] of Object.entries(resolvedSearchParams)) {
        if (Array.isArray(val)) {
          val.forEach((v) => qsParams.append(key, v));
        } else if (typeof val === "string") {
          qsParams.append(key, val);
        }
      }
      const qs = qsParams.toString() ? `?${qsParams.toString()}` : "";
      permanentRedirect(`/${candidateSlug}${qs}`);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";
    const productSchema = buildProductSchema(product, siteUrl);

    const schemaBreadcrumbItems = [
      { name: "Home", url: "/" },
      { name: "Products", url: "/products" },
      ...(product.category
        ? [
            {
              name: product.category,
              url: product.categorySlug ? (product.categorySlug.startsWith("/") ? product.categorySlug : `/${product.categorySlug}`) : `/${product.category.toLowerCase().replace(/\s+/g, "-")}`,
            },
          ]
        : product.categorySlugs?.[0]
        ? [
            {
              name: product.categorySlugs[0].replace(/[-_]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
              url: `/${product.categorySlugs[0]}`,
            },
          ]
        : []),
      ...(product.subCategory
        ? [
            {
              name: product.subCategory,
              url: product.subCategorySlug ? (product.subCategorySlug.startsWith("/") ? product.subCategorySlug : `/${product.subCategorySlug}`) : `/${product.subCategory.toLowerCase().replace(/\s+/g, "-")}`,
            },
          ]
        : []),
      ...(product.brand
        ? [
            {
              name: product.brand,
              url: `/brands/${product.brandSlug || product.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
            },
          ]
        : []),
      { name: product.name, url: `/${candidateSlug}` },
    ];

    const breadcrumbSchema = buildBreadcrumbSchema(schemaBreadcrumbItems, siteUrl);
    const faqSchema = buildFAQSchema(product.faqs);

    return (
      <>
        {productSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
          />
        )}
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
        <ProductDetailPageModule initialProduct={product} slug={candidateSlug} />
      </>
    );
  }

  // 2. Candidate is NOT a product. Check if it resolves to a valid Category.
  const categoryNode = await getCategoryNode(candidateSlug);
  if (!categoryNode) {
    notFound();
  }

  const category = candidateSlug;
  let collectionProducts: any[] = [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";

  // Check if filtering parameters exist
  const hasFilterParams = Boolean(
    resolvedSearchParams.brand ||
    resolvedSearchParams.search ||
    resolvedSearchParams.colour ||
    resolvedSearchParams.color ||
    resolvedSearchParams.size ||
    resolvedSearchParams.minPrice ||
    resolvedSearchParams.maxPrice
  );

  // Fetch sample products for CollectionPage ItemList schema (only on initial view, skip on filter clicks)
  if (!hasFilterParams) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const prodUrl = baseUrl.includes("/v1")
        ? `${baseUrl}/products?category=${encodeURIComponent(category)}&limit=12`
        : `${baseUrl}/v1/products?category=${encodeURIComponent(category)}&limit=12`;
      const prodRes = await fetch(prodUrl, { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        collectionProducts = prodData?.data?.items || prodData?.data || [];
      }
    } catch {
      // Ignore
    }
  }

  // Schema: CollectionPage with ItemList
  const categoryName = categoryNode.name || candidateSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const cleanRawDesc = (categoryNode.metaDescription || categoryNode.description || "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const categoryDescription =
    cleanRawDesc ||
    `Explore our certified range of ${categoryName} at Store4Riders. High quality motorcycle gear with fast delivery across India.`;
  const currentUrl = `${siteUrl}/${slugArray.join("/")}`;

  const collectionSchema = buildCollectionSchema({
    title: categoryName,
    description: categoryDescription,
    url: currentUrl,
    siteUrl,
    products: collectionProducts,
  });

  // Schema: BreadcrumbList
  const breadcrumbElements: Array<{ name: string; url: string }> = [
    {
      name: "Home",
      url: "/",
    },
  ];

  let accumulatedPath = "";
  slugArray.forEach((seg, idx) => {
    accumulatedPath += `/${seg}`;
    const isLast = idx === slugArray.length - 1;
    const segName =
      isLast && categoryNode?.name
        ? categoryNode.name
        : seg.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    breadcrumbElements.push({
      name: segName,
      url: accumulatedPath,
    });
  });

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbElements, siteUrl);
  const faqSchema = buildFAQSchema(categoryNode?.faqs);

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
        <ProductsPageModule initialCategoryNode={categoryNode} />
      </Suspense>
    </>
  );
}
