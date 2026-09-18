import { Suspense } from "react";
import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";
import ProductsLoading from "./loading";

export const metadata = {
  title: "Products | Store4Riders",
  description: "Browse our extensive catalog of riding gear.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsPageModule />
    </Suspense>
  );
}
