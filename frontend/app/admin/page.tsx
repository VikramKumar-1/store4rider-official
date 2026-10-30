import { Suspense } from "react";
import { AdminDashboard } from "@/modules/admin/components/AdminDashboard";

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Loading dashboard...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}
