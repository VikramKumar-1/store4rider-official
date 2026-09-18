"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatPrice } from "@store4riders/shared-utils";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";
import Footer from "@/modules/homepage/components/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TrashIcon, PlusIcon, MinusIcon, XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80";

interface PromoCodeItem {
  code: string;
  validUntil: string;
  description: string;
  type: "percent" | "flat";
  value: number;
  minSpend?: number;
  maxCap?: number;
}

const AVAILABLE_PROMOS: PromoCodeItem[] = [
  {
    code: "DISCOUNT20",
    validUntil: "Valid until 31 August 2026",
    description: "Avail a 20% discount, capped at ₹2,000, exclusively for new members.",
    type: "percent",
    value: 0.20,
    maxCap: 2000,
  },
  {
    code: "50KDISCOUNT",
    validUntil: "Valid until 31 August 2026",
    description: "Offering a ₹500 discount without minimum payment, exclusively for new members.",
    type: "flat",
    value: 500,
  },
  {
    code: "DISCOUNT50",
    validUntil: "Valid until 31 August 2026",
    description: "Offering a 50% discount, up to a maximum of ₹3,000, for new members on purchases of at least ₹5,000.",
    type: "percent",
    value: 0.50,
    minSpend: 5000,
    maxCap: 3000,
  },
];

export const CartPageModule = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { items, removeItem, updateQuantity } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeItem | null>(null);
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col font-sans">
        <TopBanner message="Discount 20% For New Member," highlightText="ONLY FOR TODAY!!" />
        <div className="bg-white border-b border-neutral-200">
          <Navbar
            logoText="Store4Riders"
            theme="light"
            navItems={[
              { id: "catalog", label: "Catalog", href: "/products", hasDropdown: true },
              { id: "sale", label: "Sale", href: "/sale" },
              { id: "new-arrival", label: "New Arrival", href: "/products?sort=newest" },
              { id: "about", label: "About", href: "/about" },
            ]}
          />
        </div>
        <div className="max-w-[1400px] w-full mx-auto px-4 md:px-8 py-16 animate-pulse">
          <div className="h-12 w-48 bg-neutral-100 rounded mb-10" />
          <div className="h-64 bg-neutral-50 rounded" />
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((total, item) => {
    const itemPrice = item.product?.basePrice || (item as any).price || 0;
    return total + itemPrice * item.quantity;
  }, 0);

  // Calculate discount based on applied promo
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.minSpend && subtotal < appliedPromo.minSpend) {
      discount = 0;
    } else if (appliedPromo.type === "percent") {
      const calculated = subtotal * appliedPromo.value;
      discount = appliedPromo.maxCap ? Math.min(calculated, appliedPromo.maxCap) : calculated;
    } else if (appliedPromo.type === "flat") {
      discount = appliedPromo.value;
    }
  }
  discount = Math.round(discount);
  const total = Math.max(0, subtotal - discount);

  const handleSelectPromo = (promo: PromoCodeItem) => {
    if (promo.minSpend && subtotal < promo.minSpend) {
      toast.error(`Minimum order amount of ₹${promo.minSpend} required for ${promo.code}`);
      return;
    }
    setAppliedPromo(promo);
    setIsPromoModalOpen(false);
    toast.success(`Promo code ${promo.code} applied!`);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    toast.info("Voucher removed");
  };

  const handleNoteChange = (itemKey: string, val: string) => {
    setOrderNotes(prev => ({ ...prev, [itemKey]: val }));
  };

  const toggleNoteExpanded = (itemKey: string) => {
    setExpandedNotes(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col font-sans relative">
      
      {/* 1. Header Global Area */}
      <TopBanner
        message="Discount 20% For New Member,"
        highlightText="ONLY FOR TODAY!!"
      />
      <div className="bg-white border-b border-neutral-200 relative z-40">
        <Navbar
          logoText="Store4Riders"
          theme="light"
          navItems={[
            { id: "catalog", label: "Catalog", href: "/products", hasDropdown: true },
            { id: "sale", label: "Sale", href: "/sale" },
            { id: "new-arrival", label: "New Arrival", href: "/products?sort=newest" },
            { id: "about", label: "About", href: "/about" },
          ]}
        />
      </div>

      {/* Breadcrumb Navigation matching URL /cart */}
      <Breadcrumb items={[
        { label: "HOME", href: "/" },
        { label: "CART" }
      ]} />

      {/* 2. Main Content Area */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex-1">
        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="py-16 md:py-24 text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-6">
              <ShoppingBag className="w-9 h-9" />
            </div>
            <h2 className="font-sans font-extrabold text-2xl md:text-3xl text-neutral-900 mb-3 uppercase tracking-wide">Your Cart is Empty</h2>
            <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
              Looks like you haven't added any riding gear to your bag yet. Explore our collection of premium motorcycle boots, jackets, and armor.
            </p>
            <Link
              href="/products"
              className="bg-[#78350F] hover:bg-[#5E2B0C] text-white px-8 py-3.5 rounded-sm text-xs font-bold tracking-widest uppercase transition-all shadow-md"
            >
              BROWSE CATALOG
            </Link>
          </div>
        ) : (
          /* Two Column Cart Layout */
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
            
            {/* Left Column: Cart Items List */}
            <div className="w-full lg:w-[62%] flex flex-col divide-y divide-neutral-200">
              {items.map((item, idx) => {
                const product = item.product || {};
                const name = product.name || "Riding Gear";
                const price = product.basePrice || (item as any).price || 0;
                const originalPrice = product.specialPrice ? product.basePrice : Math.round(price * 1.25);
                const hasDiscount = product.specialPrice || originalPrice > price;
                const discountPercent = hasDiscount
                  ? Math.round(((originalPrice - price) / originalPrice) * 100)
                  : 0;

                const rawImg = product.images?.[0]?.url || product.image || FALLBACK_IMAGE;
                const selectedColor = product.selectedColor || "";
                const selectedSize = product.selectedSize || "";
                const itemKey = `${item.productId}-${item.variantId || idx}`;
                const isNoteOpen = expandedNotes[itemKey] !== false; // Default open for first items or on click

                return (
                  <div
                    key={itemKey}
                    className="py-6 first:pt-0 last:pb-0 flex flex-col gap-3"
                  >
                    {/* Item row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
                      
                      {/* Image & Title Info */}
                      <div className="flex items-center gap-4 md:gap-6 flex-1">
                        {/* Product Thumbnail */}
                        <Link
                          href={product.slug ? `/products/${product.slug}` : "/products"}
                          className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-neutral-100 rounded-sm overflow-hidden shrink-0 border border-neutral-200"
                        >
                          <Image
                            src={rawImg}
                            alt={name}
                            fill
                            className="object-contain p-2 hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 96px, 128px"
                          />
                        </Link>

                        {/* Product Details */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <Link
                            href={product.slug ? `/products/${product.slug}` : "/products"}
                            className="font-sans font-bold text-sm sm:text-base text-neutral-900 uppercase hover:text-banner transition-colors line-clamp-2"
                          >
                            {name}
                          </Link>

                          {/* Variant Info (Color / Size) */}
                          {(selectedColor || selectedSize) && (
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                              {selectedColor && <span>Color: {selectedColor}</span>}
                              {selectedColor && selectedSize && <span>•</span>}
                              {selectedSize && <span>Size: {selectedSize}</span>}
                            </div>
                          )}

                          {/* Pricing */}
                          <div className="flex items-center gap-2 mt-0.5">
                            {hasDiscount && (
                              <>
                                <span className="text-xs text-neutral-400 line-through">
                                  {formatPrice(originalPrice)}
                                </span>
                                {discountPercent > 0 && (
                                  <span className="bg-[#DC2626] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-xs">
                                    {discountPercent}%
                                  </span>
                                )}
                              </>
                            )}
                            <span className={`text-sm md:text-base font-bold ${hasDiscount ? "text-[#DC2626]" : "text-neutral-900"}`}>
                              {formatPrice(price)}
                            </span>
                          </div>

                          {/* Quantity Stepper */}
                          <div className="mt-2 inline-flex items-center border border-neutral-300 rounded-sm w-fit bg-white">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                              aria-label="Decrease quantity"
                              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                            >
                              <MinusIcon className="w-3 h-3 stroke-[2]" />
                            </button>
                            <span className="w-8 md:w-10 text-center text-xs md:text-sm font-bold text-neutral-900 select-none">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                              aria-label="Increase quantity"
                              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                            >
                              <PlusIcon className="w-3 h-3 stroke-[2]" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <div className="flex sm:flex-col items-end sm:items-center justify-end pl-2 sm:pl-4">
                        <button
                          onClick={() => removeItem(item.productId, item.variantId, item.id)}
                          aria-label="Remove item"
                          className="text-neutral-400 hover:text-red-600 transition-colors flex items-center gap-1 text-xs md:text-sm font-medium underline underline-offset-4 group"
                        >
                          <TrashIcon className="w-4 h-4 stroke-[1.5] group-hover:scale-110 transition-transform" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Order Notes Field matching Figma design */}
                    <div className="flex flex-col gap-1 w-full">
                      {isNoteOpen ? (
                        <>
                          <label htmlFor={`note-${itemKey}`} className="text-xs text-neutral-500 font-medium">
                            Notes:
                          </label>
                          <input
                            id={`note-${itemKey}`}
                            type="text"
                            placeholder="Eg: Please double check before packing."
                            value={orderNotes[itemKey] || ""}
                            onChange={(e) => handleNoteChange(itemKey, e.target.value)}
                            className="w-full text-xs text-neutral-800 placeholder:text-neutral-400 border border-neutral-300 rounded-sm px-3.5 py-2.5 focus:outline-none focus:border-neutral-900 bg-white"
                          />
                        </>
                      ) : (
                        <button
                          onClick={() => toggleNoteExpanded(itemKey)}
                          className="text-xs text-neutral-500 underline text-left hover:text-neutral-900 w-fit"
                        >
                          Notes
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Right Column: Shopping Info Summary (Sticky on desktop scroll) */}
            <div className="w-full lg:w-[38%] lg:sticky lg:top-24 bg-white z-20">
              <div className="flex flex-col">
                
                {/* Heading */}
                <h2 className="font-sans font-bold text-xl sm:text-2xl text-neutral-900 tracking-tight uppercase mb-6">
                  SHOPPING INFO
                </h2>

                {/* Promo Code Alert Banner (when no promo is applied) */}
                {!appliedPromo && showPromoBanner && (
                  <div className="bg-banner text-white px-4 py-3 rounded-sm text-xs font-semibold flex items-center justify-between shadow-sm mb-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>Hooray! You have promo code!</span>
                      <button
                        onClick={() => setIsPromoModalOpen(true)}
                        className="underline font-bold hover:text-white/85 cursor-pointer ml-1"
                      >
                        Use promo code
                      </button>
                    </div>
                    <button
                      onClick={() => setShowPromoBanner(false)}
                      aria-label="Close banner"
                      className="text-white/80 hover:text-white ml-2 p-0.5"
                    >
                      <XMarkIcon className="w-4 h-4 stroke-[2]" />
                    </button>
                  </div>
                )}

                {/* Cost Breakdown */}
                <div className="flex flex-col gap-3.5 py-4 border-t border-b border-neutral-200">
                  <div className="flex items-center justify-between text-sm md:text-base text-neutral-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-neutral-900">{formatPrice(subtotal)}</span>
                  </div>

                  {/* Applied Voucher Row matching Figma screenshot */}
                  {appliedPromo && (
                    <div className="flex items-center justify-between text-sm md:text-base font-semibold">
                      <span className="text-neutral-600">Voucher ({appliedPromo.code})</span>
                      <span className="text-[#DC2626] font-bold">-{formatPrice(discount)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-base md:text-lg text-neutral-900 font-bold pt-1">
                    <span>Total</span>
                    <span className="text-xl md:text-2xl font-extrabold text-neutral-900">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons: CHANGE VOUCHER & PROCEED TO CHECKOUT */}
                <div className="flex flex-col gap-3 mt-6">
                  {appliedPromo && (
                    <button
                      onClick={() => setIsPromoModalOpen(true)}
                      className="w-full bg-white border border-[#78350F] text-[#78350F] hover:bg-neutral-50 font-bold tracking-widest text-xs uppercase py-3.5 rounded-sm transition-colors text-center shadow-xs"
                    >
                      CHANGE VOUCHER
                    </button>
                  )}

                  <button
                    onClick={handleProceedToCheckout}
                    className="block w-full bg-[#78350F] hover:bg-[#5E2B0C] text-white text-center py-4 rounded-sm font-bold tracking-widest text-xs md:text-sm uppercase shadow-md transition-all active:scale-[0.99] cursor-pointer"
                  >
                    PROCEED TO CHECKOUT
                  </button>
                </div>

                {/* Additional reassuring perks */}
                <div className="flex items-center justify-between gap-4 mt-6 pt-6 border-t border-neutral-100 text-[11px] text-neutral-400 font-medium uppercase tracking-wider text-center">
                  <span>✓ 100% Secure Checkout</span>
                  <span>•</span>
                  <span>✓ Fast Dispatch</span>
                  <span>•</span>
                  <span>✓ Easy Returns</span>
                </div>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* 3. Promo Code Modal Popup matching Figma Modal */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-sm shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h3 className="font-sans font-bold text-lg sm:text-xl text-neutral-900 uppercase tracking-tight">
                PROMO CODE
              </h3>
              <button
                onClick={() => setIsPromoModalOpen(false)}
                aria-label="Close modal"
                className="text-neutral-400 hover:text-neutral-800 transition-colors p-1"
              >
                <XMarkIcon className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Promo Options List */}
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {AVAILABLE_PROMOS.map((promo) => {
                const isSelected = appliedPromo?.code === promo.code;
                const isEligible = !promo.minSpend || subtotal >= promo.minSpend;

                return (
                  <div
                    key={promo.code}
                    onClick={() => isEligible && handleSelectPromo(promo)}
                    className={`border p-4 rounded-sm transition-all cursor-pointer flex flex-col gap-2 relative ${
                      isSelected
                        ? "border-[#78350F] bg-amber-50/30 ring-1 ring-[#78350F]"
                        : isEligible
                        ? "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
                        : "border-neutral-200 opacity-50 cursor-not-allowed bg-neutral-50"
                    }`}
                  >
                    {/* Top Row: Code & Validity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-sm sm:text-base text-neutral-900 tracking-wide">
                          {promo.code}
                        </span>
                        {isSelected && (
                          <span className="bg-[#78350F] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs flex items-center gap-0.5">
                            <CheckCircleIcon className="w-3 h-3 stroke-[2.5]" />
                            APPLIED
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 font-medium">
                        {promo.validUntil}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                      {promo.description}
                    </p>

                    {!isEligible && promo.minSpend && (
                      <span className="text-[10px] text-red-500 font-semibold">
                        Add {formatPrice(promo.minSpend - subtotal)} more to unlock
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Close / Apply Footer */}
            <div className="pt-2 flex justify-between items-center border-t border-neutral-100">
              {appliedPromo ? (
                <button
                  onClick={handleRemovePromo}
                  className="text-xs font-bold text-red-600 hover:underline uppercase"
                >
                  Remove Voucher
                </button>
              ) : <div />}
              <button
                onClick={() => setIsPromoModalOpen(false)}
                className="text-xs uppercase font-bold text-neutral-500 hover:text-neutral-900 px-4 py-2"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. Global Footer */}
      <Footer />

    </div>
  );
};
