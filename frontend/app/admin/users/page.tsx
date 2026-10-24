import { Suspense } from "react";
import { AdminUsers } from "@/modules/admin/components/AdminUsers";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading user management...</div>}>
      <AdminUsers />
    </Suspense>
  );
}
