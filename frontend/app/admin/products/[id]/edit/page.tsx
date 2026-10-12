import { ProductForm } from "@/modules/admin/components/ProductForm";

export const metadata = {
  title: "Edit Product | Store4Riders Admin",
  description: "Edit product details, pricing, inventory, specs and SEO",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ProductForm mode="edit" initialSlugOrId={resolvedParams.id} />;
}
