"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowRight, Instagram, Facebook, Youtube, Twitter, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";
import { IFooterLink } from "@store4riders/shared-types";

const DEFAULT_COLUMN1_LINKS: IFooterLink[] = [
  { label: "Exchange & Replacements", url: "/returns", openInNewTab: false },
  { label: "Warranty", url: "/warranty", openInNewTab: false },
  { label: "Conditions of Sale & Use", url: "/terms", openInNewTab: false },
  { label: "Privacy and Cookie Policy", url: "/privacy", openInNewTab: false },
  { label: "Legal", url: "/legal", openInNewTab: false },
  { label: "Shipping Policies", url: "/shipping", openInNewTab: false },
  { label: "Store Policies", url: "/store-policies", openInNewTab: false },
];

const DEFAULT_COLUMN2_LINKS: IFooterLink[] = [
  { label: "About us", url: "/about-us", openInNewTab: false },
  { label: "Contact Us", url: "/contact-us", openInNewTab: false },
  { label: "Your Account", url: "/account", openInNewTab: false },
  { label: "Wish List", url: "/account/wishlist", openInNewTab: false },
  { label: "Rider Assist", url: "/rider-assist", openInNewTab: false },
  { label: "Cash on Delivery", url: "/cash-on-delivery", openInNewTab: false },
  { label: "Collaboration", url: "/collaboration", openInNewTab: false },
];

const DEFAULT_BOTTOM_LINKS: IFooterLink[] = [
  { label: "Privacy Policy", url: "/privacy", openInNewTab: false },
  { label: "Terms of Service", url: "/terms", openInNewTab: false },
  { label: "Exchange Policy", url: "/returns", openInNewTab: false },
];

/**
 * Footer Component
 * 
 * Fully dynamic footer powered by Admin Settings:
 * - Column 1: Store Logo, custom Tagline/About, Contact details & Social Media icons
 * - Column 2: Editable Column Title & dynamic links (Collapsible accordion on mobile)
 * - Column 3: Editable Column Title & dynamic links (Collapsible accordion on mobile)
 * - Column 4: Newsletter Subscription with editable title, subtitle, and placeholder
 * - Bottom Bar: Dynamic Copyright text (with {year} token) & editable policy links
 */
export const Footer: React.FC = () => {
  const { data: settings } = usePublicSettings();
  const [email, setEmail] = useState("");
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const footer = settings?.footerConfig;

  // Column 1 Contact & About Data
  const aboutText = footer?.aboutText?.trim() || "";
  const showContact = footer?.showContact !== false;
  const showSocialLinks = footer?.showSocialLinks !== false;

  const phone = footer?.contactPhone?.trim() || settings?.whatsappNumber || settings?.supportPhone || "";
  const emailAddress = footer?.contactEmail?.trim() || settings?.supportEmail || "contact@store4riders.com";
  const address = footer?.contactAddress?.trim() || (settings?.storeOriginAddress
    ? `${settings.storeOriginAddress}, ${settings.storeOriginCity || "Pune"}, ${settings.storeOriginState || "Maharashtra"} - ${settings.storeOriginPincode || "411001"}`
    : "Store4Riders, Pune, Maharashtra - 411001");

  const instagramUrl = settings?.instagramUrl || "https://www.instagram.com/store4riders/";
  const facebookUrl = settings?.facebookUrl || "https://www.facebook.com/store4riders/";
  const youtubeUrl = settings?.youtubeUrl || "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg";
  const twitterUrl = settings?.twitterUrl || "https://twitter.com/store4riders";

  // Column 2 Navigation Links
  const column1Title = footer?.column1Title?.trim() || "EXCHANGE & REPLACEMENTS";
  const column1Links = footer?.column1Links && footer.column1Links.length > 0 
    ? footer.column1Links 
    : DEFAULT_COLUMN1_LINKS;

  // Column 3 Navigation Links
  const column2Title = footer?.column2Title?.trim() || "SUPPORT AND SERVICES";
  const column2Links = footer?.column2Links && footer.column2Links.length > 0 
    ? footer.column2Links 
    : DEFAULT_COLUMN2_LINKS;

  // Column 4 Newsletter
  const newsletterTitle = footer?.newsletterTitle?.trim() || "SUBSCRIBE US";
  const newsletterSubtitle = footer?.newsletterSubtitle?.trim() || "Get updates on new riding gear arrivals, exclusive discount coupons, and offers.";
  const newsletterPlaceholder = footer?.newsletterPlaceholder?.trim() || "Enter your email address";

  // Sub-Footer Copyright & Bottom Links
  const currentYear = new Date().getFullYear().toString();
  const rawCopyright = footer?.copyrightText?.trim() || "© {year} MotoHive Media Pvt. Ltd. (Store4Riders). All rights reserved.";
  const copyrightText = rawCopyright.replace(/\{year\}/g, currentYear);

  const bottomLinks = footer?.bottomLinks && footer.bottomLinks.length > 0 
    ? footer.bottomLinks 
    : DEFAULT_BOTTOM_LINKS;

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
          
          {/* Column 1: Brand Logo, About, Contact info & Social Media */}
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

            {aboutText && (
              <p className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed font-sans -mt-2">
                {aboutText}
              </p>
            )}
            
            {showContact && (
              <div className="flex flex-col gap-2 sm:gap-2.5 text-xs sm:text-sm font-sans text-neutral-300">
                {phone && (
                  <div className="grid grid-cols-[65px_1fr] sm:grid-cols-[75px_1fr] gap-2">
                    <span className="font-medium text-white">Contact</span>
                    <span>: {phone}</span>
                  </div>
                )}
                {emailAddress && (
                  <div className="grid grid-cols-[65px_1fr] sm:grid-cols-[75px_1fr] gap-2">
                    <span className="font-medium text-white">Email</span>
                    <span className="break-all">: {emailAddress}</span>
                  </div>
                )}
                {address && (
                  <div className="grid grid-cols-[65px_1fr] sm:grid-cols-[75px_1fr] gap-2">
                    <span className="font-medium text-white">Address</span>
                    <span className="leading-relaxed">
                      : {address}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Social Media Icons */}
            {showSocialLinks && (
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
            )}
          </div>

          {/* Column 2: Navigation Links (Collapsible accordion on mobile) */}
          <div className="flex flex-col border-b border-neutral-900 pb-4 lg:border-none lg:pb-0">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => toggleSection("column1")}
              className="w-full flex items-center justify-between py-2 lg:py-0 text-left cursor-pointer group"
            >
              <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-white uppercase lg:mb-6">
                {column1Title}
              </h3>
              <ChevronDown 
                className={`w-4 h-4 text-neutral-400 group-hover:text-white transition-transform duration-300 lg:hidden ${
                  openSection === "column1" ? "rotate-180 text-white" : ""
                }`} 
              />
            </button>
            <ul className={`flex flex-col gap-2.5 sm:gap-3 text-xs sm:text-sm text-neutral-400 pt-3 lg:pt-0 ${
              openSection === "column1" ? "flex" : "hidden lg:flex"
            }`}>
              {column1Links.map((link, idx) => (
                <li key={`col1-link-${idx}`}>
                  <Link 
                    href={link.url}
                    target={link.openInNewTab ? "_blank" : undefined}
                    rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Navigation Links (Collapsible accordion on mobile) */}
          <div className="flex flex-col border-b border-neutral-900 pb-4 lg:border-none lg:pb-0">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => toggleSection("column2")}
              className="w-full flex items-center justify-between py-2 lg:py-0 text-left cursor-pointer group"
            >
              <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-white uppercase lg:mb-6">
                {column2Title}
              </h3>
              <ChevronDown 
                className={`w-4 h-4 text-neutral-400 group-hover:text-white transition-transform duration-300 lg:hidden ${
                  openSection === "column2" ? "rotate-180 text-white" : ""
                }`} 
              />
            </button>
            <ul className={`flex flex-col gap-2.5 sm:gap-3 text-xs sm:text-sm text-neutral-400 pt-3 lg:pt-0 ${
              openSection === "column2" ? "flex" : "hidden lg:flex"
            }`}>
              {column2Links.map((link, idx) => (
                <li key={`col2-link-${idx}`}>
                  <Link 
                    href={link.url}
                    target={link.openInNewTab ? "_blank" : undefined}
                    rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Subscribe Us */}
          <div className="flex flex-col sm:col-span-2 lg:col-span-1 pt-2 lg:pt-0">
            <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-white uppercase mb-4 sm:mb-6">
              {newsletterTitle}
            </h3>
            {newsletterSubtitle && (
              <p className="text-xs text-neutral-400 mb-3">
                {newsletterSubtitle}
              </p>
            )}
            <form onSubmit={handleSubscribe} className="relative flex items-center w-full max-w-md bg-[#4E5866] rounded-xs px-3.5 py-2.5 shadow-xs">
              <Mail className="w-5 h-5 text-neutral-200 shrink-0 mr-3" />
              <input
                type="email"
                suppressHydrationWarning
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={newsletterPlaceholder}
                className="w-full bg-transparent text-white placeholder-neutral-300 text-xs sm:text-sm outline-none pr-8 font-sans"
                required
              />
              <button
                type="submit"
                suppressHydrationWarning
                aria-label="Subscribe to newsletter"
                className="absolute right-3 text-neutral-200 hover:text-white transition-colors flex items-center justify-center p-1 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Sub-Footer Bar — text-neutral-400 provides accessible 8.4:1 contrast on black */}
        <div className="mt-10 md:mt-16 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>{copyrightText}</p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {bottomLinks.map((link, idx) => (
              <Link 
                key={`bottom-link-${idx}`}
                href={link.url}
                target={link.openInNewTab ? "_blank" : undefined}
                rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                className="hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
