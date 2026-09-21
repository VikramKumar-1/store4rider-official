import type { Metadata } from "next";
import { WishlistGrid } from "@/modules/account/components/WishlistGrid";

export const metadata: Metadata = {
  title: "My Wishlist | Store4Riders",
  description: "Saved motorcycle jackets, helmets, riding pants, and accessories on Store4Riders.",
};

export default function WishlistPage() {
  return <WishlistGrid />;
}

