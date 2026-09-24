import { Suspense } from "react";
import { CheckoutCallbackModule } from "@/modules/checkout/components/CheckoutCallbackModule";

export const metadata = { title: "Payment Callback | Store4Riders" };

export default function CheckoutCallbackPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20">Loading payment status...</div>}>
      <CheckoutCallbackModule />
    </Suspense>
  );
}
