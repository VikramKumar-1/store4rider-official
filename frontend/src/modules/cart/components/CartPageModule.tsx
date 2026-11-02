"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useProductsBySkus } from "@/core/hooks/useProducts";
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
import { ShoppingBag, Tag } from "lucide-react";
import { usePublicCoupons, useValidateCoupon } from "@/core/hooks/useCoupons";
import { ICoupon } from "@store4riders/shared-types";
import { toast } from "sonner";
import { getCartItemImage } from "@/core/utils/mediaUrlHelper";

const FALLBACK_IMAGE = "/no-image.svg";

interface AppliedCouponState {
  code: string;
  discountAmount: number;
}

export const CartPageModule = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { items, removeItem, updateQuantity, addItem, isLoaded } = useCartStore();

  // Extract Cross-Sell SKUs configured on products currently in the cart
  const crosssellSkus = useMemo(() => {
    const rawSkus = items.flatMap((i) => i.product?.crosssellSkus || []);
    const inCartSkus = new Set(items.map((i) => i.product?.sku || (i as any).sku));
    return Array.from(new Set(rawSkus)).filter((sku) => Boolean(sku) && !inCartSkus.has(sku)).slice(0, 4);
  }, [items]);

  const { data: crosssellProducts } = useProductsBySkus(crosssellSkus);
  const { data: publicCoupons = [], isLoading: isCouponsLoading } = usePublicCoupons();
  const validateCouponMutation = useValidateCoupon();

  const [mounted, setMounted] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponState | null>(null);
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [isNavigating, setIsNavigating] = useState(false);

  const handleProceedToCheckout = () => {
    setIsNavigating(true);
    router.push("/checkout");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      const itemPrice = item.price ?? item.product?.price ?? item.product?.specialPrice ?? item.product?.basePrice ?? 0;
      return total + itemPrice * item.quantity;
    }, 0);
  }, [items]);

  // Restore applied coupon from localStorage if user is authenticated
  useEffect(() => {
    if (!mounted || !isAuthenticated || appliedCoupon) return;
    try {
      const saved = localStorage.getItem("s4r_checkout_coupon");
      if (saved && items.length > 0 && subtotal > 0) {
        const parsed = JSON.parse(saved);
        const code = typeof parsed === "string" ? parsed : parsed?.code;
        if (code && !validateCouponMutation.isPending) {
          const itemsPayload = items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId || null,
            quantity: it.quantity,
          }));
          validateCouponMutation.mutateAsync({
            code,
            items: itemsPayload,
            cartTotal: subtotal,
          }).then((res) => {
            setAppliedCoupon({
              code: res.code,
              discountAmount: res.discountAmount,
            });
          }).catch(() => {
            localStorage.removeItem("s4r_checkout_coupon");
          });
        }
      }
    } catch {}
  }, [mounted, isAuthenticated, items, subtotal]);

  // Re-validate coupon if cart subtotal or items change
  const prevSubtotalRef = useRef(subtotal);
  useEffect(() => {
    if (prevSubtotalRef.current !== subtotal) {
      prevSubtotalRef.current = subtotal;
      if (appliedCoupon && items.length > 0) {
        const itemsPayload = items.map((it) => ({
          productId: it.productId,
          variantId: it.variantId || null,
          quantity: it.quantity,
        }));
        validateCouponMutation.mutateAsync({
          code: appliedCoupon.code,
          items: itemsPayload,
          cartTotal: subtotal,
        }).then((res) => {
          setAppliedCoupon({
            code: res.code,
            discountAmount: res.discountAmount,
          });
          localStorage.setItem("s4r_checkout_coupon", JSON.stringify({ code: res.code, discountAmount: res.discountAmount }));
        }).catch(() => {
          setAppliedCoupon(null);
          localStorage.removeItem("s4r_checkout_coupon");
          toast.info("Cart updated. Promo code was removed as conditions changed.");
        });
      }
    }
  }, [subtotal, appliedCoupon, items]);

  if (!mounted || !isLoaded) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col font-sans">
        <TopBanner message="Discount 20% For New Member," highlightText="ONLY FOR TODAY!!" />
        <div className="bg-white border-b border-neutral-200">
          <Navbar logoText="Store4Riders" theme="light" />
        </div>
        <div className="max-w-[1400px] w-full mx-auto px-4 md:px-8 py-16 animate-pulse">
          <div className="h-12 w-48 bg-neutral-100 rounded mb-10" />
          <div className="h-64 bg-neutral-50 rounded" />
        </div>
      </div>
    );
  }

  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal - discount);

  const handleApplyCouponCode = async (rawCode: string) => {
    if (!isAuthenticated) {
      toast.error("Please sign in or create an account to use promo coupons");
      router.push("/login?redirect=/cart");
      return;
    }
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a valid coupon code");
      return;
    }
    const itemsPayload = items.map((it) => ({
      productId: it.productId,
      variantId: it.variantId || null,
      quantity: it.quantity,
    }));
    try {
      const res = await validateCouponMutation.mutateAsync({
        code,
        items: itemsPayload,
        cartTotal: subtotal,
      });
      setAppliedCoupon({
        code: res.code,
        discountAmount: res.discountAmount,
      });
      localStorage.setItem("s4r_checkout_coupon", JSON.stringify({ code: res.code, discountAmount: res.discountAmount }));
      setIsPromoModalOpen(false);
      setManualCodeInput("");
      toast.success(res.message || `Coupon "${res.code}" applied!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid or ineligible promo code for your cart items");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem("s4r_checkout_coupon");
    toast.info("Voucher removed");
  };

  const handleNoteChange = (itemKey: string, val: string) => {
    setOrderNotes((prev) => ({ ...prev, [itemKey]: val }));
  };

  const toggleNoteExpanded = (itemKey: string) => {
    setExpandedNotes((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col font-sans relative">
      {/* 1. Header Global Area */}
      <TopBanner message="Discount 20% For New Member," highlightText="ONLY FOR TODAY!!" />
      <div className="bg-white border-b border-neutral-200 relative z-40">
        <Navbar logoText="Store4Riders" theme="light" />
      </div>

      {/* Breadcrumb Navigation matching URL /cart */}
      <Breadcrumb items={[{ label: "HOME", href: "/" }, { label: "CART" }]} />

      {/* 2. Main Content Area */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex-1">
        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="py-16 md:py-24 text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-6">
              <ShoppingBag className="w-9 h-9" />
            </div>
            <h2 className="font-sans font-extrabold text-2xl md:text-3xl text-neutral-900 mb-3 uppercase tracking-wide">
              Your Cart is Empty
            </h2>
            <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
              Looks like you haven't added any riding gear to your bag yet. Explore our collection of premium motorcycle helmets, jackets, and accessories.
            </p>
            <Link
              href="/products"
              className="bg-banner hover:bg-orange-600 text-white px-8 py-3.5 rounded-sm text-xs font-bold tracking-widest uppercase transition-all shadow-md"
            >
              BROWSE CATALOG
            </Link>
          </div>
        ) : (
          /* Two Column Cart Layout */
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
            {/* Left Column: Cart Items List */}
            <div className="w-full lg:w-[62%] flex flex-col divide-y divide-neutral-200 pb-28 lg:pb-0">
              {items.map((item, idx) => {
                const product = item.product || {};
                const name = product.name || "Riding Gear";
                const price = item.price ?? product.specialPrice ?? (item as any).price ?? product.basePrice ?? 0;
                const originalPrice =
                  product.specialPrice && product.basePrice > product.specialPrice
                    ? product.basePrice
                    : item.originalPrice || price;
                const hasDiscount = product.specialPrice || originalPrice > price;
                const discountPercent = hasDiscount
                  ? Math.round(((originalPrice - price) / originalPrice) * 100)
                  : 0;

                const rawImg = getCartItemImage(item, FALLBACK_IMAGE);
                const selectedColor = product.selectedColor || "";
                const selectedSize = product.selectedSize || "";
                const itemKey = `${item.productId}-${item.variantId || idx}`;
                const isNoteOpen = expandedNotes[itemKey] !== false;

                return (
                  <div key={itemKey} className="py-6 first:pt-0 last:pb-0 flex flex-col gap-3">
                    {/* Item row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
                      {/* Image & Title Info */}
                      <div className="flex items-center gap-4 md:gap-6 flex-1">
                        <Link
                          href={product.slug ? `/${product.slug}` : "/products"}
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

                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <Link
                            href={product.slug ? `/${product.slug}` : "/products"}
                            className="font-sans font-bold text-sm sm:text-base text-neutral-900 uppercase hover:text-banner transition-colors line-clamp-2"
                          >
                            {name}
                          </Link>

                          {(selectedColor || selectedSize) && (
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                              {selectedColor && <span>Color: {selectedColor}</span>}
                              {selectedColor && selectedSize && <span>•</span>}
                              {selectedSize && <span>Size: {selectedSize}</span>}
                            </div>
                          )}

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
                            <span
                              className={`text-sm md:text-base font-bold ${
                                hasDiscount ? "text-[#DC2626]" : "text-neutral-900"
                              }`}
                            >
                              {formatPrice(price)}
                            </span>
                          </div>

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

                      <div className="flex sm:flex-col items-end sm:items-center justify-end pl-2 sm:pl-4">
                        <button
                          onClick={() => removeItem(item.productId, item.variantId, item.id || (item as any)._id)}
                          aria-label="Remove item"
                          className="text-neutral-400 hover:text-red-600 transition-colors flex items-center gap-1 text-xs md:text-sm font-medium underline underline-offset-4 group"
                        >
                          <TrashIcon className="w-4 h-4 stroke-[1.5] group-hover:scale-110 transition-transform" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

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

              {/* Cross-Sell Recommendations ("Frequently Added Together") */}
              {crosssellProducts && crosssellProducts.length > 0 && (
                <div className="mt-8 pt-6 border-t border-neutral-200">
                  <h3 className="font-sans font-bold text-sm md:text-base text-neutral-900 uppercase tracking-wider mb-3">
                    Frequently Added Together
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {crosssellProducts.map((rec) => {
                      const price = rec.specialPrice || rec.basePrice || 0;
                      const img = rec.images?.[0]?.url || FALLBACK_IMAGE;
                      return (
                        <div
                          key={rec._id}
                          className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-sm hover:border-neutral-300 transition-colors"
                        >
                          <div className="relative w-14 h-14 bg-white rounded-xs border border-neutral-100 flex-shrink-0 overflow-hidden">
                            <Image src={img} alt={rec.name} fill sizes="56px" className="object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/${rec.slug}`}
                              className="font-bold text-xs text-neutral-900 line-clamp-1 hover:text-banner transition-colors"
                            >
                              {rec.name}
                            </Link>
                            <p className="text-xs font-bold text-neutral-900 mt-0.5">{formatPrice(price)}</p>
                            <button
                              type="button"
                              onClick={() => {
                                addItem({
                                  id: rec._id,
                                  productId: rec._id,
                                  quantity: 1,
                                  product: rec,
                                });
                                toast.success(`Added ${rec.name} to cart`);
                              }}
                              className="mt-1 text-[11px] font-bold text-banner hover:underline cursor-pointer"
                            >
                              + Add to Cart
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Shopping Info Summary */}
            <div className="w-full lg:w-[38%] lg:sticky lg:top-24 bg-white z-20">
              <div className="flex flex-col">
                <h2 className="hidden lg:block font-sans font-bold text-xl sm:text-2xl text-neutral-900 tracking-tight uppercase mb-6">
                  SHOPPING INFO
                </h2>

                {/* Promo Banner on Desktop (only for authenticated users if promo available) */}
                {isAuthenticated && !appliedCoupon && showPromoBanner && publicCoupons.length > 0 && (
                  <div className="hidden lg:flex bg-banner text-white px-4 py-3 rounded-sm text-xs font-semibold items-center justify-between shadow-sm mb-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>Hooray! You have {publicCoupons.length} promo code{publicCoupons.length > 1 ? "s" : ""} available!</span>
                      <button
                        onClick={() => setIsPromoModalOpen(true)}
                        className="underline font-bold hover:text-white/85 cursor-pointer ml-1"
                      >
                        View offers
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

                {/* Fixed Bottom Bar on Mobile & Standard Sidebar on Desktop */}
                <div className="fixed bottom-0 left-0 right-0 w-full bg-white p-4 pb-6 shadow-[0_-8px_16px_-6px_rgba(0,0,0,0.15)] z-[60] lg:relative lg:p-0 lg:pb-0 lg:shadow-none lg:z-auto lg:bg-transparent">
                  {/* Cost Breakdown */}
                  <div className="flex flex-col gap-3.5 pb-4 lg:py-4 border-b lg:border-t border-neutral-200">
                    {/* Item Total (Only show if promo is applied to avoid redundancy) */}
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-sm md:text-base text-neutral-600">
                        <span>Item Total</span>
                        <span className="font-semibold text-neutral-900">{formatPrice(subtotal)}</span>
                      </div>
                    )}

                    {/* Guest Prompt vs Authenticated Promo Selector */}
                    {!isAuthenticated ? (
                      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag className="w-4 h-4 text-amber-700 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-neutral-900 block leading-tight truncate">
                              Have a promo code?
                            </span>
                            <span className="text-[11px] text-neutral-600 block leading-tight truncate">
                              Sign in or register to unlock discounts
                            </span>
                          </div>
                        </div>
                        <Link
                          href="/login?redirect=/cart"
                          className="shrink-0 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[11px] rounded transition-colors whitespace-nowrap"
                        >
                          Sign In →
                        </Link>
                      </div>
                    ) : !appliedCoupon ? (
                      <div className="flex items-center justify-between text-sm md:text-base font-semibold">
                        <span className="text-neutral-600">Promo Code</span>
                        <button
                          onClick={() => setIsPromoModalOpen(true)}
                          className="text-banner hover:text-orange-600 font-bold underline cursor-pointer text-xs uppercase tracking-wider flex items-center gap-1"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>{publicCoupons.length > 0 ? `Apply (${publicCoupons.length} Offers)` : "Apply Code"}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-sm md:text-base font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-600">Voucher ({appliedCoupon.code})</span>
                          <button
                            onClick={() => setIsPromoModalOpen(true)}
                            className="text-neutral-400 hover:text-neutral-600 underline text-xs cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#DC2626] font-bold">-{formatPrice(discount)}</span>
                          <button
                            onClick={handleRemoveCoupon}
                            className="text-neutral-400 hover:text-red-500 text-xs p-0.5"
                            title="Remove coupon"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-base md:text-lg text-neutral-900 font-bold pt-1">
                      <span>Total</span>
                      <span className="text-xl md:text-2xl font-extrabold text-neutral-900">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: PROCEED TO CHECKOUT */}
                  <div className="flex flex-col gap-3 mt-4 lg:mt-6">
                    <button
                      onClick={handleProceedToCheckout}
                      disabled={isNavigating}
                      className="flex items-center justify-center gap-2 w-full bg-banner hover:bg-orange-600 disabled:bg-neutral-400 text-white text-center py-4 rounded-sm font-bold tracking-widest text-xs md:text-sm uppercase shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isNavigating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>REDIRECTING...</span>
                        </>
                      ) : (
                        "PROCEED TO CHECKOUT"
                      )}
                    </button>
                  </div>
                </div>

                {/* Additional reassuring perks */}
                <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-neutral-100 text-[11px] text-neutral-400 font-medium uppercase tracking-wider text-center">
                  <span>✓ 100% Secure Checkout</span>
                  <span>•</span>
                  <span>✓ Fast Dispatch</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. Real Promo Code Modal connected to MongoDB Coupons */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-sm shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h3 className="font-sans font-bold text-lg sm:text-xl text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                <Tag className="w-5 h-5 text-banner" />
                <span>SELECT OR ENTER PROMO CODE</span>
              </h3>
              <button
                onClick={() => setIsPromoModalOpen(false)}
                aria-label="Close modal"
                className="text-neutral-400 hover:text-neutral-800 transition-colors p-1"
              >
                <XMarkIcon className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Manual Code Input Bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter coupon code (e.g. TESTCOUPON)"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyCouponCode(manualCodeInput);
                  }
                }}
                className="flex-1 px-3 py-2.5 text-xs sm:text-sm border border-neutral-300 rounded-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-banner focus:border-banner"
              />
              <button
                type="button"
                onClick={() => handleApplyCouponCode(manualCodeInput)}
                disabled={validateCouponMutation.isPending || !manualCodeInput.trim()}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-sm transition-colors cursor-pointer shrink-0"
              >
                {validateCouponMutation.isPending ? "Validating..." : "Apply"}
              </button>
            </div>

            {/* Available Store Offers List */}
            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Available Offers ({publicCoupons.length})
              </div>

              <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {isCouponsLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center text-xs text-neutral-400 gap-2">
                    <div className="w-5 h-5 border-2 border-banner border-t-transparent rounded-full animate-spin" />
                    <span>Loading active offers...</span>
                  </div>
                ) : publicCoupons.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-sm p-4 border border-dashed border-neutral-200">
                    No store-wide promo vouchers active right now. If you received an exclusive promotional code, please type it above.
                  </div>
                ) : (
                  publicCoupons.map((coupon: Partial<ICoupon>) => {
                    const isSelected = appliedCoupon?.code === coupon.code;
                    const minSpend = coupon.minPurchase || 0;
                    const isMinSpendMet = minSpend === 0 || subtotal >= minSpend;
                    const expiryStr = coupon.expiryDate
                      ? new Date(coupon.expiryDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "";

                    return (
                      <div
                        key={coupon._id || coupon.code}
                        className={`border p-4 rounded-sm transition-all flex flex-col gap-2 relative ${
                          isSelected
                            ? "border-banner bg-orange-50/30 ring-1 ring-banner"
                            : isMinSpendMet
                            ? "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/50"
                            : "border-neutral-200 opacity-60 bg-neutral-50/70"
                        }`}
                      >
                        {/* Top Row: Code & Validity */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-sm sm:text-base text-neutral-900 tracking-wider">
                              {coupon.code}
                            </span>
                            <span className="bg-banner/10 text-banner border border-banner/20 text-[10px] font-bold px-1.5 py-0.5 rounded-xs">
                              {coupon.discountType === "percent"
                                ? `${coupon.discountValue}% OFF`
                                : `₹${coupon.discountValue} OFF`}
                            </span>
                            {isSelected && (
                              <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs flex items-center gap-0.5">
                                <CheckCircleIcon className="w-3 h-3 stroke-[2.5]" />
                                APPLIED
                              </span>
                            )}
                          </div>
                          {expiryStr && (
                            <span className="text-[11px] text-neutral-400 font-medium">
                              Valid till {expiryStr}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                          {coupon.description ||
                            (coupon.discountType === "percent"
                              ? `Get ${coupon.discountValue}% discount on eligible riding gear.`
                              : `Get flat ₹${coupon.discountValue} instant discount.`)}
                        </p>

                        {/* Conditions row & Apply button */}
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-100 mt-1">
                          <div className="flex flex-col text-[10px] text-neutral-500">
                            {minSpend > 0 ? (
                              isMinSpendMet ? (
                                <span className="text-emerald-700 font-medium">✓ Min order ₹{minSpend} met</span>
                              ) : (
                                <span className="text-red-500 font-medium">
                                  Add {formatPrice(minSpend - subtotal)} more to qualify
                                </span>
                              )
                            ) : (
                              <span>No minimum purchase required</span>
                            )}
                            {coupon.maxDiscountCap ? (
                              <span className="text-neutral-400">Max savings: ₹{coupon.maxDiscountCap}</span>
                            ) : null}
                          </div>

                          {isSelected ? (
                            <button
                              type="button"
                              onClick={handleRemoveCoupon}
                              className="text-xs font-bold text-red-600 hover:underline uppercase"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => coupon.code && handleApplyCouponCode(coupon.code)}
                              disabled={validateCouponMutation.isPending || !isMinSpendMet}
                              className="px-3 py-1 bg-banner hover:bg-orange-600 disabled:bg-neutral-300 text-white text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                              {validateCouponMutation.isPending ? "Validating..." : "Apply"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Close Footer */}
            <div className="pt-2 flex justify-between items-center border-t border-neutral-100">
              {appliedCoupon ? (
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs font-bold text-red-600 hover:underline uppercase"
                >
                  Remove Voucher
                </button>
              ) : (
                <div />
              )}
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
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
};
