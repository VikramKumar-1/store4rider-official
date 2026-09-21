import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";
import ProductsLoading from "./loading";

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; brand?: string; search?: string }>;
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const { category, brand, search } = await searchParams;

  if (category) {
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

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsPageModule />
    </Suspense>
  );
}
