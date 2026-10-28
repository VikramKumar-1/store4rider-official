import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";
  const normalizedBase = baseUrl.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/account",
          "/account/*",
          "/cart",
          "/checkout",
          "/checkout/*",
          "/api/*",
          "/search",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${normalizedBase}/sitemap.xml`,
  };
}
