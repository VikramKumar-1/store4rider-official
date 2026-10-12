import type { MetadataRoute } from "next";
import { GUIDE_CATEGORIES, GUIDE_POSTS } from "@/modules/guides";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  const normalizedApi = apiBase.includes("/v1")
    ? apiBase
    : apiBase.endsWith("/api")
    ? `${apiBase}/v1`
    : `${apiBase}/api/v1`;

  const now = new Date();

  // 1. Core static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sale`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/warranty`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ];

  // 2. Dynamic Categories
  const categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const catRes = await fetch(`${normalizedApi}/categories/tree`, {
      next: { revalidate: 3600 },
    });
    if (catRes.ok) {
      const catJson = await catRes.json();
      const nodes = catJson?.data || [];

      const traverse = (items: any[], parentPath = "") => {
        for (const item of items) {
          const currentPath = parentPath ? `${parentPath}/${item.slug}` : `/${item.slug}`;
          categoryRoutes.push({
            url: `${baseUrl}${currentPath}`,
            lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
            changeFrequency: "weekly",
            priority: parentPath ? 0.8 : 0.85,
          });
          if (item.children && Array.isArray(item.children)) {
            traverse(item.children, currentPath);
          }
        }
      };

      traverse(nodes);
    }
  } catch (err) {
    // Fail gracefully with static routes
  }

  // 3. Dynamic Products
  const productRoutes: MetadataRoute.Sitemap = [];
  try {
    const prodRes = await fetch(`${normalizedApi}/products?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (prodRes.ok) {
      const prodJson = await prodRes.json();
      const products = prodJson?.data?.items || prodJson?.data || [];

      for (const p of products) {
        if (p.slug) {
          productRoutes.push({
            url: `${baseUrl}/${p.slug}`,
            lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
            changeFrequency: "daily",
            priority: 0.7,
          });
        }
      }
    }
  } catch (err) {
    // Fail gracefully
  }

  // 4. Dynamic Guides & Categories
  const guideRoutes: MetadataRoute.Sitemap = [
    ...GUIDE_CATEGORIES.map((c) => ({
      url: `${baseUrl}/guides/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...GUIDE_POSTS.map((p) => ({
      url: `${baseUrl}/guides/post/${p.slug}`,
      lastModified: p.publishedDate ? new Date(p.publishedDate) : now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...guideRoutes];
}
