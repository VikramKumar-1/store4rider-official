"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";

/**
 * Footer Component
 * 
 * Clean, focused footer matching Store4Riders specifications:
 * - EXCHANGE & REPLACEMENTS
 * - SUPPORT AND SERVICES
 * - SUBSCRIBE US
 * No category/gear menu in the footer.
 */
export const Footer: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success("Thank you for subscribing to Store4Riders updates!");
    setEmail("");
  };

  return (
    <footer className="w-full bg-black text-white pt-12 md:pt-16 pb-12 border-t border-neutral-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16">
          
          {/* Column 1: Exchange & Replacements */}
          <div className="flex flex-col">
            <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-white uppercase mb-4 sm:mb-6">
              EXCHANGE &amp; REPLACEMENTS
            </h3>
            <ul className="flex flex-col gap-2.5 sm:gap-3 text-xs sm:text-sm text-neutral-400">
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">
                  Exchange &amp; Replacements
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="hover:text-white transition-colors">
                  Warranty
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Conditions of Sale &amp; Use
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy and Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-white transition-colors">
                  Legal
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white transition-colors">
                  Shipping Policies
                </Link>
              </li>
              <li>
                <Link href="/store-policies" className="hover:text-white transition-colors">
                  Store Policies
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Support and Services */}
          <div className="flex flex-col">
            <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-white uppercase mb-4 sm:mb-6">
              SUPPORT AND SERVICES
            </h3>
            <ul className="flex flex-col gap-2.5 sm:gap-3 text-xs sm:text-sm text-neutral-400">
              <li>
                <Link href="/about-us" className="hover:text-white transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  Your Account
                </Link>
              </li>
              <li>
                <Link href="/account/wishlist" className="hover:text-white transition-colors">
                  Wish List
                </Link>
              </li>
              <li>
                <Link href="/rider-assist" className="hover:text-white transition-colors">
                  Rider Assist
                </Link>
              </li>
              <li>
                <Link href="/cash-on-delivery" className="hover:text-white transition-colors">
                  Cash on Delivery
                </Link>
              </li>
              <li>
                <Link href="/collaboration" className="hover:text-white transition-colors">
                  Collaboration
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Subscribe Us */}
          <div className="flex flex-col sm:col-span-2 lg:col-span-1">
            <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-white uppercase mb-4 sm:mb-6">
              SUBSCRIBE US
            </h3>
            <form onSubmit={handleSubscribe} className="relative flex items-center w-full max-w-md bg-[#4E5866] rounded-xs px-3.5 py-2.5 shadow-xs">
              <Mail className="w-5 h-5 text-neutral-200 shrink-0 mr-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full bg-transparent text-white placeholder-neutral-300 text-xs sm:text-sm outline-none pr-8 font-sans"
                required
              />
              <button
                type="submit"
                aria-label="Subscribe to newsletter"
                className="absolute right-3 text-neutral-200 hover:text-white transition-colors flex items-center justify-center p-1 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Sub-Footer Bar */}
        <div className="mt-12 md:mt-16 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>&copy; {new Date().getFullYear()} MotoHive Media Pvt. Ltd. (Store4Riders). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-neutral-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-neutral-300 transition-colors">Terms of Service</Link>
            <Link href="/returns" className="hover:text-neutral-300 transition-colors">Exchange Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
