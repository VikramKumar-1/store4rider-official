import { OrderTrackingModule } from "@/modules/order-tracking/components/OrderTrackingModule";

export const metadata = { title: "Track Order | Store4Riders" };

export default async function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = await params;
  return <OrderTrackingModule orderId={resolvedParams.orderId} />;
}
