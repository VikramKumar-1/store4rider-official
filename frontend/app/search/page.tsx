import { ProductsPageModule } from "@/modules/catalog/components/ProductsPageModule";

export const metadata = {
  title: "Search Products | Store4Riders",
  description: "Search our catalog of premium motorcycle boots, jackets, and riding gear.",
};

export default function SearchPage() {
  return <ProductsPageModule />;
}
