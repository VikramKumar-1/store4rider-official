"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { formatPrice } from "@store4riders/shared-utils";
import { ChevronRightIcon, CheckIcon, ShoppingBagIcon } from "@heroicons/react/24/solid";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80";

/**
 * Premium Toast & Quick Cart System
 * 
 * Rules:
 * 1. Single, ultra-premium dark glassmorphism toast when items are added.
 * 2. Compact floating mini-pill on right side (Catalog, Search & Product Page).
 * 3. Clicking the right mini-pill opens the slide-over Side Cart Drawer instantly!
 * 4. Never shown on Homepage ("/"), Cart ("/cart"), or Checkout ("/checkout").
 */
export const BlinkitFloatingCart: React.FC = () => {
  const pathname = usePathname();
  const { items, openDrawer } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<{ name: string; price: number; image: string } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    setPrevCount(items.reduce((s, i) => s + (i.quantity || 1), 0));
  }, []);

  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalAmount = items.reduce((sum, item) => {
    const price = item.product?.basePrice || (item as any).price || 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  // STRICT RULE: ONLY show on Catalog Page ("/products") and Product Description Pages ("/products/[slug]")
  const isProductPage = pathname === "/products" || pathname?.startsWith("/products/") || pathname?.startsWith("/search");

  if (!mounted || !isProductPage) {
    return null;
  }

  // Check if current route is Product Detail Page
  const isPDP = pathname.includes("/products/") && pathname.split("/").filter(Boolean).length >= 2;

  // Stack of up to 2 thumbnails for the compact mini pill
  const previewThumbnails = items.slice(-2).map((item) => {
    return item.product?.images?.[0]?.url || item.product?.image || FALLBACK_IMAGE;
  });

  return (
    <>
      {/* COMPACT RIGHT-SIDE FLOATING MINI PILL (Click opens side cart drawer) */}
      {items.length > 0 && (
        <aside 
          aria-label="Quick Cart Widget" 
          className={`fixed ${isPDP ? 'bottom-24 md:bottom-24' : 'bottom-6'} right-4 sm:right-6 z-40 pointer-events-auto`}
        >
          <button
            onClick={openDrawer}
            aria-label="Open Cart Drawer"
            className="group flex items-center gap-2.5 bg-[#0f0f11]/95 hover:bg-black text-white pl-2.5 pr-3.5 py-2 rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.5)] border border-white/15 backdrop-blur-xl transition-all duration-300 transform hover:scale-105 active:scale-95 animate-in slide-in-from-bottom-3"
          >
            {/* Thumbnails Stack */}
            <div className="flex items-center -space-x-2 shrink-0">
              {previewThumbnails.map((thumb, idx) => (
                <div
                  key={idx}
                  className="relative w-6 h-6 rounded-full overflow-hidden border border-neutral-700 bg-white shrink-0 shadow-xs"
                >
                  <Image
                    src={thumb}
                    alt="Cart preview"
                    fill
                    className="object-contain p-0.5"
                    sizes="24px"
                  />
                </div>
              ))}
            </div>

            {/* Compact Cart Info */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-neutral-300">
                {totalQuantity} {totalQuantity === 1 ? "Item" : "Items"}
              </span>
              <span className="text-neutral-500 font-bold">•</span>
              <span className="font-black text-white tracking-tight">
                {formatPrice(totalAmount)}
              </span>
            </div>

            {/* Arrow CTA */}
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-banner group-hover:text-white transition-colors shrink-0 ml-0.5">
              <ChevronRightIcon className="w-3 h-3 stroke-[2.5]" />
            </div>
          </button>
        </aside>
      )}
    </>
  );
};

export default BlinkitFloatingCart;
