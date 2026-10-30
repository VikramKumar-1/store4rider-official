"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";

/**
 * Static storefront routes that DO NOT have a sticky bottom bar on mobile.
 */
const ROUTES_WITHOUT_BOTTOM_BAR = [
  "/",
  "/about-us",
  "/contact",
  "/contact-us",
  "/account",
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/terms",
  "/privacy",
  "/shipping",
  "/returns",
  "/cash-on-delivery",
  "/collaboration",
  "/careers",
  "/guides",
  "/brands",
  "/sale",
  "/insurance",
  "/care",
  "/exchange",
  "/support",
  "/warranty",
  "/store-policies",
  "/legal",
];

/**
 * Floating WhatsApp Chat Widget
 * 
 * Rules & Features:
 * 1. Synchronized with MongoDB settings (editable from Admin -> Contact & SEO Settings).
 * 2. Default target number is +91 - 7263007788 (converted to clean 917263007788 for wa.me).
 * 3. Never displayed on Admin routes (`/admin/*`).
 * 4. Can be toggled on/off in Admin settings (`whatsappChatEnabled`).
 * 5. Pre-filled chat message is customizable in Admin settings (`whatsappDefaultMessage`).
 * 6. Mobile size is sleek and compact (46px on mobile, 56px on desktop).
 * 7. Positioned dynamically (bottom-[126px] on pages with sticky bottom bars,
 *    bottom-6 on standard pages, md:bottom-6 on desktop) to ensure ZERO overlap
 *    with mobile bottom action bars (PDP Add-to-cart, Catalog filter bar, Cart).
 */
export const FloatingWhatsApp: React.FC = () => {
  const pathname = usePathname();
  const { data: settings } = usePublicSettings();
  const cartItemCount = useCartStore((state) => state.items.length);

  // Do not render on Admin or API routes
  if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return null;
  }

  // Check if disabled by Admin
  if (settings && settings.whatsappChatEnabled === false) {
    return null;
  }

  // Resolve target number (DB or default +91 - 7263007788)
  const rawNumber = settings?.whatsappNumber?.trim() || "+91 - 7263007788";
  const digitsOnly = rawNumber.replace(/\D/g, "");

  // Convert to full international format (e.g. 7263007788 -> 917263007788)
  let cleanNumber = digitsOnly;
  if (digitsOnly.length === 10) {
    cleanNumber = `91${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    cleanNumber = `91${digitsOnly.slice(1)}`;
  }

  if (!cleanNumber) {
    return null;
  }

  const defaultMessage =
    settings?.whatsappDefaultMessage?.trim() ||
    "Hi Store4Riders, I have a query regarding products/order.";

  const whatsappHref = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(defaultMessage)}`;

  // Determine if current mobile view has a sticky bottom bar (PDP, Catalog, Category, Cart, Checkout)
  const isMarketingPage = ROUTES_WITHOUT_BOTTOM_BAR.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const hasStickyBottomBar = !isMarketingPage;

  // Check if Blinkit floating cart is active on this page
  const isProductPage =
    pathname === "/products" ||
    pathname?.startsWith("/products/") ||
    pathname?.startsWith("/search");
  const hasBlinkitCart = cartItemCount > 0 && isProductPage;

  const isPDP = useUIStore((state) => state.isPDP);

  // Calculate mobile bottom position to prevent overlapping with:
  // 1. "See all reviews" in PDP & Catalog sticky bars (~184px high)
  // 2. Blinkit floating cart widget when active (~196px high)
  const mobileBottomClass = hasStickyBottomBar
    ? hasBlinkitCart
      ? "bottom-[256px]"
      : "bottom-[196px]"
    : "bottom-6";

  // Calculate desktop/tablet bottom position:
  // On PDP, sticky footer bar with "SEE ALL REVIEWS >" is ~125px high, so WhatsApp floats above it at 144px.
  // On other pages, WhatsApp rests at standard bottom-6 (24px).
  const desktopBottomClass = isPDP ? "md:bottom-[144px]" : "md:bottom-6";

  return (
    <div
      aria-label="WhatsApp Chat Support"
      suppressHydrationWarning
      className={`fixed ${mobileBottomClass} ${desktopBottomClass} right-3.5 md:right-7 z-40 flex items-center print:hidden select-none`}
    >
      {/* Clean WhatsApp Floating Action Button (compact 46px on mobile, 56px on desktop) */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
        className="group relative flex items-center justify-center w-[46px] h-[46px] md:w-14 md:h-14 rounded-full bg-[#25D366] text-white shadow-[0_4px_14px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_22px_rgba(37,211,102,0.55)] hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-400/40"
      >
        {/* Authentic WhatsApp SVG Icon (scaled for mobile & desktop) */}
        <svg
          className="w-[26px] h-[26px] md:w-8 md:h-8 fill-current relative z-10"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>

        {/* Desktop Hover Tooltip */}
        <span className="hidden md:group-hover:block absolute right-full mr-3.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap pointer-events-none transition-all duration-200">
          Chat on WhatsApp
          <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-neutral-900" />
        </span>
      </a>
    </div>
  );
};
