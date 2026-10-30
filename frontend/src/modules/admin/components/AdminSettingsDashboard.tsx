"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPaymentSettings } from "@/modules/admin/components/AdminPaymentSettings";
import { AdminShippingSettings } from "@/modules/admin/components/AdminShippingSettings";
import { AdminGoogleReviewsSettings } from "@/modules/admin/components/AdminGoogleReviewsSettings";
import { AdminGstSettings } from "@/modules/admin/components/AdminGstSettings";
import { AdminContactSettings } from "@/modules/admin/components/AdminContactSettings";
import { AdminSearchSettings } from "@/modules/admin/components/AdminSearchSettings";
import { AdminFooterSettings } from "@/modules/admin/components/AdminFooterSettings";
import { AdminPolicyPagesSettings } from "@/modules/admin/components/AdminPolicyPagesSettings";

type SettingsTab = "contact" | "footer" | "policies" | "shipping" | "payments" | "gst" | "search" | "google-reviews";

export default function AdminSettingsDashboard() {
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab") as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>("contact");

  useEffect(() => {
    if (tabQuery && ["contact", "footer", "policies", "shipping", "payments", "gst", "search", "google-reviews"].includes(tabQuery)) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Store Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure global store rules including footer navigation, shipping rates, free shipping thresholds, partial COD, payments, and SEO in one place.
          </p>
        </div>
      </div>

      <div className="mb-6 border-b border-neutral-200 flex gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("contact")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "contact"
              ? "text-brand border-brand"
              : "text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          <span>Store Contact & SEO</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase">
            Schema
          </span>
        </button>

        <button
          onClick={() => setActiveTab("footer")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "footer"
              ? "text-brand border-brand"
              : "text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          <span>Footer Navigation</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded uppercase">
            Links
          </span>
        </button>

        <button
          onClick={() => setActiveTab("policies")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "policies"
              ? "text-brand border-brand"
              : "text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          <span>Policy Pages Content</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase">
            CMS
          </span>
        </button>

        <button
          onClick={() => setActiveTab("shipping")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "shipping"
              ? "text-brand border-brand"
              : "text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          <span>Shipping & Delivery</span>
          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded uppercase">
            Rates
          </span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "payments"
              ? "text-brand border-brand"
              : "text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          <span>Payment Rules & COD</span>
          <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 rounded uppercase">
            Advance
          </span>
        </button>

        <button
          onClick={() => setActiveTab("gst")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "gst"
              ? "text-brand border-brand"
              : "text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          <span>Tax & GST Configuration</span>
          <span className="text-[10px] bg-red-100 text-brand font-black px-1.5 py-0.5 rounded uppercase">
            GSTIN
          </span>
        </button>

        <button
          onClick={() => setActiveTab("search")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "search"
              ? "text-brand border-brand"
              : "text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          <span>Search & Discovery</span>
          <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded uppercase">
            Trending
          </span>
        </button>

        <button
          onClick={() => setActiveTab("google-reviews")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "google-reviews"
              ? "text-brand border-brand"
              : "text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          <span>Google Store Reviews</span>
          <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-mono uppercase">
            SerpApi
          </span>
        </button>
      </div>

      {activeTab === "contact" && <AdminContactSettings />}
      {activeTab === "footer" && <AdminFooterSettings />}
      {activeTab === "policies" && <AdminPolicyPagesSettings />}
      {activeTab === "shipping" && <AdminShippingSettings />}
      {activeTab === "payments" && <AdminPaymentSettings />}
      {activeTab === "gst" && <AdminGstSettings />}
      {activeTab === "search" && <AdminSearchSettings />}
      {activeTab === "google-reviews" && <AdminGoogleReviewsSettings />}
    </div>
  );
}
