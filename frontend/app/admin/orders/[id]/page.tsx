import { AdminOrderDetailModule } from "@/modules/admin-orders";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Details | Admin | Store4Riders",
};

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  return <AdminOrderDetailModule orderId={params.id} />;
}
