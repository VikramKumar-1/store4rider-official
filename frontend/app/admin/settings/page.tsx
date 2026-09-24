import { AdminPaymentSettings } from "@/modules/admin/components/AdminPaymentSettings";

export const metadata = {
  title: "Payment Settings | Admin | Store4Riders",
};

export default function AdminSettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payment Settings</h1>
      <AdminPaymentSettings />
    </div>
  );
}
