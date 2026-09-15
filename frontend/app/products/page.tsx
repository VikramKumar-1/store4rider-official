import { Suspense } from "react";
import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";

export const metadata = {
  title: "Products | Store4Riders",
  description: "Browse our extensive catalog of riding gear.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-white" />}>
      <ProductsPageModule />
    </Suspense>
  );
}
