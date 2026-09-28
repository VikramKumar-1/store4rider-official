import { AdminOrderListModule } from "@/modules/admin-orders";

export const metadata = {
  title: "Manage Orders | Admin",
};

export default function AdminOrdersPage() {
  return <AdminOrderListModule />;
}
