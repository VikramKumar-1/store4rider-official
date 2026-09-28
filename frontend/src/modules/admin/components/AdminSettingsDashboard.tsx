"use client";

import React from "react";
import { AdminPaymentSettings } from "@/modules/admin/components/AdminPaymentSettings";

export default function AdminSettingsDashboard() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Store Settings</h1>
      </div>
      
      <div className="mb-6 border-b border-neutral-200">
        <div className="px-6 py-3 font-bold text-sm uppercase text-brand border-b-2 border-brand inline-block">
          Payment Rules
        </div>
      </div>

      <AdminPaymentSettings />
    </div>
  );
}
