import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";
import { ProductDetailPageModule } from "@/modules/product-detail/components/ProductDetailPageModule";
import ProductsLoading from "../products/loading";

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const API_BASE = rawApiBase.includes("/v1")
  ? rawApiBase
  : rawApiBase.endsWith("/api")
  ? `${rawApiBase}/v1`
  : `${rawApiBase}/api/v1`;

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/products/${slug}`, {
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

interface CategoryPageProps {
  params: Promise<{ categorySlug: string[] }>;
  searchParams: Promise<{ brand?: string; search?: string }>;
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const slugArray = resolvedParams.categorySlug;
  const isSingleSegment = slugArray.length === 1;
  const candidateSlug = slugArray[slugArray.length - 1]; // Use deepest segment

  // 1. Check if this slug resolves to a Product (ONLY for single-segment root-level URLs)
  if (isSingleSegment && candidateSlug) {
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
        title,
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

  const category = candidateSlug;
  const { brand, search } = resolvedSearchParams;

  if (category) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const fetchUrl = baseUrl.includes('/v1') ? `${baseUrl}/categories/tree` : `${baseUrl}/v1/categories/tree`;
      const res = await fetch(fetchUrl, { next: { revalidate: 60 }, signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        const findCategory = (nodes: any[]): any => {
          for (const n of nodes) {
            if (n.slug === category || n.slug.replace(/s$/, '') === category.replace(/s$/, '')) return n;
            if (n.children) {
              const found = findCategory(n.children);
              if (found) return found;
            }
          }
          return null;
        };
        let catNode = findCategory(data?.data || []);
        if (!catNode) {
          const singleUrl = baseUrl.includes('/v1') ? `${baseUrl}/categories/${category}` : `${baseUrl}/v1/categories/${category}`;
          const singleRes = await fetch(singleUrl, { next: { revalidate: 60 }, signal: AbortSignal.timeout(2500) });
          if (singleRes.ok) {
            const singleData = await singleRes.json();
            catNode = singleData?.data || null;
          }
        }
        if (catNode) {
          const title = catNode.metaTitle || `${catNode.name} - Motorcycle Gear | Store4Riders`;
          const description = catNode.metaDescription || `Explore the best collection of ${catNode.name} at Store4Riders. Certified gear, best prices & express delivery across India.`;
          const canonicalPath = `/${slugArray.join('/')}`;

          return {
            title,
            description,
            keywords: catNode.metaKeywords ? catNode.metaKeywords.split(',').map((k: string) => k.trim()) : [],
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
      }
    } catch (e) {
      // Fallback
    }
    const formatted = category.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const fallbackTitle = `${formatted} - Motorcycle Gear | Store4Riders`;
    const fallbackDesc = `Explore the best collection of ${formatted} at Store4Riders. High quality, certified motorcycle safety gear with fast shipping across India.`;
    const canonicalPath = `/${slugArray.join('/')}`;

    return {
      title: fallbackTitle,
      description: fallbackDesc,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        url: canonicalPath,
        type: "website",
        siteName: "Store4Riders",
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: fallbackDesc,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  return {
    title: "All Products - Motorcycle Riding Gear | Store4Riders",
    description: "Browse our extensive catalog of certified motorcycle riding helmets, jackets, boots, gloves and luggage.",
    alternates: {
      canonical: "/products",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const slugArray = resolvedParams.categorySlug;
  const isSingleSegment = slugArray.length === 1;
  const candidateSlug = slugArray[slugArray.length - 1];

  // 1. If single segment resolves to a Product, render the Product Detail Page directly!
  if (isSingleSegment && candidateSlug) {
    const product = await getProduct(candidateSlug);
    if (product) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";
      const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        name: product.name,
        image: product.images?.map((img: any) => img.url) || [],
        description: product.metaDescription || product.shortDescription || product.name,
        sku: product.sku || product._id,
        brand: {
          "@type": "Brand",
          name: product.brand || "Store4Riders",
        },
        offers: {
          "@type": "Offer",
          url: `${siteUrl}/${candidateSlug}`,
          priceCurrency: "INR",
          price: product.specialPrice || product.basePrice || 0,
          availability:
            product.stockStatus === 1 || product.stockStatus === true || (product.stockQuantity && product.stockQuantity > 0)
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      };

      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
          />
          <ProductDetailPageModule slug={candidateSlug} />
        </>
      );
    }
  }

  const category = candidateSlug;
  let initialCategoryNode = undefined;
  let collectionProducts: any[] = [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";
  
  if (category) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const fetchUrl = baseUrl.includes('/v1') ? `${baseUrl}/categories/tree` : `${baseUrl}/v1/categories/tree`;
      const res = await fetch(fetchUrl, { next: { revalidate: 60 }, signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        const findCategory = (nodes: any[]): any => {
          for (const n of nodes) {
            if (n.slug === category || n.slug.replace(/s$/, '') === category.replace(/s$/, '')) return n;
            if (n.children) {
              const found = findCategory(n.children);
              if (found) return found;
            }
          }
          return null;
        };
        initialCategoryNode = findCategory(data?.data || []);
      }
      if (!initialCategoryNode) {
        const singleUrl = baseUrl.includes('/v1') ? `${baseUrl}/categories/${category}` : `${baseUrl}/v1/categories/${category}`;
        const singleRes = await fetch(singleUrl, { next: { revalidate: 60 }, signal: AbortSignal.timeout(2500) });
        if (singleRes.ok) {
          const singleData = await singleRes.json();
          initialCategoryNode = singleData?.data || undefined;
        }
      }

      // Fetch sample products for CollectionPage ItemList schema
      const prodUrl = baseUrl.includes('/v1')
        ? `${baseUrl}/products?category=${encodeURIComponent(category)}&limit=12`
        : `${baseUrl}/v1/products?category=${encodeURIComponent(category)}&limit=12`;
      const prodRes = await fetch(prodUrl, { next: { revalidate: 60 }, signal: AbortSignal.timeout(2500) });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        collectionProducts = prodData?.data?.items || prodData?.data || [];
      }
    } catch (e) {
      // Ignore
    }
  }

  // Schema: CollectionPage with ItemList
  const categoryName =
    initialCategoryNode?.name ||
    candidateSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const categoryDescription =
    initialCategoryNode?.metaDescription ||
    initialCategoryNode?.description ||
    `Explore our certified range of ${categoryName} at Store4Riders. High quality motorcycle gear with fast delivery across India.`;
  const currentUrl = `${siteUrl}/${slugArray.join('/')}`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: categoryName,
    description: categoryDescription,
    url: currentUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Store4Riders",
      url: siteUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      name: `${categoryName} Collection`,
      description: `Shop ${categoryName} online at Store4Riders`,
      url: currentUrl,
      numberOfItems: collectionProducts.length,
      itemListElement: collectionProducts.map((p: any, idx: number) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: p.name,
        url: `${siteUrl}/${p.slug}`,
        ...(p.images?.[0]?.url ? { image: p.images[0].url } : {}),
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: p.specialPrice || p.basePrice || 0,
          availability:
            p.stockStatus === 1 || p.stockStatus === true
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
      })),
    },
  };

  // Schema: BreadcrumbList
  const breadcrumbElements = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
  ];

  let accumulatedPath = "";
  slugArray.forEach((seg, idx) => {
    accumulatedPath += `/${seg}`;
    const isLast = idx === slugArray.length - 1;
    const segName =
      isLast && initialCategoryNode?.name
        ? initialCategoryNode.name
        : seg.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    breadcrumbElements.push({
      "@type": "ListItem",
      position: idx + 2,
      name: segName,
      item: `${siteUrl}${accumulatedPath}`,
    });
  });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbElements,
  };

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
        <ProductsPageModule initialCategoryNode={initialCategoryNode} />
      </Suspense>
    </>
  );
}
