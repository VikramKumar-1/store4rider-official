"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatPrice } from "@store4riders/shared-utils";
import { 
  XMarkIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon, 
  ShoppingBagIcon, 
  ArrowRightIcon,
  ShieldCheckIcon,
  TruckIcon
} from "@heroicons/react/24/outline";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80";

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { items, isDrawerOpen, closeDrawer, removeItem, updateQuantity } = useCartStore();

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.basePrice || (item as any).price || 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  const freeShippingThreshold = 2500;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleCheckoutClick = () => {
    closeDrawer();
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  const handleViewCartClick = () => {
    closeDrawer();
    router.push("/cart");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        onClick={closeDrawer}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Side Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right duration-300">
          
          {/* 1. Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-banner flex items-center justify-center">
                <ShoppingBagIcon className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-sans font-bold text-base text-neutral-900 uppercase tracking-tight">
                  YOUR CART
                </h2>
                <span className="text-[11px] font-semibold text-neutral-400">
                  {totalQuantity} {totalQuantity === 1 ? "item" : "items"} selected
                </span>
              </div>
            </div>

            <button
              onClick={closeDrawer}
              aria-label="Close cart drawer"
              className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-sm hover:bg-neutral-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="bg-orange-50/70 border-b border-orange-100 px-4 py-2.5 flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-800 font-medium">
              <TruckIcon className="w-4 h-4 text-banner shrink-0" />
              {isFreeShipping ? (
                <span className="text-emerald-700 font-bold">
                  🎉 You have unlocked <strong>FREE Shipping</strong>!
                </span>
              ) : (
                <span>
                  Add <strong className="text-banner">{formatPrice(amountToFreeShipping)}</strong> more for <strong>FREE Delivery</strong>
                </span>
              )}
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-banner transition-all duration-500 rounded-full"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>

          {/* 2. Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-neutral-100 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mb-4">
                  <ShoppingBagIcon className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="font-sans font-bold text-base text-neutral-800 mb-1">Your cart is empty</h3>
                <p className="text-xs text-neutral-500 max-w-xs mb-6">
                  Add riding boots, jackets, and accessories to your cart.
                </p>
                <button
                  onClick={() => {
                    closeDrawer();
                    router.push("/products");
                  }}
                  className="bg-banner hover:bg-orange-600 text-white font-bold tracking-widest text-xs uppercase px-6 py-3 rounded-sm shadow-sm transition-all"
                >
                  START SHOPPING
                </button>
              </div>
            ) : (
              items.map((item, idx) => {
                const product = item.product || {};
                const name = product.name || "Riding Gear";
                const price = product.basePrice || (item as any).price || 0;
                const rawImg = product.images?.[0]?.url || product.image || FALLBACK_IMAGE;
                const selectedColor = product.selectedColor || "";
                const selectedSize = product.selectedSize || "";

                return (
                  <div key={`${item.productId}-${item.variantId || idx}`} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                    
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 bg-neutral-100 rounded-sm overflow-hidden shrink-0 border border-neutral-200">
                      <Image
                        src={rawImg}
                        alt={name}
                        fill
                        className="object-contain p-1"
                        sizes="80px"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <h4 className="font-sans font-bold text-xs sm:text-sm text-neutral-900 uppercase line-clamp-2 leading-snug">
                        {name}
                      </h4>

                      {/* Variant (Color / Size) */}
                      {(selectedColor || selectedSize) && (
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mt-0.5">
                          {selectedColor && <span>{selectedColor}</span>}
                          {selectedColor && selectedSize && <span>•</span>}
                          {selectedSize && <span>Size {selectedSize}</span>}
                        </div>
                      )}

                      {/* Price */}
                      <span className="font-bold text-xs sm:text-sm text-neutral-900 mt-1">
                        {formatPrice(price)}
                      </span>

                      {/* Quantity Stepper & Delete */}
                      <div className="flex items-center justify-between mt-2 pt-1">
                        <div className="inline-flex items-center border border-neutral-300 rounded-sm bg-white">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                            aria-label="Decrease quantity"
                            className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                          >
                            <MinusIcon className="w-2.5 h-2.5 stroke-[2.5]" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-neutral-900 select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                            aria-label="Increase quantity"
                            className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                          >
                            <PlusIcon className="w-2.5 h-2.5 stroke-[2.5]" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          aria-label="Remove item"
                          className="text-neutral-400 hover:text-red-600 p-1 transition-colors"
                          title="Remove item"
                        >
                          <TrashIcon className="w-4 h-4 stroke-[1.5]" />
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* 3. Drawer Footer Summary & CTAs */}
          {items.length > 0 && (
            <div className="border-t border-neutral-200 p-4 sm:p-5 bg-neutral-50/70 flex flex-col gap-3">
              
              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm text-neutral-600">
                <span>Subtotal</span>
                <span className="font-bold text-base text-neutral-900">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Taxes & Shipping calculated at checkout</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheckIcon className="w-3.5 h-3.5" /> 100% Safe
                </span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckoutClick}
                className="w-full bg-banner hover:bg-orange-600 text-white font-bold tracking-widest text-xs uppercase py-3.5 rounded-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>

              {/* View Full Cart Page Link */}
              <button
                onClick={handleViewCartClick}
                className="w-full text-center text-xs font-bold text-neutral-600 hover:text-neutral-900 py-1.5 uppercase tracking-wider hover:underline"
              >
                View Full Cart
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
