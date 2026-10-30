import { Suspense } from "react";
import { AdminCustomerCareDashboard } from "@/modules/admin/components/AdminCustomerCareDashboard";

export const metadata = {
  title: "Contact Inquiries & Support Tickets | Admin",
  description: "Manage customer contact inquiries, raise-issue tickets, and order questions.",
};

export default function AdminInquiriesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Loading inquiries...</div>}>
      <AdminCustomerCareDashboard />
    </Suspense>
  );
}
