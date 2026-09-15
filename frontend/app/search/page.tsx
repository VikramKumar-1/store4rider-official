import { Suspense } from "react";
import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";

export const metadata = {
  title: "Search Products | Store4Riders",
  description: "Search our catalog of premium motorcycle boots, jackets, and riding gear.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-white" />}>
      <ProductsPageModule />
    </Suspense>
  );
}
