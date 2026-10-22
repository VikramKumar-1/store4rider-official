"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";

/**
 * Footer Component
 * 
 * Renders the bottom footer section with real contact data from Admin Settings.
 * Uses the brand's solid banner background color.
 */
export const Footer: React.FC = () => {
  const { data: settings } = usePublicSettings();

  const phone = settings?.whatsappNumber || settings?.supportPhone || "";
  const email = settings?.supportEmail || "contact@store4riders.com";
  const address = settings?.storeOriginAddress
    ? `${settings.storeOriginAddress}, ${settings.storeOriginCity || "Pune"}, ${settings.storeOriginState || "Maharashtra"} - ${settings.storeOriginPincode || "411001"}`
    : "Store4Riders, Pune, Maharashtra - 411001";

  return (
    <footer className="w-full bg-banner text-white py-12 md:py-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-3 lg:grid-cols-4 gap-x-2 sm:gap-x-6 gap-y-10 lg:gap-8">
        
        {/* Column 1: Brand Logo & Contact (Full width on mobile) */}
        <div className="col-span-3 lg:col-span-1 flex flex-col gap-5 sm:gap-6">
          <div className="relative h-10 w-40 md:h-12 md:w-48 -ml-1 sm:-ml-2 mb-1 sm:mb-2 overflow-hidden rounded-sm">
            <Image 
              src="/Store4riders-Logo.jpg" 
              alt="Store4Riders Logo" 
              fill 
              sizes="(max-width: 768px) 160px, 192px"
              className="object-contain object-left" 
            />
          </div>
          <div className="flex flex-col gap-2 sm:gap-3 text-[11px] sm:text-sm md:text-[15px] font-sans text-white/90">
            {phone && (
              <div className="grid grid-cols-[70px_1fr] sm:grid-cols-[80px_1fr] gap-2">
                <span className="font-medium">Contact</span>
                <span>: {phone}</span>
              </div>
            )}
            <div className="grid grid-cols-[70px_1fr] sm:grid-cols-[80px_1fr] gap-2">
              <span className="font-medium">Email</span>
              <span className="break-all">: {email}</span>
            </div>
            <div className="grid grid-cols-[70px_1fr] sm:grid-cols-[80px_1fr] gap-2">
              <span className="font-medium">Address</span>
              <span className="leading-relaxed">
                : {address}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Categories Menu */}
        <div className="col-span-1 flex flex-col gap-3 sm:gap-5 lg:ml-8">
          <h3 className="text-[10px] min-[400px]:text-[11px] sm:text-lg font-semibold tracking-wide">Gear Menu</h3>
          <ul className="flex flex-col gap-2 sm:gap-4 text-[9px] min-[400px]:text-[10px] sm:text-sm md:text-[15px] text-white/80">
            <li><Link href="/motorcycle-helmets" className="hover:text-white transition-colors whitespace-nowrap">Helmets</Link></li>
            <li><Link href="/riding-gear/riding-jackets" className="hover:text-white transition-colors whitespace-nowrap">Riding Jackets</Link></li>
            <li><Link href="/riding-gear/riding-pants" className="hover:text-white transition-colors whitespace-nowrap">Riding Pants</Link></li>
            <li><Link href="/riding-gear/riding-gloves" className="hover:text-white transition-colors whitespace-nowrap">Riding Gloves</Link></li>
            <li><Link href="/riding-gear/motorcycle-riding-boots" className="hover:text-white transition-colors whitespace-nowrap">Riding Boots</Link></li>
            <li><Link href="/motorcycle-bags-bike-luggage" className="hover:text-white transition-colors whitespace-nowrap">Motorcycle Luggage</Link></li>
          </ul>
        </div>

        {/* Column 3: Get Help */}
        <div className="col-span-1 flex flex-col gap-3 sm:gap-5">
          <h3 className="text-[10px] min-[400px]:text-[11px] sm:text-lg font-semibold tracking-wide">Get Help</h3>
          <ul className="flex flex-col gap-2 sm:gap-4 text-[9px] min-[400px]:text-[10px] sm:text-sm md:text-[15px] text-white/80">
            <li><Link href="/faq" className="hover:text-white transition-colors whitespace-nowrap">FAQ</Link></li>
            <li><Link href="/support" className="hover:text-white transition-colors whitespace-nowrap">Customer Service</Link></li>
            <li><Link href="/returns" className="hover:text-white transition-colors whitespace-nowrap">Exchange Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors whitespace-nowrap">Terms & Conditions</Link></li>
            <li><Link href="/shipping" className="hover:text-white transition-colors whitespace-nowrap">Shipping</Link></li>
          </ul>
        </div>

        {/* Column 4: Account */}
        <div className="col-span-1 flex flex-col gap-3 sm:gap-5">
          <h3 className="text-[10px] min-[400px]:text-[11px] sm:text-lg font-semibold tracking-wide">Account</h3>
          <ul className="flex flex-col gap-2 sm:gap-4 text-[9px] min-[400px]:text-[10px] sm:text-sm md:text-[15px] text-white/80">
            <li><Link href="/account" className="hover:text-white transition-colors whitespace-nowrap">My Account</Link></li>
            <li><Link href="/orders" className="hover:text-white transition-colors whitespace-nowrap">My Orders</Link></li>
            <li><Link href="/vouchers" className="hover:text-white transition-colors whitespace-nowrap">Vouchers & Discounts</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
