import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; search?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q, search } = await searchParams;
  const query = (search || q || "").trim();

  if (query) {
    return {
      title: `Search: "${query}" | Store4Riders`,
      description: `Explore search results for "${query}" across motorcycle helmets, riding jackets, boots, gloves and safety gear at Store4Riders.`,
    };
  }

  return {
    title: "Search Riding Gear | Store4Riders",
    description: "Search our catalog of premium motorcycle helmets, riding jackets, pants, boots, and riding gear.",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, search } = await searchParams;
  const query = (search || q || "").trim();

  // Server-side instant redirect check (Magento-grade Query-to-Category Redirection)
  if (query) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${apiUrl}/search/redirect?q=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.hasRedirect && json.data?.redirectUrl) {
          redirect(json.data.redirectUrl);
        }
      }
    } catch (e: any) {
      if (e?.message === "NEXT_REDIRECT" || e?.digest?.startsWith("NEXT_REDIRECT")) {
        throw e;
      }
      // Silently proceed to normal catalog search if network unreachable
    }
  }

  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-white" />}>
      <ProductsPageModule />
    </Suspense>
  );
}
