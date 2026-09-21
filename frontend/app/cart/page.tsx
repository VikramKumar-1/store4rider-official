import type { Metadata } from "next";
import { CartPageModule } from "@/modules/cart/components/CartPageModule";

export const metadata: Metadata = {
  title: "Shopping Cart | Store4Riders",
  description: "Review your selected motorcycle riding gear, helmets, and accessories in your cart before checkout.",
};

export default function CartPageWrapper() {
  return <CartPageModule />;
}

