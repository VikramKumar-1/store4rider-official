"use client";

import React from "react";
import { Share2 } from "lucide-react";
import { useProductFormContext } from "../ProductFormContext";

export function ProductRelationsTab() {
  const {
    relatedSkusInput,
    setRelatedSkusInput,
    upsellSkusInput,
    setUpsellSkusInput,
    crosssellSkusInput,
    setCrosssellSkusInput,
  } = useProductFormContext();

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Share2 className="text-brand" size={18} />
          Cross-Sell & Upsell Relationships
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter target SKUs separated by commas to power &quot;Complete Your Kit&quot; and product recommendations.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Related SKUs (&quot;Complete Your Kit&quot;)
          </label>
          <input
            type="text"
            value={relatedSkusInput}
            onChange={(e) => setRelatedSkusInput(e.target.value)}
            placeholder="e.g. AX-VISOR-01, BL-BALAC-02, MT-PINLOCK-70"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
          <p className="text-xs text-slate-400 mt-1">SKUs shown as complementary riding gear on PDP.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Upsell SKUs (Alternative / Premium upgrades)
          </label>
          <input
            type="text"
            value={upsellSkusInput}
            onChange={(e) => setUpsellSkusInput(e.target.value)}
            placeholder="e.g. AX-CARBON-PRO, MT-THUNDER-4"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Cross-Sell SKUs (Cart page recommendations)
          </label>
          <input
            type="text"
            value={crosssellSkusInput}
            onChange={(e) => setCrosssellSkusInput(e.target.value)}
            placeholder="e.g. RAIN-COVER-01, CHAIN-CLEAN-500"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
