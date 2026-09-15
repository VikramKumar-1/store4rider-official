"use client";

import React from "react";
import Link from "next/link";

/**
 * Footer Component
 * 
 * Renders the bottom footer section matching the Figma design structure.
 * Uses the brand's solid banner background color.
 * Replaces "MODEVA" with the requested "Store4Riders" brand name.
 */
export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-banner text-white py-16 md:py-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
        
        {/* Column 1: Brand & Contact */}
        <div className="flex flex-col gap-6">
          <h2 className="font-serif text-4xl tracking-tight font-bold">Store4Riders</h2>
          <div className="flex flex-col gap-3 text-sm md:text-[15px] font-sans text-white/90">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="font-medium">WhatsApp</span>
              <span>: +62 859 9999 999</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="font-medium">Email</span>
              <span>: hello@store4riders.com</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="font-medium">Address</span>
              <span className="leading-relaxed">
                : Lorem ipsum street Block B Number 08, <br />
                Andheri West, Mumbai, Maharashtra, 400053
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Menu */}
        <div className="flex flex-col gap-5 lg:ml-8">
          <h3 className="text-lg font-semibold tracking-wide">Menu</h3>
          <ul className="flex flex-col gap-4 text-sm md:text-[15px] text-white/80">
            <li><Link href="/sale" className="hover:text-white transition-colors">Sale</Link></li>
            <li><Link href="/new-arrivals" className="hover:text-white transition-colors">New Arrivals</Link></li>
            <li><Link href="/category/touring" className="hover:text-white transition-colors">Touring Gear</Link></li>
            <li><Link href="/category/jackets" className="hover:text-white transition-colors">Riding Jackets</Link></li>
            <li><Link href="/category/helmets" className="hover:text-white transition-colors">Helmets</Link></li>
          </ul>
        </div>

        {/* Column 3: Get Help */}
        <div className="flex flex-col gap-5">
          <h3 className="text-lg font-semibold tracking-wide">Get Help</h3>
          <ul className="flex flex-col gap-4 text-sm md:text-[15px] text-white/80">
            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            <li><Link href="/support" className="hover:text-white transition-colors">Customer Service</Link></li>
            <li><Link href="/returns" className="hover:text-white transition-colors">Refund and Return</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms and Conditions</Link></li>
            <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping</Link></li>
          </ul>
        </div>

        {/* Column 4: Account */}
        <div className="flex flex-col gap-5">
          <h3 className="text-lg font-semibold tracking-wide">Account</h3>
          <ul className="flex flex-col gap-4 text-sm md:text-[15px] text-white/80">
            <li><Link href="/account" className="hover:text-white transition-colors">My Account</Link></li>
            <li><Link href="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
            <li><Link href="/vouchers" className="hover:text-white transition-colors">Vouchers and Discounts</Link></li>
          </ul>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
