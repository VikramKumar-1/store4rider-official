"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/core/api/client";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import {
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  RotateCcw,
  Building,
  CheckCircle2,
  Info,
} from "lucide-react";

interface IContactSettingsData {
  supportPhone?: string;
  whatsappNumber?: string;
  whatsappChatEnabled?: boolean;
  whatsappDefaultMessage?: string;
  supportEmail?: string;
  storeOriginAddress?: string;
  storeOriginCity?: string;
  storeOriginState?: string;
  storeOriginPincode?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  returnWindowDays?: number;
  [key: string]: any;
}

export function AdminContactSettings() {
  const [settings, setSettings] = useState<IContactSettingsData>({
    supportPhone: "",
    whatsappNumber: "+91 - 7263007788",
    whatsappChatEnabled: true,
    whatsappDefaultMessage: "Hi Store4Riders, I have a query regarding products/order.",
    supportEmail: "contact@store4riders.com",
    storeOriginAddress: "Store4Riders Warehouse",
    storeOriginCity: "Pune",
    storeOriginState: "Maharashtra",
    storeOriginPincode: "411001",
    facebookUrl: "https://www.facebook.com/store4riders/",
    instagramUrl: "https://www.instagram.com/store4riders/",
    youtubeUrl: "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg",
    twitterUrl: "https://twitter.com/store4riders",
    returnWindowDays: 7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get("/admin/settings");
      if (res.data?.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data.data,
          whatsappNumber: res.data.data.whatsappNumber || "+91 - 7263007788",
          whatsappChatEnabled: res.data.data.whatsappChatEnabled !== false,
          whatsappDefaultMessage: res.data.data.whatsappDefaultMessage || "Hi Store4Riders, I have a query regarding products/order.",
          supportEmail: res.data.data.supportEmail || "contact@store4riders.com",
          returnWindowDays: res.data.data.returnWindowDays ?? 7,
        }));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load store contact settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { _id, __v, createdAt, updatedAt, id, ...payload } = settings as any;
      await apiClient.put("/admin/settings", payload);
      toast.success("Store contact & SEO settings saved successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-500 font-medium">Loading store contact settings...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Informational banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-blue-900 leading-relaxed">
          <strong className="font-semibold text-blue-950">Storefront & Schema.org SEO Control:</strong>{" "}
          Phone numbers, email, physical warehouse address, WhatsApp, and social media links configured here will automatically synchronize with Schema.org structured data (Google Rich Results), the website footer contact card, and customer invoices.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Customer Support & Communication */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-brand flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Support & Communication</h2>
              <p className="text-xs text-neutral-500">Calling phone, WhatsApp and official support email</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                Customer Support Phone
              </label>
              <input
                type="text"
                value={settings.supportPhone || ""}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <p className="text-[11px] text-neutral-400 mt-1">Displayed in website footer and Google OnlineStore schema contact points.</p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Storefront Floating WhatsApp Chat
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.whatsappChatEnabled !== false}
                    onChange={(e) => setSettings({ ...settings, whatsappChatEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-semibold text-neutral-700">
                    {settings.whatsappChatEnabled !== false ? "Active" : "Disabled"}
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber || ""}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="+91 - 7263007788"
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Primary WhatsApp number riders chat with. E.g. <span className="font-mono font-medium text-emerald-700">+91 - 7263007788</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Default Pre-filled Chat Message
                </label>
                <input
                  type="text"
                  value={settings.whatsappDefaultMessage || ""}
                  onChange={(e) => setSettings({ ...settings, whatsappDefaultMessage: e.target.value })}
                  placeholder="Hi Store4Riders, I have a query regarding products/order."
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Pre-filled greeting message opened in WhatsApp web / mobile app.
                </p>
              </div>

              {/* Live Preview & Direct Test */}
              <div className="pt-2 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-medium">Target:</span>
                  <span className="font-mono text-[11px] text-neutral-600 truncate max-w-[200px]">
                    {settings.whatsappNumber ? settings.whatsappNumber.replace(/\D/g, "") : "Not set"}
                  </span>
                </div>
                {settings.whatsappNumber && (
                  <a
                    href={`https://wa.me/${(() => {
                      const d = (settings.whatsappNumber || "").replace(/\D/g, "");
                      return d.length === 10 ? `91${d}` : d;
                    })()}?text=${encodeURIComponent(settings.whatsappDefaultMessage || "Hi Store4Riders, I have a query regarding products/order.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2"
                  >
                    Test WhatsApp Link &rarr;
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail || ""}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                placeholder="contact@store4riders.com"
                className="w-full text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <p className="text-[11px] text-neutral-400 mt-1">Official customer inquiries email.</p>
            </div>
          </div>
        </div>

        {/* Card 2: Physical Store & Dispatch Address */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Origin & Dispatch Address</h2>
              <p className="text-xs text-neutral-500">Warehouse location used in Shipping & Schema</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-neutral-400" />
                Address Line
              </label>
              <input
                type="text"
                value={settings.storeOriginAddress || ""}
                onChange={(e) => setSettings({ ...settings, storeOriginAddress: e.target.value })}
                placeholder="Shop No. 12, Commercial Complex, MG Road"
                className="w-full text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">City</label>
                <input
                  type="text"
                  value={settings.storeOriginCity || ""}
                  onChange={(e) => setSettings({ ...settings, storeOriginCity: e.target.value })}
                  placeholder="Pune"
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">State</label>
                <input
                  type="text"
                  value={settings.storeOriginState || ""}
                  onChange={(e) => setSettings({ ...settings, storeOriginState: e.target.value })}
                  placeholder="Maharashtra"
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Pincode</label>
              <input
                type="text"
                value={settings.storeOriginPincode || ""}
                onChange={(e) => setSettings({ ...settings, storeOriginPincode: e.target.value })}
                placeholder="411001"
                maxLength={6}
                className="w-full text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Social Media Profiles */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Social Media Links</h2>
              <p className="text-xs text-neutral-500">Google Knowledge Panel `sameAs` structured data</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-500" />
                Instagram URL
              </label>
              <input
                type="url"
                value={settings.instagramUrl || ""}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                placeholder="https://www.instagram.com/store4riders/"
                className="w-full text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                YouTube Channel URL
              </label>
              <input
                type="url"
                value={settings.youtubeUrl || ""}
                onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                placeholder="https://www.youtube.com/channel/..."
                className="w-full text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-blue-600" />
                Facebook Page URL
              </label>
              <input
                type="url"
                value={settings.facebookUrl || ""}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                placeholder="https://www.facebook.com/store4riders/"
                className="w-full text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5 text-sky-500" />
                X / Twitter URL
              </label>
              <input
                type="url"
                value={settings.twitterUrl || ""}
                onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                placeholder="https://twitter.com/store4riders"
                className="w-full text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Store Policy Window */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Exchange Window</h2>
              <p className="text-xs text-neutral-500">Informs Google Merchant Center & Shoppers</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Merchant Exchange Days
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={settings.returnWindowDays ?? 7}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    const clamped = isNaN(parsed) ? 0 : Math.min(90, Math.max(0, parsed));
                    setSettings({ ...settings, returnWindowDays: clamped });
                  }}
                  className="w-32 text-sm border border-neutral-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono"
                />
                <span className="text-sm font-medium text-neutral-600">Days from delivery</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Reported to Google Schema.org MerchantReturnPolicy as `merchantReturnDays`.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-neutral-200">
        <Button
          type="submit"
          disabled={saving}
          className="bg-brand text-white font-bold px-6 py-2.5 rounded-lg shadow-sm hover:bg-brand/90 transition-all flex items-center gap-2 cursor-pointer"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Contact & SEO Settings</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
