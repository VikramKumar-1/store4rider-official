"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/core/api/client";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import {
  Truck,
  Package,
  MapPin,
  RotateCcw,
  ArrowLeftRight,
  ExternalLink,
  ShieldCheck,
  Percent,
  IndianRupee,
  Save,
  Loader2,
  Info,
} from "lucide-react";

interface IShippingSettings {
  freeShippingThreshold: number;
  shippingCost: number;
  storeOriginPincode?: string;
  storeOriginCity?: string;
  storeOriginState?: string;
  storeOriginAddress?: string;
  storeOriginPhone?: string;
  returnWindowDays?: number;
  packagePresets?: { _id?: string; name: string; length: number; breadth: number; height: number }[];
}

export function AdminShippingSettings() {
  const [settings, setSettings] = useState<IShippingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/settings");
      setSettings(res.data.data);
    } catch (err) {
      toast.error("Failed to load shipping settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      const { _id, __v, createdAt, updatedAt, id, ...payload } = settings as any;
      await apiClient.put("/admin/settings", payload);
      toast.success("Shipping & Delivery settings saved successfully!");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to save settings";
      toast.error(typeof msg === "string" ? msg : "Failed to save shipping settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand mr-2" />
        <span className="text-sm font-semibold">Loading Shipping Settings...</span>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Quick Ops Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[#FF5429] shrink-0">
            <Truck size={22} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Courier Operations & Fulfillment</h3>
            <p className="text-xs text-slate-300">
              Generate AWBs, track live Shiprocket couriers, and manage multiple warehouse pickups.
            </p>
          </div>
        </div>
        <Link
          href="/admin/shipping"
          className="inline-flex items-center gap-1.5 bg-[#FF5429] hover:bg-[#e0451d] text-white text-xs font-bold px-4 py-2 rounded-md transition-colors shadow-sm shrink-0"
        >
          <span>Open Courier Dashboard</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. Standard Rates & Free Shipping */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Truck size={16} className="text-[#FF5429]" />
              Storefront Shipping Charges & Thresholds
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rules used during checkout when calculating standard delivery fees for customers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Standard Shipping Cost */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <span>Standard Delivery Fee (₹)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={settings.shippingCost ?? 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shippingCost: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-md pl-7 pr-3 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand shadow-2xs"
                  placeholder="e.g. 49"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Standard charge applied when order subtotal is below the free shipping threshold.
              </p>
            </div>

            {/* Free Shipping Threshold */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <span className="text-emerald-600">★</span>
                <span>Free Shipping Minimum Order (₹)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={settings.freeShippingThreshold ?? 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      freeShippingThreshold: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-md pl-7 pr-3 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand shadow-2xs"
                  placeholder="e.g. 999"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Orders with cart subtotal ≥ ₹{settings.freeShippingThreshold} get Free Delivery automatically.
              </p>
            </div>
          </div>

          {/* Real-time Example Calculation Pill */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info size={13} className="text-blue-600" />
              <span>Customer Checkout Preview:</span>
            </div>
            <p className="text-[11px] text-slate-600">
              • Cart value of <strong>₹500</strong>: Delivery fee = <strong className="text-slate-900">₹{settings.shippingCost}</strong>
            </p>
            <p className="text-[11px] text-slate-600">
              • Cart value of <strong>₹1,500</strong>: Delivery fee = <strong className="text-emerald-700">FREE (₹0)</strong>
            </p>
          </div>
        </div>

        {/* 2. Warehouse Origin & Dispatch Location */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <MapPin size={16} className="text-[#FF5429]" />
              Store Origin & Dispatch Location
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Primary warehouse origin used for Courier rate estimates and Shiprocket pickup schedules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Dispatch Pincode
              </label>
              <input
                type="text"
                maxLength={6}
                value={settings.storeOriginPincode || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    storeOriginPincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                  })
                }
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none focus:border-brand shadow-2xs"
                placeholder="411001"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Origin City
              </label>
              <input
                type="text"
                value={settings.storeOriginCity || ""}
                onChange={(e) =>
                  setSettings({ ...settings, storeOriginCity: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand shadow-2xs"
                placeholder="Pune"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Origin State
              </label>
              <input
                type="text"
                value={settings.storeOriginState || ""}
                onChange={(e) =>
                  setSettings({ ...settings, storeOriginState: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand shadow-2xs"
                placeholder="Maharashtra"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Warehouse Street Address
              </label>
              <input
                type="text"
                value={settings.storeOriginAddress || ""}
                onChange={(e) =>
                  setSettings({ ...settings, storeOriginAddress: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand shadow-2xs"
                placeholder="Store4Riders Central Warehouse, Plot No 12..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Dispatch Phone Number
              </label>
              <input
                type="text"
                value={settings.storeOriginPhone || ""}
                onChange={(e) =>
                  setSettings({ ...settings, storeOriginPhone: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-brand shadow-2xs"
                placeholder="9876543210"
              />
            </div>
          </div>
        </div>

        {/* 3. Customer Exchanges & Window */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-[#FF5429]" />
              Exchange Window Policy
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Number of days a customer has to request a size or gear exchange after order delivery. (Store4Riders operates on an exchange-only policy; no returns or refunds).
            </p>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Exchange Request Window (Days)
            </label>
            <input
              type="number"
              min={0}
              max={60}
              value={settings.returnWindowDays ?? 7}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  returnWindowDays: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand shadow-2xs"
              placeholder="7"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Store4Riders standard: 7 days after delivery date for size/fit exchanges.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#FF5429] hover:bg-[#e0451d] disabled:opacity-50 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm shadow-[#FF5429]/25 transition-all cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{saving ? "Saving..." : "Save Shipping Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
