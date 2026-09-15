import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";

export const metadata = {
  title: "Products | Store4Riders",
  description: "Browse our extensive catalog of riding gear.",
};

export default function ProductsPage() {
  return <ProductsPageModule />;
}
