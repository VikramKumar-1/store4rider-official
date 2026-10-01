"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import { formatPrice } from "@store4riders/shared-utils";
import { ChevronRightIcon, CheckIcon, ShoppingBagIcon } from "@heroicons/react/24/solid";

const FALLBACK_IMAGE = "/no-image.svg";

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
  const isBottomModalOpen = useUIStore((state) => state.isBottomModalOpen);
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
          className={`fixed ${isPDP ? 'bottom-[170px] lg:bottom-[100px]' : 'bottom-[100px] lg:bottom-6'} right-4 sm:right-6 z-[50] transition-all duration-300 ${
            isBottomModalOpen ? "translate-y-[20px] opacity-0 pointer-events-none" : "translate-y-0 opacity-100 pointer-events-auto"
          }`}
        >
          {/* MOBILE: Small Bag Icon */}
          <button
            onClick={openDrawer}
            aria-label="Open Cart Drawer"
            className="sm:hidden relative flex items-center justify-center w-12 h-12 bg-neutral-900 text-white rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.25)] border border-white/10 hover:bg-black transition-colors animate-in zoom-in"
          >
            <ShoppingBagIcon className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-banner text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {totalQuantity > 99 ? "99+" : totalQuantity}
            </span>
          </button>

          {/* DESKTOP: Full Pill */}
          <button
            onClick={openDrawer}
            aria-label="Open Cart Drawer"
            className="hidden sm:flex group items-center gap-3 bg-[#0f0f11] hover:bg-black text-white pl-3 pr-4 py-2.5 rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.4)] border border-white/10 transition-colors duration-200 animate-in slide-in-from-bottom-3 antialiased"
          >
            {/* Thumbnails Stack */}
            <div className="flex items-center -space-x-2 shrink-0">
              {previewThumbnails.map((thumb, idx) => (
                <div
                  key={idx}
                  className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-[#0f0f11] bg-white shrink-0 shadow-sm"
                >
                  <Image
                    src={thumb}
                    alt="Cart preview"
                    fill
                    className="object-contain p-0.5"
                    sizes="28px"
                  />
                </div>
              ))}
            </div>

            {/* Compact Cart Info */}
            <div className="flex items-center gap-2.5 text-[13px]">
              <span className="font-bold text-neutral-300">
                {totalQuantity} {totalQuantity === 1 ? "Item" : "Items"}
              </span>
              <span className="text-neutral-600 font-black text-[10px] mb-px">•</span>
              <span className="font-black text-white tracking-tight">
                {formatPrice(totalAmount)}
              </span>
            </div>

            {/* Arrow CTA */}
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-banner group-hover:text-white transition-colors shrink-0 ml-1">
              <ChevronRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </button>
        </aside>
      )}
    </>
  );
};

export default BlinkitFloatingCart;
