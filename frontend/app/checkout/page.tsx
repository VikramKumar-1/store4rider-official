import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutPageModule } from "@/modules/checkout/components/CheckoutPageModule";

export const metadata: Metadata = {
  title: "Secure Checkout | Store4Riders",
  description: "Complete your order with secure payment options and expedited shipping at Store4Riders.",
};

export default function CheckoutPageWrapper() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#AB1509] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-neutral-500 animate-pulse tracking-wide uppercase">Preparing Secure Checkout...</p>
        </div>
      }
    >
      <CheckoutPageModule />
    </Suspense>
  );
}
