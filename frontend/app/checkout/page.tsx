import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutPageModule } from "@/modules/checkout/components/CheckoutPageModule";

export const metadata: Metadata = {
  title: "Secure Checkout | Store4Riders",
  description: "Complete your order with secure payment options and expedited shipping at Store4Riders.",
};

export default function CheckoutPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <CheckoutPageModule />
    </Suspense>
  );
}

