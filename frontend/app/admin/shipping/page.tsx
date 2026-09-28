import { AdminShippingDashboard } from "@/modules/admin-shipping/components/AdminShippingDashboard";

export const metadata = {
  title: "Shipping Management | Admin | Store4Riders",
  description: "Manage orders shipments, warehouses, and fulfillment."
};

export default function AdminShippingPage() {
  return <AdminShippingDashboard />;
}
