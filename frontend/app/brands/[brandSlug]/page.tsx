import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";
import ProductsLoading from "../../products/loading";

interface BrandPageProps {
  params: Promise<{ brandSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { brandSlug } = await params;
  const formatted = brandSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  
  return {
    title: `${formatted} Riding Gear & Accessories | Store4Riders`,
    description: `Shop authentic ${formatted} helmets, jackets, boots and riding gear at Store4Riders. Official warranty and guaranteed best prices.`,
  };
}

export default function BrandPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsPageModule />
    </Suspense>
  );
}
