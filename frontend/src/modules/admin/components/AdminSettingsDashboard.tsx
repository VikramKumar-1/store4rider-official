"use client";

import React, { useState } from "react";
import { AdminPaymentSettings } from "@/modules/admin/components/AdminPaymentSettings";
import { AdminGoogleReviewsSettings } from "@/modules/admin/components/AdminGoogleReviewsSettings";

type SettingsTab = "payments" | "google-reviews";

export default function AdminSettingsDashboard() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("payments");

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Store Settings</h1>
      </div>

      <div className="mb-6 border-b border-neutral-200 flex gap-4">
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 ${
            activeTab === "payments"
              ? "text-brand border-brand"
              : "text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          Payment Rules
        </button>

        <button
          onClick={() => setActiveTab("google-reviews")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 ${
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

      {activeTab === "payments" ? <AdminPaymentSettings /> : <AdminGoogleReviewsSettings />}
    </div>
  );
}
