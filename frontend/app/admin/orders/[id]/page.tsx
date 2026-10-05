import { AdminOrderDetailModule } from "@/modules/admin-orders";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Details | Admin | Store4Riders",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <AdminOrderDetailModule orderId={resolvedParams.id} />;
}
