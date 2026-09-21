import type { Metadata } from "next";
import { Suspense } from "react";
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-white" />}>
      <ProductsPageModule />
    </Suspense>
  );
}

