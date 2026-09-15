import { CartPageModule } from "@/modules/cart/components/CartPageModule";

export const metadata = {
  title: "Shopping Cart | Store4Riders",
  description: "Shopping Cart page.",
};

export default function CartPageWrapper() {
  return <CartPageModule />;
}
