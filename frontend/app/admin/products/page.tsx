import { Suspense } from "react";
import { AdminProducts } from "@/modules/admin/components/AdminProducts";

export const metadata = {
  title: "Manage Products | Admin | Store4Riders",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading catalog products...</div>}>
      <AdminProducts />
    </Suspense>
  );
}
