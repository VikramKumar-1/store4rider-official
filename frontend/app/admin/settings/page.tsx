import { Suspense } from "react";
import AdminSettingsDashboard from "@/modules/admin/components/AdminSettingsDashboard";

export const metadata = {
  title: "Settings | Admin | Store4Riders",
};

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Loading settings...</div>}>
      <AdminSettingsDashboard />
    </Suspense>
  );
}
