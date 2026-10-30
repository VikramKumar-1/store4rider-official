"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/core/api/client";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  ExternalLink,
  Layers,
  FileText,
  Mail,
  Shield,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { IFooterConfig, IFooterLink } from "@store4riders/shared-types";

const INITIAL_DEFAULTS: IFooterConfig = {
  aboutText: "",
  showContact: true,
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  showSocialLinks: true,
  column1Title: "EXCHANGE & REPLACEMENTS",
  column1Links: [
    { label: "Exchange & Replacements", url: "/returns", openInNewTab: false },
    { label: "Warranty", url: "/warranty", openInNewTab: false },
    { label: "Conditions of Sale & Use", url: "/terms", openInNewTab: false },
    { label: "Privacy and Cookie Policy", url: "/privacy", openInNewTab: false },
    { label: "Legal", url: "/legal", openInNewTab: false },
    { label: "Shipping Policies", url: "/shipping", openInNewTab: false },
    { label: "Store Policies", url: "/store-policies", openInNewTab: false },
  ],
  column2Title: "SUPPORT AND SERVICES",
  column2Links: [
    { label: "About us", url: "/about-us", openInNewTab: false },
    { label: "Contact Us", url: "/contact-us", openInNewTab: false },
    { label: "Your Account", url: "/account", openInNewTab: false },
    { label: "Wish List", url: "/account/wishlist", openInNewTab: false },
    { label: "Rider Assist", url: "/rider-assist", openInNewTab: false },
    { label: "Cash on Delivery", url: "/cash-on-delivery", openInNewTab: false },
    { label: "Collaboration", url: "/collaboration", openInNewTab: false },
  ],
  newsletterTitle: "SUBSCRIBE US",
  newsletterSubtitle: "Get updates on new riding gear arrivals, exclusive discount coupons, and offers.",
  newsletterPlaceholder: "Enter your email address",
  copyrightText: "© {year} MotoHive Media Pvt. Ltd. (Store4Riders). All rights reserved.",
  bottomLinks: [
    { label: "Privacy Policy", url: "/privacy", openInNewTab: false },
    { label: "Terms of Service", url: "/terms", openInNewTab: false },
    { label: "Exchange Policy", url: "/returns", openInNewTab: false },
  ],
};

export function AdminFooterSettings() {
  const [config, setConfig] = useState<IFooterConfig>(INITIAL_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get("/admin/settings");
      if (res.data?.data) {
        const fetchedFooter = res.data.data.footerConfig || {};
        setConfig({
          aboutText: fetchedFooter.aboutText ?? "",
          showContact: fetchedFooter.showContact ?? true,
          contactPhone: fetchedFooter.contactPhone ?? "",
          contactEmail: fetchedFooter.contactEmail ?? "",
          contactAddress: fetchedFooter.contactAddress ?? "",
          showSocialLinks: fetchedFooter.showSocialLinks ?? true,
          column1Title: fetchedFooter.column1Title || INITIAL_DEFAULTS.column1Title,
          column1Links: fetchedFooter.column1Links && fetchedFooter.column1Links.length > 0
            ? fetchedFooter.column1Links
            : INITIAL_DEFAULTS.column1Links,
          column2Title: fetchedFooter.column2Title || INITIAL_DEFAULTS.column2Title,
          column2Links: fetchedFooter.column2Links && fetchedFooter.column2Links.length > 0
            ? fetchedFooter.column2Links
            : INITIAL_DEFAULTS.column2Links,
          newsletterTitle: fetchedFooter.newsletterTitle || INITIAL_DEFAULTS.newsletterTitle,
          newsletterSubtitle: fetchedFooter.newsletterSubtitle ?? INITIAL_DEFAULTS.newsletterSubtitle,
          newsletterPlaceholder: fetchedFooter.newsletterPlaceholder || INITIAL_DEFAULTS.newsletterPlaceholder,
          copyrightText: fetchedFooter.copyrightText || INITIAL_DEFAULTS.copyrightText,
          bottomLinks: fetchedFooter.bottomLinks && fetchedFooter.bottomLinks.length > 0
            ? fetchedFooter.bottomLinks
            : INITIAL_DEFAULTS.bottomLinks,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load footer settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put("/admin/settings", {
        footerConfig: config,
      });
      toast.success("Footer settings and navigation links saved successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to save footer settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset all footer menus and text to the Store4Riders defaults?")) {
      setConfig({ ...INITIAL_DEFAULTS });
      toast.info("Reset to default footer configuration. Click Save to persist.");
    }
  };

  // Helper functions for link management
  const addLink = (columnKey: "column1Links" | "column2Links" | "bottomLinks") => {
    setConfig((prev) => ({
      ...prev,
      [columnKey]: [
        ...(prev[columnKey] || []),
        { label: "New Link", url: "/", openInNewTab: false },
      ],
    }));
  };

  const updateLink = (
    columnKey: "column1Links" | "column2Links" | "bottomLinks",
    index: number,
    field: keyof IFooterLink,
    value: any
  ) => {
    setConfig((prev) => {
      const list = [...(prev[columnKey] || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [columnKey]: list };
    });
  };

  const removeLink = (
    columnKey: "column1Links" | "column2Links" | "bottomLinks",
    index: number
  ) => {
    setConfig((prev) => {
      const list = [...(prev[columnKey] || [])];
      list.splice(index, 1);
      return { ...prev, [columnKey]: list };
    });
  };

  const moveLink = (
    columnKey: "column1Links" | "column2Links" | "bottomLinks",
    index: number,
    direction: "up" | "down"
  ) => {
    setConfig((prev) => {
      const list = [...(prev[columnKey] || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return { ...prev, [columnKey]: list };
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-12 flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-500 font-medium">Loading footer settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand" />
            <span>Footer Navigation & Content Settings</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Edit every link, column title, contact details, and newsletter copy in the store footer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>{showPreview ? "Hide Preview" : "Live Preview"}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 text-neutral-600 hover:text-red-600 hover:border-red-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <Button
            onClick={() => handleSave()}
            disabled={saving}
            className="bg-brand hover:bg-brand/90 text-white text-xs px-5 py-2 rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Footer</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Live Preview Bar (Collapsible) */}
      {showPreview && (
        <div className="bg-neutral-950 text-white rounded-xl p-6 border border-neutral-800 shadow-md animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800 text-xs text-neutral-400">
            <span className="font-bold uppercase tracking-wider text-white">Live Storefront Preview</span>
            <span className="text-[11px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">Desktop View</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            {/* Col 1 Preview */}
            <div className="space-y-2">
              <span className="font-bold text-white block">STORE LOGO</span>
              {config.aboutText && <p className="text-neutral-400 text-[11px]">{config.aboutText}</p>}
              {config.showContact && (
                <div className="text-neutral-400 space-y-1 text-[11px]">
                  <p>Contact: {config.contactPhone || "+91 7263007788"}</p>
                  <p>Email: {config.contactEmail || "contact@store4riders.com"}</p>
                  <p>Address: {config.contactAddress || "Pune, Maharashtra"}</p>
                </div>
              )}
            </div>

            {/* Col 2 Preview */}
            <div className="space-y-2">
              <span className="font-bold text-white block uppercase tracking-wider">{config.column1Title || "EXCHANGE & REPLACEMENTS"}</span>
              <ul className="text-neutral-400 space-y-1.5 text-[11px]">
                {config.column1Links?.map((l, i) => (
                  <li key={i}>{l.label}</li>
                ))}
              </ul>
            </div>

            {/* Col 3 Preview */}
            <div className="space-y-2">
              <span className="font-bold text-white block uppercase tracking-wider">{config.column2Title || "SUPPORT AND SERVICES"}</span>
              <ul className="text-neutral-400 space-y-1.5 text-[11px]">
                {config.column2Links?.map((l, i) => (
                  <li key={i}>{l.label}</li>
                ))}
              </ul>
            </div>

            {/* Col 4 Preview */}
            <div className="space-y-2">
              <span className="font-bold text-white block uppercase tracking-wider">{config.newsletterTitle || "SUBSCRIBE US"}</span>
              <p className="text-neutral-400 text-[11px]">{config.newsletterSubtitle}</p>
              <div className="bg-[#4E5866] text-neutral-300 p-2 rounded text-[11px]">
                {config.newsletterPlaceholder || "Enter your email address"}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-800 text-[11px] text-neutral-500 flex justify-between">
            <span>{(config.copyrightText || "").replace(/\{year\}/g, new Date().getFullYear().toString())}</span>
            <div className="flex gap-4">
              {config.bottomLinks?.map((l, i) => (
                <span key={i}>{l.label}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: COLUMN 1 BRAND, ABOUT & CONTACT OVERRIDES */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-6">
        <div className="border-b border-neutral-100 pb-4">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand" />
            Column 1: Brand & Contact Info
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Configure logo tagline, contact details display, and social media icons in the left column.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Store Tagline / Short About Description (Optional)
            </label>
            <textarea
              rows={2}
              value={config.aboutText || ""}
              onChange={(e) => setConfig({ ...config, aboutText: e.target.value })}
              placeholder="e.g. Store4Riders is a one stop shop solution for your riding needs. Here the riders can get top quality riding gears."
              className="w-full text-xs p-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
              <div>
                <span className="text-xs font-bold text-neutral-800 block">Show Contact Details</span>
                <span className="text-[11px] text-neutral-500">Display phone, email, and warehouse address in footer</span>
              </div>
              <input
                type="checkbox"
                checked={config.showContact !== false}
                onChange={(e) => setConfig({ ...config, showContact: e.target.checked })}
                className="w-4 h-4 text-brand rounded focus:ring-brand cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
              <div>
                <span className="text-xs font-bold text-neutral-800 block">Show Social Media Icons</span>
                <span className="text-[11px] text-neutral-500">Display Instagram, Facebook, YouTube, Twitter icons</span>
              </div>
              <input
                type="checkbox"
                checked={config.showSocialLinks !== false}
                onChange={(e) => setConfig({ ...config, showSocialLinks: e.target.checked })}
                className="w-4 h-4 text-brand rounded focus:ring-brand cursor-pointer"
              />
            </div>
          </div>

          {config.showContact && (
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
              <span className="text-xs font-bold text-neutral-800 block">Contact Overrides (Optional)</span>
              <p className="text-[11px] text-neutral-500 -mt-2">
                Leave empty to automatically use your global details from the Store Contact & SEO tab.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Custom Phone</label>
                  <input
                    type="text"
                    value={config.contactPhone || ""}
                    onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                    placeholder="+91 7263007788"
                    className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Custom Email</label>
                  <input
                    type="email"
                    value={config.contactEmail || ""}
                    onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                    placeholder="contact@store4riders.com"
                    className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Custom Address</label>
                  <input
                    type="text"
                    value={config.contactAddress || ""}
                    onChange={(e) => setConfig({ ...config, contactAddress: e.target.value })}
                    placeholder="Store4Riders, Pune, Maharashtra - 411001"
                    className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: COLUMN 2 NAVIGATION LINKS (Default: EXCHANGE & REPLACEMENTS) */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Column 2: Navigation Links
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Add, edit, reorder, or remove links in Column 2.
            </p>
          </div>

          <button
            type="button"
            onClick={() => addLink("column1Links")}
            className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">Column Title</label>
          <input
            type="text"
            value={config.column1Title || ""}
            onChange={(e) => setConfig({ ...config, column1Title: e.target.value })}
            placeholder="EXCHANGE & REPLACEMENTS"
            className="w-full max-w-md text-xs p-2.5 border border-neutral-200 rounded-lg font-bold focus:outline-none focus:border-brand"
          />
        </div>

        {/* Links Table */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="bg-neutral-50 px-4 py-2.5 text-[11px] font-bold text-neutral-600 grid grid-cols-[80px_1fr_1fr_100px_50px] gap-3 items-center">
            <span>Order</span>
            <span>Link Label</span>
            <span>Destination URL</span>
            <span className="text-center">New Tab</span>
            <span className="text-center">Action</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {config.column1Links?.map((link, idx) => (
              <div key={idx} className="p-3 grid grid-cols-[80px_1fr_1fr_100px_50px] gap-3 items-center hover:bg-neutral-50/60 transition-colors">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveLink("column1Links", idx, "up")}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === (config.column1Links?.length || 0) - 1}
                    onClick={() => moveLink("column1Links", idx, "down")}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-neutral-400 font-mono ml-1">{idx + 1}</span>
                </div>

                {/* Label Input */}
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink("column1Links", idx, "label", e.target.value)}
                  placeholder="e.g. Warranty"
                  className="w-full text-xs p-2 bg-white border border-neutral-200 rounded focus:outline-none focus:border-brand"
                />

                {/* URL Input */}
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateLink("column1Links", idx, "url", e.target.value)}
                  placeholder="e.g. /warranty"
                  className="w-full text-xs p-2 bg-white border border-neutral-200 rounded font-mono focus:outline-none focus:border-brand"
                />

                {/* Open In New Tab */}
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={!!link.openInNewTab}
                    onChange={(e) => updateLink("column1Links", idx, "openInNewTab", e.target.checked)}
                    className="w-4 h-4 text-brand rounded focus:ring-brand cursor-pointer"
                  />
                </div>

                {/* Delete */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeLink("column1Links", idx)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove Link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: COLUMN 3 NAVIGATION LINKS (Default: SUPPORT AND SERVICES) */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Column 3: Navigation Links
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Add, edit, reorder, or remove links in Column 3.
            </p>
          </div>

          <button
            type="button"
            onClick={() => addLink("column2Links")}
            className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">Column Title</label>
          <input
            type="text"
            value={config.column2Title || ""}
            onChange={(e) => setConfig({ ...config, column2Title: e.target.value })}
            placeholder="SUPPORT AND SERVICES"
            className="w-full max-w-md text-xs p-2.5 border border-neutral-200 rounded-lg font-bold focus:outline-none focus:border-brand"
          />
        </div>

        {/* Links Table */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="bg-neutral-50 px-4 py-2.5 text-[11px] font-bold text-neutral-600 grid grid-cols-[80px_1fr_1fr_100px_50px] gap-3 items-center">
            <span>Order</span>
            <span>Link Label</span>
            <span>Destination URL</span>
            <span className="text-center">New Tab</span>
            <span className="text-center">Action</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {config.column2Links?.map((link, idx) => (
              <div key={idx} className="p-3 grid grid-cols-[80px_1fr_1fr_100px_50px] gap-3 items-center hover:bg-neutral-50/60 transition-colors">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveLink("column2Links", idx, "up")}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === (config.column2Links?.length || 0) - 1}
                    onClick={() => moveLink("column2Links", idx, "down")}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-neutral-400 font-mono ml-1">{idx + 1}</span>
                </div>

                {/* Label Input */}
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink("column2Links", idx, "label", e.target.value)}
                  placeholder="e.g. About us"
                  className="w-full text-xs p-2 bg-white border border-neutral-200 rounded focus:outline-none focus:border-brand"
                />

                {/* URL Input */}
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateLink("column2Links", idx, "url", e.target.value)}
                  placeholder="e.g. /about-us"
                  className="w-full text-xs p-2 bg-white border border-neutral-200 rounded font-mono focus:outline-none focus:border-brand"
                />

                {/* Open In New Tab */}
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={!!link.openInNewTab}
                    onChange={(e) => updateLink("column2Links", idx, "openInNewTab", e.target.checked)}
                    className="w-4 h-4 text-brand rounded focus:ring-brand cursor-pointer"
                  />
                </div>

                {/* Delete */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeLink("column2Links", idx)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove Link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: COLUMN 4 NEWSLETTER (SUBSCRIBE US) */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-neutral-100 pb-4">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Column 4: Newsletter Subscription
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Configure the newsletter signup title, promotional subtitle, and input placeholder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Section Title</label>
            <input
              type="text"
              value={config.newsletterTitle || ""}
              onChange={(e) => setConfig({ ...config, newsletterTitle: e.target.value })}
              placeholder="SUBSCRIBE US"
              className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg font-bold focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Input Placeholder</label>
            <input
              type="text"
              value={config.newsletterPlaceholder || ""}
              onChange={(e) => setConfig({ ...config, newsletterPlaceholder: e.target.value })}
              placeholder="Enter your email address"
              className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Helper / Promo Subtitle</label>
            <input
              type="text"
              value={config.newsletterSubtitle || ""}
              onChange={(e) => setConfig({ ...config, newsletterSubtitle: e.target.value })}
              placeholder="Get updates on new riding gear arrivals..."
              className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: SUB-FOOTER COPYRIGHT & LEGAL LINKS */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              Sub-Footer Bar: Copyright & Legal Policies
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Customize the copyright line and legal policy links displayed at the bottom of every page.
            </p>
          </div>

          <button
            type="button"
            onClick={() => addLink("bottomLinks")}
            className="px-3 py-1.5 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Legal Link</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Copyright Line Text (Use <code className="bg-neutral-100 text-brand px-1 py-0.5 rounded">{"{year}"}</code> to automatically display the current year)
          </label>
          <input
            type="text"
            value={config.copyrightText || ""}
            onChange={(e) => setConfig({ ...config, copyrightText: e.target.value })}
            placeholder="© {year} MotoHive Media Pvt. Ltd. (Store4Riders). All rights reserved."
            className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg font-mono focus:outline-none focus:border-brand"
          />
        </div>

        {/* Bottom Links Table */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="bg-neutral-50 px-4 py-2.5 text-[11px] font-bold text-neutral-600 grid grid-cols-[80px_1fr_1fr_100px_50px] gap-3 items-center">
            <span>Order</span>
            <span>Link Label</span>
            <span>Destination URL</span>
            <span className="text-center">New Tab</span>
            <span className="text-center">Action</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {config.bottomLinks?.map((link, idx) => (
              <div key={idx} className="p-3 grid grid-cols-[80px_1fr_1fr_100px_50px] gap-3 items-center hover:bg-neutral-50/60 transition-colors">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveLink("bottomLinks", idx, "up")}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === (config.bottomLinks?.length || 0) - 1}
                    onClick={() => moveLink("bottomLinks", idx, "down")}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-neutral-400 font-mono ml-1">{idx + 1}</span>
                </div>

                {/* Label Input */}
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink("bottomLinks", idx, "label", e.target.value)}
                  placeholder="e.g. Privacy Policy"
                  className="w-full text-xs p-2 bg-white border border-neutral-200 rounded focus:outline-none focus:border-brand"
                />

                {/* URL Input */}
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateLink("bottomLinks", idx, "url", e.target.value)}
                  placeholder="e.g. /privacy"
                  className="w-full text-xs p-2 bg-white border border-neutral-200 rounded font-mono focus:outline-none focus:border-brand"
                />

                {/* Open In New Tab */}
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={!!link.openInNewTab}
                    onChange={(e) => updateLink("bottomLinks", idx, "openInNewTab", e.target.checked)}
                    className="w-4 h-4 text-brand rounded focus:ring-brand cursor-pointer"
                  />
                </div>

                {/* Delete */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeLink("bottomLinks", idx)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove Link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Floating Save Button Bar */}
      <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-neutral-200 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Changes are validated and update the live storefront footer immediately on save.</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 text-neutral-600 hover:text-red-600 transition-colors cursor-pointer"
          >
            Reset Defaults
          </button>

          <Button
            onClick={() => handleSave()}
            disabled={saving}
            className="bg-brand hover:bg-brand/90 text-white text-xs px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Footer Changes</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AdminFooterSettings;
