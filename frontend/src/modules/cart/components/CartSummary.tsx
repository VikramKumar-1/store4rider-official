"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { formatPrice } from "@store4riders/shared-utils";

interface CartSummaryProps {
  totalItems: number;
  totalPrice: number;
}

export function CartSummary({ totalItems, totalPrice }: CartSummaryProps) {
  if (totalItems === 0) return null;

  return (
    <div className="glass p-6 rounded-xl h-fit sticky top-24">
      <h2 className="text-xl font-bold mb-6">Order Summary</h2>
      
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
          <span>Subtotal ({totalItems} items)</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
          <span>Shipping</span>
          <span className="text-green-500">Free</span>
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-brand">{formatPrice(totalPrice)}</span>
        </div>
      </div>

      <Link href="/checkout" className="block w-full">
        <Button size="lg" className="w-full text-lg">
          Proceed to Checkout
        </Button>
      </Link>

      <p className="text-xs text-neutral-400 text-center mt-3 font-medium">
        Have a promo code? Apply it at checkout.
      </p>
    </div>
  );
}
