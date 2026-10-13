"use client";

import React, { useState } from "react";
import { AdminPaymentSettings } from "@/modules/admin/components/AdminPaymentSettings";
import { AdminGoogleReviewsSettings } from "@/modules/admin/components/AdminGoogleReviewsSettings";
import { AdminGstSettings } from "@/modules/admin/components/AdminGstSettings";
import { AdminContactSettings } from "@/modules/admin/components/AdminContactSettings";

type SettingsTab = "contact" | "gst" | "payments" | "google-reviews";

export default function AdminSettingsDashboard() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("contact");

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Store Settings</h1>
      </div>

      <div className="mb-6 border-b border-neutral-200 flex gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("contact")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
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
          onClick={() => setActiveTab("gst")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
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
          onClick={() => setActiveTab("payments")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 whitespace-nowrap ${
            activeTab === "payments"
              ? "text-brand border-brand"
              : "text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          Payment Rules
        </button>

        <button
          onClick={() => setActiveTab("google-reviews")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "google-reviews"
              ? "text-brand border-brand"
              : "text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          Google Store Reviews
          <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-mono uppercase">
            SerpApi
          </span>
        </button>
      </div>

      {activeTab === "contact" && <AdminContactSettings />}
      {activeTab === "gst" && <AdminGstSettings />}
      {activeTab === "payments" && <AdminPaymentSettings />}
      {activeTab === "google-reviews" && <AdminGoogleReviewsSettings />}
    </div>
  );
}
