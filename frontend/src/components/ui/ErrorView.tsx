"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  RotateCcw,
  Search,
  ArrowRight,
  ShieldAlert,
  Lock,
  Wrench,
  AlertTriangle,
  Compass,
  PhoneCall,
} from "lucide-react";
import { TopBanner } from "@/modules/homepage/components/TopBanner";
import { Navbar } from "@/modules/homepage/components/Navbar";
import { Footer } from "@/modules/homepage/components/Footer";

export type ErrorCode = 404 | 500 | 401 | 403 | 400;

export interface ErrorViewProps {
  code?: ErrorCode;
  title?: string;
  description?: string;
  details?: string;
  onRetry?: () => void;
  fullPage?: boolean;
  showSearch?: boolean;
  showCategories?: boolean;
}

interface ErrorMeta {
  badge: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  primaryLabel: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

const ERROR_CONFIG: Record<ErrorCode, ErrorMeta> = {
  404: {
    badge: "404 • Broken Link",
    title: "Broken Link — Route Snapped",
    description:
      "Looks like the trail ended or the drive chain snapped on this link. The page you are looking for may have been moved, renamed, or is no longer in stock.",
    imageSrc: "/errorpageui/4-broken-link.jpg",
    imageAlt: "Motorcycle chain with broken link illustration - Page Not Found",
    primaryLabel: "Back to Home",
    primaryHref: "/",
    secondaryLabel: "Explore Helmets & Gear",
    secondaryHref: "/products",
  },
  500: {
    badge: "500 • Internal Server Error",
    title: "Engine Trouble — Server Stalled",
    description:
      "Something seized up under the hood on our end. Our pit crew has been alerted and is already working on getting the engine running smoothly again.",
    imageSrc: "/errorpageui/3-internal-server-error.jpg",
    imageAlt: "Disassembled motorcycle engine cylinder head - Internal Server Error",
    primaryLabel: "Try Again / Kickstart Engine",
    secondaryLabel: "Back to Home",
    secondaryHref: "/",
  },
  401: {
    badge: "401 • Authorisation Required",
    title: "Locked Garage — Sign In Required",
    description:
      "This section is parked and chained. Please sign in with your Store4Riders rider account to access your garage, orders, and saved gear.",
    imageSrc: "/errorpageui/1-auth-required.jpg",
    imageAlt: "Chained vintage motorcycle with padlock - Authorisation Required",
    primaryLabel: "Sign In to Account",
    primaryHref: "/login",
    secondaryLabel: "Create Rider Account",
    secondaryHref: "/register",
  },
  403: {
    badge: "403 • Restricted Trail",
    title: "Access Forbidden — Checkpoint Blocked",
    description:
      "No entry past this checkpoint. You don't have the necessary clearance or permissions to navigate this protected route.",
    imageSrc: "/errorpageui/5-forbidden.jpg",
    imageAlt: "No motorcycles allowed sign - Forbidden 403",
    primaryLabel: "Return to Safe Ground",
    primaryHref: "/",
    secondaryLabel: "Contact Support",
    secondaryHref: "/contact-us",
  },
  400: {
    badge: "400 • Bad Request",
    title: "Off Track — Bad Request",
    description:
      "The server could not understand this manoeuvre due to invalid or malformed parameters. Check the URL or head back to the main track.",
    imageSrc: "/errorpageui/2-bad-request.jpg",
    imageAlt: "Deadpool on a red scooter - Bad Request 400",
    primaryLabel: "Back to Home",
    primaryHref: "/",
    secondaryLabel: "Browse All Gear",
    secondaryHref: "/products",
  },
};

const POPULAR_CATEGORIES = [
  { name: "Helmets", href: "/helmets" },
  { name: "Riding Jackets", href: "/riding-jackets" },
  { name: "Riding Gloves", href: "/riding-gloves" },
  { name: "Riding Boots", href: "/riding-boots" },
  { name: "Rider Guides", href: "/guides" },
];

export const ErrorView: React.FC<ErrorViewProps> = ({
  code = 404,
  title,
  description,
  details,
  onRetry,
  fullPage = true,
  showSearch = code === 404,
  showCategories = code === 404,
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const meta = ERROR_CONFIG[code] || ERROR_CONFIG[404];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const content = (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
      {/* Featured Motorcycle Error Image */}
      <div className="relative aspect-[16/9] w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-xl border border-slate-200/90 bg-slate-100 mb-8 sm:mb-10 group">
        <Image
          src={meta.imageSrc}
          alt={meta.imageAlt}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 576px"
          className="object-cover group-hover:scale-102 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        
        {/* Error Code Pill */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/95 backdrop-blur-md text-slate-900 shadow-sm border border-slate-100">
            {code === 401 ? <Lock size={12} className="text-brand" /> : null}
            {code === 403 ? <ShieldAlert size={12} className="text-brand" /> : null}
            {code === 500 ? <Wrench size={12} className="text-brand" /> : null}
            {code === 404 ? <Compass size={12} className="text-brand" /> : null}
            {code === 400 ? <AlertTriangle size={12} className="text-brand" /> : null}
            <span>{meta.badge}</span>
          </span>
        </div>
      </div>

      {/* Headline & Description */}
      <div className="max-w-xl mx-auto space-y-3 mb-8">
        <h1 className="text-2xl sm:text-4xl font-sans font-black text-slate-900 tracking-tight leading-tight">
          {title || meta.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {description || meta.description}
        </p>

        {/* Optional Technical Details (only shown if provided) */}
        {details && (
          <p className="text-xs font-mono text-slate-400 bg-slate-100 p-2.5 rounded-lg border border-slate-200/80 max-w-md mx-auto truncate">
            {details}
          </p>
        )}
      </div>

      {/* Primary & Secondary Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand/90 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw size={16} />
            <span>{meta.primaryLabel}</span>
          </button>
        ) : meta.primaryHref ? (
          <Link
            href={meta.primaryHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand/90 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Home size={16} />
            <span>{meta.primaryLabel}</span>
          </Link>
        ) : null}

        {meta.secondaryHref && (
          <Link
            href={meta.secondaryHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm uppercase tracking-wider border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer active:scale-95"
          >
            <span>{meta.secondaryLabel}</span>
            <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {/* Quick Search Bar (For 404 recovery) */}
      {showSearch && (
        <div className="max-w-md mx-auto mb-10 pt-8 border-t border-slate-200/80">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Looking for specific gear? Search our catalog:
          </p>
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search helmets, jackets, gloves, boots..."
              className="w-full text-xs sm:text-sm pl-10 pr-24 py-3 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-brand focus:ring-1 focus:ring-brand shadow-xs"
            />
            <Search size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Popular Categories Row */}
      {showCategories && (
        <div className="max-w-lg mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
            Or take a detour to popular riding categories:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {POPULAR_CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-brand/10 text-slate-700 hover:text-brand border border-slate-200 shadow-2xs transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!fullPage) {
    return content;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <TopBanner />
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-24 sm:pt-28 pb-12">
        {content}
      </main>
      <Footer />
    </div>
  );
};

export default ErrorView;
