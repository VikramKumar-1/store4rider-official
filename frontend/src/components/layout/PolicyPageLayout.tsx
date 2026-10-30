"use client";

import React, { useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  ShieldCheck,
  FileText,
  Lock,
  Scale,
  Truck,
  BookOpen,
  Info,
  PhoneCall,
  Mail,
  MessageSquare,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  Compass,
  Wrench,
  ChevronDown
} from "lucide-react";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";
import { buildBreadcrumbSchema } from "@/core/utils/seo-schema";
import { TopBanner } from "@/modules/homepage/components/TopBanner";
import { Navbar } from "@/modules/homepage/components/Navbar";
import { Footer } from "@/modules/homepage/components/Footer";

export interface PolicyNavGroup {
  groupTitle: string;
  items: {
    label: string;
    href: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
  }[];
}

export const POLICY_NAV_GROUPS: PolicyNavGroup[] = [
  {
    groupTitle: "Orders & Exchanges",
    items: [
      {
        label: "Exchange & Replacements",
        href: "/returns",
        badge: "7-Day",
        icon: ArrowLeftRight,
      },
      {
        label: "Shipping & Delivery",
        href: "/shipping",
        icon: Truck,
      },
      {
        label: "Cash on Delivery (COD)",
        href: "/cash-on-delivery",
        icon: Clock,
      },
      {
        label: "Warranty & Claims",
        href: "/warranty",
        icon: ShieldCheck,
      },
    ],
  },
  {
    groupTitle: "Legal & Store Policies",
    items: [
      {
        label: "Conditions of Sale & Use",
        href: "/terms",
        icon: FileText,
      },
      {
        label: "Privacy & Cookie Policy",
        href: "/privacy",
        icon: Lock,
      },
      {
        label: "Legal Information",
        href: "/legal",
        icon: Scale,
      },
      {
        label: "Store Policies",
        href: "/store-policies",
        icon: BookOpen,
      },
    ],
  },
  {
    groupTitle: "About & Rider Hub",
    items: [
      {
        label: "About Store4Riders",
        href: "/about-us",
        icon: Info,
      },
      {
        label: "Rider Assist & Sizing",
        href: "/rider-assist",
        badge: "Expert",
        icon: Compass,
      },
      {
        label: "Gear Care Guide",
        href: "/care",
        icon: Wrench,
      },
      {
        label: "Collaboration & Partners",
        href: "/collaboration",
        icon: HeartHandshake,
      },
      {
        label: "Contact & Support",
        href: "/contact-us",
        icon: PhoneCall,
      },
    ],
  },
];

export interface PolicyPageLayoutProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  lastUpdated?: string;
  currentSlug: string;
  summaryAlert?: {
    type?: "info" | "warning" | "success" | "brand";
    title?: string;
    text: React.ReactNode;
  };
  children: React.ReactNode;
}

export function PolicyPageLayout({
  title,
  subtitle,
  badge = "Official Store Policy",
  badgeIcon,
  lastUpdated = "October 2026",
  currentSlug,
  summaryAlert,
  children,
}: PolicyPageLayoutProps) {
  const pathname = usePathname();
  const activePath = currentSlug || pathname;
  const { data: settings } = usePublicSettings();
  const breadcrumbId = useId();

  // Check if admin has customized this page in database settings
  const cleanSlug = (currentSlug || pathname || "").replace(/^\/+/, "");
  const customPage = settings?.policyPages?.find(
    (p) => p.slug === cleanSlug && p.isActive !== false
  );

  const displayTitle = customPage?.title || title;
  const displaySubtitle =
    customPage?.subtitle !== undefined && customPage?.subtitle !== ""
      ? customPage.subtitle
      : subtitle;
  const displayBadge = customPage?.badge || badge;
  const displayLastUpdated = customPage?.lastUpdated || lastUpdated;

  const displaySummaryAlert = customPage?.summaryAlertText
    ? {
        type: (customPage.summaryAlertType || "info") as "info" | "warning" | "success" | "brand",
        title: customPage.summaryAlertTitle,
        text: customPage.summaryAlertText,
      }
    : summaryAlert;

  const hasCustomContent = Boolean(
    customPage?.contentHtml && customPage.contentHtml.trim().length > 0
  );

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://store4riders.com";

  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Support & Policies", url: "/store-policies" },
      { name: displayTitle, url: activePath },
    ],
    siteUrl
  );

  const supportPhone = settings?.supportPhone || "+91 - 7263007788";
  const supportEmail = settings?.supportEmail || "contact@store4riders.com";
  const rawWhatsapp = settings?.whatsappNumber || settings?.supportPhone || "7263007788";
  const digits = rawWhatsapp.replace(/\D/g, "");
  const whatsappNumber = digits.length === 10 ? `91${digits}` : digits;

  return (
    <>
      <script
        key={breadcrumbId}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="w-full min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-brand selection:text-white">
        {/* Top Announcement Bar */}
        <header className="w-full">
          <TopBanner />
          <div className="w-full bg-white relative z-40 border-b border-zinc-200 shadow-2xs sticky top-0">
            <Navbar logoText="Store4Riders" theme="light" />
          </div>
        </header>

        {/* Main Content Body */}
        <div className="flex-1 w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Breadcrumb Header Bar */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none py-1"
          >
            <Link
              href="/"
              className="hover:text-slate-900 transition-colors font-medium flex items-center gap-1"
            >
              Home
            </Link>
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
            <Link
              href="/store-policies"
              className="hover:text-slate-900 transition-colors font-medium"
            >
              Support & Policies
            </Link>
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
            <span className="text-slate-900 font-semibold truncate">
              {displayTitle}
            </span>
          </nav>

          {/* Page Hero Banner Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-xs border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-bold tracking-wide uppercase">
                {badgeIcon || <Sparkles size={14} className="text-brand shrink-0" />}
                <span>{displayBadge}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                <Clock size={12} className="text-slate-400" />
                <span>Last Updated: {displayLastUpdated}</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-3">
              {displayTitle}
            </h1>

            {displaySubtitle && (
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-4xl">
                {displaySubtitle}
              </p>
            )}

            {/* Optional Summary Alert Note */}
            {displaySummaryAlert && (
              <div
                className={`mt-6 p-4 sm:p-5 rounded-xl border flex items-start gap-3.5 text-xs sm:text-sm ${
                  displaySummaryAlert.type === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : displaySummaryAlert.type === "brand"
                    ? "bg-brand/5 border-brand/20 text-brand-dark"
                    : displaySummaryAlert.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-blue-50 border-blue-200 text-blue-900"
                }`}
              >
                {displaySummaryAlert.type === "warning" ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : displaySummaryAlert.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  {displaySummaryAlert.title && (
                    <div className="font-bold tracking-tight">
                      {displaySummaryAlert.title}
                    </div>
                  )}
                  <div className="leading-relaxed">{displaySummaryAlert.text}</div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Horizontal Quick-Nav Bar */}
          <div className="lg:hidden bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Compass size={13} className="text-brand" />
              <span>Jump to Policy or Guide</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
              {POLICY_NAV_GROUPS.flatMap((g) => g.items).map((item) => {
                const isActive = activePath === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`snap-start shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-brand text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    }`}
                  >
                    <Icon size={13} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Desktop Sticky Sidebar */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6 sticky top-28 self-start">
              {/* Policy Directory Nav */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-brand" />
                    <span>Store Policies</span>
                  </h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    Directory
                  </span>
                </div>

                <div className="space-y-5">
                  {POLICY_NAV_GROUPS.map((group) => (
                    <div key={group.groupTitle} className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-2 py-1">
                        {group.groupTitle}
                      </div>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const isActive = activePath === item.href;
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                isActive
                                  ? "bg-brand/10 text-brand font-bold border-l-4 border-brand pl-2.5 shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon
                                  size={15}
                                  className={`shrink-0 transition-colors ${
                                    isActive
                                      ? "text-brand"
                                      : "text-slate-400 group-hover:text-slate-700"
                                  }`}
                                />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badge && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 ${
                                    isActive
                                      ? "bg-brand text-white"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rider Support Desk Widget */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand/20 text-brand flex items-center justify-center shrink-0">
                    <PhoneCall size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Rider Support Desk
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Have questions about this policy?
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Our certified moto gear advisors are available to assist with
                  sizing, order exchanges, and warranty inquiries.
                </p>

                <div className="space-y-2 pt-1 text-xs">
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=Hi%20Store4Riders%2C%20I%20have%20a%20query%20about%20your%20policies`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl transition-all shadow-xs"
                  >
                    <MessageSquare size={14} />
                    <span>Chat on WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${supportPhone}`}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-3 rounded-xl transition-all"
                  >
                    <PhoneCall size={14} />
                    <span>{supportPhone}</span>
                  </a>

                  <a
                    href={`mailto:${supportEmail}`}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white py-1.5 px-3 rounded-xl transition-all text-[11px] truncate"
                  >
                    <Mail size={13} />
                    <span className="truncate">{supportEmail}</span>
                  </a>
                </div>

                <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Support Hours</span>
                  <span className="font-semibold text-slate-300">
                    Mon - Sat: 10AM - 7PM IST
                  </span>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="lg:col-span-8 xl:col-span-9 space-y-8 min-w-0 max-w-full overflow-hidden">
              {/* Robust Content Card (Never breaks or overflows) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-10 min-w-0 max-w-full overflow-hidden">
                <article className="policy-prose break-words max-w-none text-slate-700 leading-relaxed text-sm sm:text-base space-y-6">
                  {hasCustomContent ? (
                    <div dangerouslySetInnerHTML={{ __html: customPage!.contentHtml }} />
                  ) : (
                    children
                  )}
                </article>

                {/* Bottom Assistance & Trust Banner */}
                <div className="mt-12 pt-8 border-t border-slate-100 space-y-6">
                  {/* 3 Core Trust Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                          100% Genuine Gear
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Direct brand imports & authorized Indian distributor stock with warranty.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
                      <ArrowLeftRight className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                          7-Day Size Exchange
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Hassle-free size replacement support so your riding armor fits securely.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
                      <Truck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                          Pan-India Logistics
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Inspected, securely packaged, and tracked via premier express couriers.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Help prompt */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white">
                    <div>
                      <h4 className="text-sm font-bold">
                        Need clarification on this policy?
                      </h4>
                      <p className="text-xs text-slate-300">
                        Our rider support team is always ready to assist you.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        href="/contact-us"
                        className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand/90 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                      >
                        <Mail size={13} />
                        <span>Contact Support</span>
                      </Link>
                      <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                      >
                        <MessageSquare size={13} />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Global Store Footer */}
      <div className="bg-neutral-950 pb-32 lg:pb-0 w-full mt-auto">
        <Footer />
      </div>
    </div>
  </>
);
}
