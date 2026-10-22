"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/core/api/client";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { 
  Building2, 
  Receipt, 
  FileText, 
  Percent, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ShieldCheck, 
  MapPin,
  Info
} from "lucide-react";

interface IGstSettingsData {
  gstin?: string;
  legalBusinessName?: string;
  pan?: string;
  taxRate: number;
  gstPricingMode?: "inclusive" | "exclusive";
  allowB2bGstin?: boolean;
  storeOriginState?: string;
  storeOriginCity?: string;
  storeOriginPincode?: string;
  storeOriginAddress?: string;
  storeOriginPhone?: string;
  [key: string]: any;
}

export function AdminGstSettings() {
  const [settings, setSettings] = useState<IGstSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get("/admin/settings");
      setSettings(res.data.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load GST settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    // Optional validation for GSTIN format if entered
    if (settings.gstin && settings.gstin.trim() !== "") {
      const gstinClean = settings.gstin.trim().toUpperCase();
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstinClean)) {
        toast.error("Please enter a valid 15-digit GSTIN (e.g., 27AAPCS1234F1Z5)");
        return;
      }
    }

    setSaving(true);
    try {
      const { _id, __v, createdAt, updatedAt, id, ...payload } = settings as any;
      await apiClient.put("/admin/settings", payload);
      toast.success("GST and Tax settings saved successfully");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to save GST settings";
      toast.error(typeof msg === "string" ? msg : "Failed to save GST settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Registered Business Identity & GSTIN */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-5">
          <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand" />
                Store GST Identity & Legal Information
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                These legal details appear on all official PDF Tax Invoices, shipping manifests, and customer receipts.
              </p>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
              Tax Compliant (India GST)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Legal Business Name */}
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                Legal Entity / Company Name *
              </label>
              <input
                type="text"
                required
                value={settings.legalBusinessName || ""}
                onChange={(e) => setSettings({ ...settings, legalBusinessName: e.target.value })}
                placeholder="e.g. Store4Riders Retail Pvt. Ltd."
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              />
              <span className="text-[11px] text-neutral-400 mt-0.5 block">Official name registered on GST portal</span>
            </div>

            {/* Store GSTIN */}
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                Store GSTIN (15 Digits) *
              </label>
              <input
                type="text"
                maxLength={15}
                value={settings.gstin || ""}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                placeholder="e.g. 27AAPCS1234F1Z5"
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm font-mono uppercase focus:ring-2 focus:ring-brand focus:outline-none tracking-wider"
              />
              <span className="text-[11px] text-neutral-400 mt-0.5 block">Format: 2 digits State + 10 char PAN + 1 entity + Z + check</span>
            </div>

            {/* PAN Number */}
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                Business PAN Number
              </label>
              <input
                type="text"
                maxLength={10}
                value={settings.pan || ""}
                onChange={(e) => setSettings({ ...settings, pan: e.target.value.toUpperCase() })}
                placeholder="e.g. AAPCS1234F"
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm font-mono uppercase focus:ring-2 focus:ring-brand focus:outline-none tracking-wider"
              />
            </div>

            {/* Place of Supply / Store Origin State */}
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                Place of Supply / Origin State *
              </label>
              <input
                type="text"
                required
                value={settings.storeOriginState || ""}
                onChange={(e) => setSettings({ ...settings, storeOriginState: e.target.value })}
                placeholder="e.g. Maharashtra"
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              />
              <span className="text-[11px] text-neutral-400 mt-0.5 block">
                Orders within this state use <strong>CGST + SGST</strong>; out of state use <strong>IGST</strong>.
              </span>
            </div>

            {/* Origin City */}
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                Registered City
              </label>
              <input
                type="text"
                value={settings.storeOriginCity || ""}
                onChange={(e) => setSettings({ ...settings, storeOriginCity: e.target.value })}
                placeholder="e.g. Pune"
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              />
            </div>

            {/* Origin Pincode */}
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                Registered Pincode
              </label>
              <input
                type="text"
                maxLength={6}
                value={settings.storeOriginPincode || ""}
                onChange={(e) => setSettings({ ...settings, storeOriginPincode: e.target.value })}
                placeholder="e.g. 411001"
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              />
            </div>

            {/* Origin Full Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                Registered Warehouse / Dispatch Address
              </label>
              <input
                type="text"
                value={settings.storeOriginAddress || ""}
                onChange={(e) => setSettings({ ...settings, storeOriginAddress: e.target.value })}
                placeholder="e.g. Plot No 12, Senapati Bapat Road, Shivajinagar"
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 2: GST Pricing Model & Slabs */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-brand" />
              GST Pricing Rules & Calculation Mode
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Configure how taxes are calculated across your catalog and presented to customers at checkout.
            </p>
          </div>

          <div className="space-y-4">
            {/* Pricing Mode Radio */}
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 mb-2">
                Catalog Pricing Tax Mode *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  (settings.gstPricingMode || "inclusive") === "inclusive"
                    ? "border-brand bg-brand/5 shadow-xs"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}>
                  <input
                    type="radio"
                    name="gstPricingMode"
                    value="inclusive"
                    checked={(settings.gstPricingMode || "inclusive") === "inclusive"}
                    onChange={() => setSettings({ ...settings, gstPricingMode: "inclusive" })}
                    className="mt-1 text-brand"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      Prices are Inclusive of GST (MRP)
                    </span>
                    <span className="text-xs text-neutral-500 block mt-1">
                      Standard for B2C retail in India. Product price shown on store includes all taxes. Invoices automatically extract & show CGST, SGST, or IGST separately.
                    </span>
                    <span className="inline-block mt-2 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      ✓ Recommended for Store4Riders
                    </span>
                  </div>
                </label>

                <label className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  settings.gstPricingMode === "exclusive"
                    ? "border-brand bg-brand/5 shadow-xs"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}>
                  <input
                    type="radio"
                    name="gstPricingMode"
                    value="exclusive"
                    checked={settings.gstPricingMode === "exclusive"}
                    onChange={() => setSettings({ ...settings, gstPricingMode: "exclusive" })}
                    className="mt-1 text-brand"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      Prices are Exclusive of GST (Add at Checkout)
                    </span>
                    <span className="text-xs text-neutral-500 block mt-1">
                      Catalog prices represent base taxable value. Applicable GST (e.g. 18%) is calculated and added on top of the subtotal during checkout.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Default Store Tax Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Default Fallback GST Rate (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={settings.taxRate}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      const clamped = isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
                      setSettings({ ...settings, taxRate: clamped });
                    }}
                    className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm pr-8 focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                    %
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  Default GST rate when a product does not specify an individual slab (Standard: 18%).
                </span>
              </div>

              {/* B2B Checkout GSTIN Toggle */}
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  B2B Customer Invoicing
                </label>
                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-neutral-200 bg-neutral-50/60 mt-1">
                  <input
                    type="checkbox"
                    id="allowB2bGstin"
                    checked={settings.allowB2bGstin !== false}
                    onChange={(e) => setSettings({ ...settings, allowB2bGstin: e.target.checked })}
                    className="rounded text-brand w-4 h-4"
                  />
                  <label htmlFor="allowB2bGstin" className="text-xs font-semibold text-neutral-800 cursor-pointer">
                    Allow B2B customers to provide GSTIN at checkout for Input Tax Credit (ITC)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Quick Slabs & HSN Reference (Educational & Operational) */}
        <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-neutral-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Indian Riding Gear GST Slabs & HSN Quick Reference
            </h3>
          </div>
          <p className="text-xs text-neutral-600">
            When creating or editing individual products under <strong>Products</strong>, you can assign these standard GST tiers and HSN codes:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            <div className="bg-white p-3 rounded-lg border border-neutral-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">18% Standard (HSN 6506)</span>
              <span className="text-neutral-500 text-[11px] block">Helmets, Safety Headgear, Visors</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-neutral-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">18% Riding Gear (HSN 6116 / 6403)</span>
              <span className="text-neutral-500 text-[11px] block">Riding Gloves, Armored Boots</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-neutral-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">12% Apparel (HSN 6203)</span>
              <span className="text-neutral-500 text-[11px] block">Jackets, Riding Pants, Base Layers</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-neutral-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">28% Spares & Parts (HSN 8708)</span>
              <span className="text-neutral-500 text-[11px] block">Performance Spares, Exhausts, Accessories</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-neutral-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">18% Luggage & Bags (HSN 4202)</span>
              <span className="text-neutral-500 text-[11px] block">Tail Bags, Tank Bags, Backpacks</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-neutral-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">5% Consumables (HSN 2710)</span>
              <span className="text-neutral-500 text-[11px] block">Chain Cleaners, Lubes, Fork Oils</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving} className="px-8 py-3 text-sm font-bold uppercase tracking-wider">
            {saving ? "Saving Changes..." : "Save GST & Tax Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
