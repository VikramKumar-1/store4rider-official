import { ProductForm } from "@/modules/admin/components/ProductForm";

export const metadata = {
  title: "Add Product | Store4Riders Admin",
  description: "Create and publish a new product with full specifications",
};

export default function NewProductPage() {
  return <ProductForm mode="create" />;
}
