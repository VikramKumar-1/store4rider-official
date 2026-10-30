"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowRight, Instagram, Facebook, Youtube, Twitter, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";

/**
 * Footer Component
 * 
 * Clean, structured footer with:
 * - Column 1: Store Logo, Contact details (Phone, Email, Warehouse Address) & Social Media links
 * - Column 2: EXCHANGE & REPLACEMENTS (Collapsible dropdown accordion on mobile)
 * - Column 3: SUPPORT AND SERVICES (Collapsible dropdown accordion on mobile)
 * - Column 4: SUBSCRIBE US (Newsletter subscription)
 * Note: Gear Menu has been removed as requested.
 */
export const Footer: React.FC = () => {
  const { data: settings } = usePublicSettings();
  const [email, setEmail] = useState("");
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const phone = settings?.whatsappNumber || settings?.supportPhone || "";
  const emailAddress = settings?.supportEmail || "contact@store4riders.com";
  const address = settings?.storeOriginAddress
    ? `${settings.storeOriginAddress}, ${settings.storeOriginCity || "Pune"}, ${settings.storeOriginState || "Maharashtra"} - ${settings.storeOriginPincode || "411001"}`
    : "Store4Riders, Pune, Maharashtra - 411001";

  const instagramUrl = settings?.instagramUrl || "https://www.instagram.com/store4riders/";
  const facebookUrl = settings?.facebookUrl || "https://www.facebook.com/store4riders/";
  const youtubeUrl = settings?.youtubeUrl || "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg";
  const twitterUrl = settings?.twitterUrl || "https://twitter.com/store4riders";

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
    <footer className="w-full bg-black text-white pt-10 md:pt-16 pb-12 border-t border-neutral-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8">
          
          {/* Column 1: Brand Logo, Contact info & Social Media */}
          <div className="flex flex-col gap-4 sm:gap-6 sm:col-span-2 lg:col-span-1 pb-4 border-b border-neutral-900 lg:border-none lg:pb-0">
            <div className="relative h-10 w-40 md:h-12 md:w-48 -ml-1 sm:-ml-2 mb-1 overflow-hidden rounded-sm">
              <Image 
                src="/Store4riders-Logo.jpg" 
                alt="Store4Riders Logo" 
                fill 
                sizes="(max-width: 768px) 160px, 192px"
                className="object-contain object-left" 
              />
            </div>
            
            <div className="flex flex-col gap-2 sm:gap-2.5 text-xs sm:text-sm font-sans text-neutral-300">
              {phone && (
                <div className="grid grid-cols-[65px_1fr] sm:grid-cols-[75px_1fr] gap-2">
                  <span className="font-medium text-white">Contact</span>
                  <span>: {phone}</span>
                </div>
              )}
              <div className="grid grid-cols-[65px_1fr] sm:grid-cols-[75px_1fr] gap-2">
                <span className="font-medium text-white">Email</span>
                <span className="break-all">: {emailAddress}</span>
              </div>
              <div className="grid grid-cols-[65px_1fr] sm:grid-cols-[75px_1fr] gap-2">
                <span className="font-medium text-white">Address</span>
                <span className="leading-relaxed">
                  : {address}
                </span>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-neutral-400">
                Connect With Us
              </span>
              <div className="flex items-center gap-2.5 sm:gap-3">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow Store4Riders on Instagram"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-banner hover:border-banner text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow Store4Riders on Facebook"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-banner hover:border-banner text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {youtubeUrl && (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Subscribe to Store4Riders on YouTube"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-banner hover:border-banner text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow Store4Riders on X / Twitter"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-banner hover:border-banner text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Exchange & Replacements (Dropdown accordion on mobile) */}
          <div className="flex flex-col border-b border-neutral-900 pb-4 lg:border-none lg:pb-0">
            <button
              type="button"
              onClick={() => toggleSection("exchange")}
              className="w-full flex items-center justify-between py-2 lg:py-0 text-left cursor-pointer group"
            >
              <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-white uppercase lg:mb-6">
                EXCHANGE &amp; REPLACEMENTS
              </h3>
              <ChevronDown 
                className={`w-4 h-4 text-neutral-400 group-hover:text-white transition-transform duration-300 lg:hidden ${
                  openSection === "exchange" ? "rotate-180 text-white" : ""
                }`} 
              />
            </button>
            <ul className={`flex flex-col gap-2.5 sm:gap-3 text-xs sm:text-sm text-neutral-400 pt-3 lg:pt-0 ${
              openSection === "exchange" ? "flex" : "hidden lg:flex"
            }`}>
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

          {/* Column 3: Support and Services (Dropdown accordion on mobile) */}
          <div className="flex flex-col border-b border-neutral-900 pb-4 lg:border-none lg:pb-0">
            <button
              type="button"
              onClick={() => toggleSection("support")}
              className="w-full flex items-center justify-between py-2 lg:py-0 text-left cursor-pointer group"
            >
              <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-white uppercase lg:mb-6">
                SUPPORT AND SERVICES
              </h3>
              <ChevronDown 
                className={`w-4 h-4 text-neutral-400 group-hover:text-white transition-transform duration-300 lg:hidden ${
                  openSection === "support" ? "rotate-180 text-white" : ""
                }`} 
              />
            </button>
            <ul className={`flex flex-col gap-2.5 sm:gap-3 text-xs sm:text-sm text-neutral-400 pt-3 lg:pt-0 ${
              openSection === "support" ? "flex" : "hidden lg:flex"
            }`}>
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

          {/* Column 4: Subscribe Us */}
          <div className="flex flex-col sm:col-span-2 lg:col-span-1 pt-2 lg:pt-0">
            <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-white uppercase mb-4 sm:mb-6">
              SUBSCRIBE US
            </h3>
            <p className="text-xs text-neutral-400 mb-3 block lg:hidden">
              Get updates on new riding gear arrivals, exclusive discount coupons, and offers.
            </p>
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
        <div className="mt-10 md:mt-16 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
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
