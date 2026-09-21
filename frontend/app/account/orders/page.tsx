import type { Metadata } from "next";
import { OrderHistory } from "@/modules/account/components/OrderHistory";

export const metadata: Metadata = {
  title: "Order History | Store4Riders",
  description: "View and track your motorcycle gear orders and shipments on Store4Riders.",
};

export default function OrdersPage() {
  return <OrderHistory />;
}

