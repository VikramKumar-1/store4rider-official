import { OrderDetails } from "@/modules/account/components/OrderDetails";

export const metadata = { title: "Order Details | Store4Riders" };

export default async function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = await params;
  return <OrderDetails orderId={resolvedParams.orderId} />;
}
