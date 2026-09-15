import { CheckoutPageModule } from "@/modules/checkout/components/CheckoutPageModule";

export const metadata = {
  title: "Secure Checkout | Store4Riders",
  description: "Secure Checkout page.",
};

export default function CheckoutPageWrapper() {
  return <CheckoutPageModule />;
}
