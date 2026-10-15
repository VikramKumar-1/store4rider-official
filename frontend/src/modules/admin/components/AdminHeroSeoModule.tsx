"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useHomepageConfig, useUpdateHeroAndSeo } from "@/core/hooks/useHomepage";
import { MultiImageUploadWebP } from "./MultiImageUploadWebP";
import { ImageUploadWebP } from "./ImageUploadWebP";
import { LinkSelectorInput } from "./LinkSelectorInput";
import { ProductCategoryPicker, SelectedItemData } from "./ProductCategoryPicker";
import { IHeroSectionConfig, IHomepageSeoConfig } from "@store4riders/shared-types";
import {
  Loader2,
  Save,
  Globe,
  Layout,
  Eye,
  Search,
  Layers,
  ArrowRight,
  Sliders,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  PlusCircle,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

export function AdminHeroSeoModule() {
  const { data: config, isLoading, isError } = useHomepageConfig();
  const updateMutation = useUpdateHeroAndSeo();

  const [activeTab, setActiveTab] = useState<"hero" | "seo">("hero");
  const [pickerForCardIdx, setPickerForCardIdx] = useState<number | null>(null);
  const [expandedOverrideIdx, setExpandedOverrideIdx] = useState<number | null>(null);

  const [heroState, setHeroState] = useState<IHeroSectionConfig>({
    title: "RIDING GEAR THAT KEEPS YOU SAFE",
    subtitle: "BROWSE THE COLLECTION",
    ctaText: "Shop Now",
    ctaLink: "/products",
    bgImages: ["/heropic1.jpg", "/heropic2.jpg"],
    featuredCards: [
      {
        id: "prod-1",
        title: "Riding Armor Jacket",
        priceFormatted: "₹ 5,499",
        imageUrl: "/no-image.svg",
        ctaText: "SHOP NOW",
        ctaUrl: "/products/riding-armor-jacket",
      },
      {
        id: "prod-2",
        title: "Protective Rider Suit",
        priceFormatted: "₹ 12,999",
        imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80",
        ctaText: "SHOP NOW",
        ctaUrl: "/products/protective-rider-suit",
      },
    ],
  });

  const [seoState, setSeoState] = useState<IHomepageSeoConfig>({
    metaTitle: "Store4Riders | Premium Motorcycle Riding Gear & Accessories",
    metaDescription:
      "Shop certified motorcycle helmets, riding jackets, pants, boots, and safety gear in India. Genuine products, best prices & express delivery at Store4Riders.",
    metaKeywords: "motorcycle helmets, riding gear, riding jackets, riding boots, bike accessories, store4riders",
    ogTitle: "Store4Riders | Premium Motorcycle Riding Gear & Accessories",
    ogDescription: "Shop certified motorcycle helmets, riding jackets, pants, boots, and safety gear in India.",
    ogImage: "/Store4riders-Logo.jpg",
    canonicalUrl: "https://store4riders.com",
  });

  useEffect(() => {
    if (config) {
      if (config.hero) {
        setHeroState(config.hero);
      }
      if (config.seo) {
        setSeoState(config.seo);
      }
    }
  }, [config]);

  const handleProductSelectedForCard = (item: SelectedItemData) => {
    if (pickerForCardIdx === null) return;
    const updated = [...heroState.featuredCards];
    updated[pickerForCardIdx] = {
      ...updated[pickerForCardIdx],
      ctaUrl: item.linkUrl, // auto-sets /products/[slug]
      title: item.title,
      priceFormatted: item.priceFormatted || updated[pickerForCardIdx].priceFormatted,
      imageUrl: item.imageUrl || updated[pickerForCardIdx].imageUrl,
    };
    setHeroState((prev) => ({ ...prev, featuredCards: updated }));
    toast.success(`Connected "${item.title}" to Teaser #${pickerForCardIdx + 1}!`);
    setPickerForCardIdx(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroState.title.trim()) {
      toast.error("Hero headline title cannot be empty");
      return;
    }
    if (heroState.bgImages.length === 0) {
      toast.error("Please add at least one hero background image");
      return;
    }
    if (!seoState.metaTitle.trim()) {
      toast.error("SEO Meta Title is required");
      return;
    }

    await updateMutation.mutateAsync({
      hero: heroState,
      seo: seoState,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-3" />
        <p className="text-sm font-semibold">Loading Hero & SEO configuration...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm max-w-3xl">
        <p className="font-bold">Failed to load homepage configuration</p>
        <p className="text-xs mt-1">Please verify your connection and permissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Globe className="text-brand w-5 h-5" />
            Hero & SEO Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure desktop and mobile hero slider, headline typography, product cards with SKU search, and global SEO.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="inline-flex items-center justify-center gap-1.5 bg-brand hover:bg-brand/90 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-xs shadow-brand/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save size={14} />
          )}
          <span>{updateMutation.isPending ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>

      {/* Modern Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("hero")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "hero"
              ? "border-brand text-brand bg-white rounded-t-md shadow-2xs"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layout size={14} />
          <span>Hero Banner & Product Teasers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "seo"
              ? "border-brand text-brand bg-white rounded-t-md shadow-2xs"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Globe size={14} />
          <span>Website & Homepage SEO</span>
        </button>
      </div>

      {/* TAB 1: HERO CONFIGURATION */}
      {activeTab === "hero" && (
        <div className="space-y-4">
          {/* Slider Background Images */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-brand" />
                  Hero Slider Background Images
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Full-width rotating hero carousel. All uploads convert directly to WebP in browser.
                </p>
              </div>
            </div>

            <MultiImageUploadWebP
              label="Slider Images"
              values={heroState.bgImages}
              onChange={(newImages) =>
                setHeroState((prev) => ({ ...prev, bgImages: newImages }))
              }
              aspectRatio="aspect-[21/9]"
              hint="Recommended: 1920x800px or larger. Auto-converted to lossless .webp before upload."
              maxImages={6}
            />
          </div>

          {/* Hero Headlines & Shop Now Button Destination */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3.5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-brand" />
              Hero Headline & "Shop Now" Button Target
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subtitle (Top Tagline)
                </label>
                <input
                  type="text"
                  value={heroState.subtitle}
                  onChange={(e) =>
                    setHeroState((prev) => ({ ...prev, subtitle: e.target.value }))
                  }
                  placeholder="e.g. BROWSE THE COLLECTION"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-medium shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  value={heroState.ctaText}
                  onChange={(e) =>
                    setHeroState((prev) => ({ ...prev, ctaText: e.target.value }))
                  }
                  placeholder="e.g. Shop Now"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-medium shadow-2xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Main Headline (H1 Text)
                </label>
                <input
                  type="text"
                  value={heroState.title}
                  onChange={(e) =>
                    setHeroState((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. RIDING GEAR THAT KEEPS YOU SAFE"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-bold shadow-2xs"
                />
              </div>

              {/* Clarified Hero Button Destination */}
              <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Hero "Shop Now" Button Destination Link
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      When a visitor clicks the hero "Shop Now" button, they will be directed to this URL:
                    </p>
                  </div>
                </div>

                {/* Quick 1-Click Preset Pills */}
                <div className="flex flex-wrap items-center gap-1.5 py-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Quick Target:</span>
                  {[
                    { label: "All Products (/products)", url: "/products" },
                    { label: "Sale & Discounts (/sale)", url: "/sale" },
                    { label: "Helmets (/motorcycle-helmets)", url: "/motorcycle-helmets" },
                    { label: "Jackets (/riding-jackets)", url: "/riding-jackets" },
                    { label: "Gloves (/riding-gloves)", url: "/riding-gloves" },
                  ].map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setHeroState((prev) => ({ ...prev, ctaLink: preset.url }))}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-all cursor-pointer ${
                        heroState.ctaLink === preset.url
                          ? "bg-brand text-white border-brand shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:border-brand hover:bg-white"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Link Selector Input (Manual or Search Catalog) */}
                <LinkSelectorInput
                  value={heroState.ctaLink}
                  onChange={(url) =>
                    setHeroState((prev) => ({ ...prev, ctaLink: url }))
                  }
                  placeholder="e.g. /products or /sale or search category..."
                  hint="Type a link or click 'Browse Catalog' to pick any store category or product."
                />
              </div>
            </div>
          </div>

          {/* Floating Product Cards (Desktop Hero) — 100% Automated from Catalog */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand" />
                Hero Floating Product Teasers (Desktop Hero Cards)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                These 2 product cards appear on the right side of the desktop hero slider.
                Click <strong>"Select Product from Catalog"</strong> to link any product. All details (Title, Price, Image, and <code>/products/[slug]</code>) will auto-populate.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {heroState.featuredCards.map((card, idx) => {
                const isLinked = Boolean(card.ctaUrl && card.title);
                const isOverrideOpen = expandedOverrideIdx === idx;

                return (
                  <div
                    key={card.id || idx}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs relative"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Layers size={13} className="text-brand" />
                        Floating Teaser #{idx + 1}
                      </span>
                      <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono shadow-2xs">
                        Desktop Hero
                      </span>
                    </div>

                    {/* Connected Product Card View */}
                    {isLinked ? (
                      <div className="bg-white border border-emerald-200 rounded-lg p-3 space-y-2.5 shadow-2xs">
                        <div className="flex items-start gap-3">
                          {/* Thumbnail */}
                          <div className="relative w-12 h-12 bg-slate-100 rounded-md overflow-hidden shrink-0 border border-slate-200">
                            <Image
                              src={card.imageUrl || "/no-image.svg"}
                              alt={card.title}
                              fill
                              className="object-cover"
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-900 line-clamp-1">
                              {card.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-emerald-700">
                                {card.priceFormatted}
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-slate-200">
                                CTA: {card.ctaText || "SHOP NOW"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                              <ExternalLink size={10} className="text-slate-400 shrink-0" />
                              <span className="truncate">{card.ctaUrl}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setPickerForCardIdx(idx)}
                            className="text-[11px] font-bold text-brand hover:text-brand/80 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <RefreshCw size={12} />
                            <span>Change Product (SKU / Category)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedOverrideIdx(isOverrideOpen ? null : idx)}
                            className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{isOverrideOpen ? "Hide Customization" : "Customize"}</span>
                            {isOverrideOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* No Product Linked Yet Button */
                      <div
                        onClick={() => setPickerForCardIdx(idx)}
                        className="border-2 border-dashed border-slate-300 hover:border-brand bg-white hover:bg-red-50/20 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-1.5 shadow-2xs group"
                      >
                        <div className="w-9 h-9 rounded-full bg-red-50 text-brand flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ShoppingBag size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-brand transition-colors">
                            Select Product from Store Catalog
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Search by SKU, Product Name, or Category
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Expandable Overrides */}
                    {isOverrideOpen && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Manual Customization & Overrides (Optional):
                        </p>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                            Override Display Title
                          </label>
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) => {
                              const updated = [...heroState.featuredCards];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              setHeroState((prev) => ({ ...prev, featuredCards: updated }));
                            }}
                            className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-brand font-semibold shadow-2xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Override Price
                            </label>
                            <input
                              type="text"
                              value={card.priceFormatted}
                              onChange={(e) => {
                                const updated = [...heroState.featuredCards];
                                updated[idx] = { ...updated[idx], priceFormatted: e.target.value };
                                setHeroState((prev) => ({ ...prev, featuredCards: updated }));
                              }}
                              className="w-full bg-white border border-slate-300 text-emerald-700 font-bold text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-brand shadow-2xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Button Label
                            </label>
                            <input
                              type="text"
                              value={card.ctaText}
                              onChange={(e) => {
                                const updated = [...heroState.featuredCards];
                                updated[idx] = { ...updated[idx], ctaText: e.target.value };
                                setHeroState((prev) => ({ ...prev, featuredCards: updated }));
                              }}
                              className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-brand shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Custom Image Upload */}
                        <ImageUploadWebP
                          label="Custom Image"
                          value={card.imageUrl}
                          onChange={(url) => {
                            const updated = [...heroState.featuredCards];
                            updated[idx] = { ...updated[idx], imageUrl: url };
                            setHeroState((prev) => ({ ...prev, featuredCards: updated }));
                          }}
                          aspectRatio="aspect-square"
                          hint="Browser auto-converts to WebP."
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Live Desktop Hero Visual Mockup */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Eye size={13} className="text-brand" />
                Live Teaser Card Appearance on Desktop Hero
              </span>

              <div className="flex flex-wrap gap-3 items-center justify-center py-3 bg-slate-900 rounded-lg p-3">
                {heroState.featuredCards.map((card, idx) => (
                  <div
                    key={card.id || idx}
                    className="w-36 bg-white/95 backdrop-blur-md rounded-lg p-2.5 shadow-lg border border-white/50 flex flex-col items-center text-center space-y-1.5"
                  >
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-100">
                      <Image
                        src={card.imageUrl || "/no-image.svg"}
                        alt={card.title}
                        fill
                        className="object-contain p-0.5"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-neutral-900 line-clamp-1">
                      {card.title}
                    </span>
                    <span className="text-[11px] font-bold text-brand">
                      {card.priceFormatted}
                    </span>
                    <span className="w-full py-0.5 text-[9px] font-bold bg-neutral-900 text-white rounded">
                      {card.ctaText || "SHOP NOW"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL & HOMEPAGE SEO CONFIGURATION */}
      {activeTab === "seo" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3.5">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-brand" />
                Website Meta Tags & Social Sharing
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Optimize homepage search engine ranking and OpenGraph preview for WhatsApp, Twitter, and Facebook.
              </p>
            </div>

            <div className="space-y-3">
              {/* Meta Title */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    SEO Meta Title
                  </label>
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      seoState.metaTitle.length > 60
                        ? "text-amber-600"
                        : "text-emerald-700"
                    }`}
                  >
                    {seoState.metaTitle.length} / 60 recommended
                  </span>
                </div>
                <input
                  type="text"
                  value={seoState.metaTitle}
                  onChange={(e) =>
                    setSeoState((prev) => ({ ...prev, metaTitle: e.target.value }))
                  }
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-semibold shadow-2xs"
                />
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    SEO Meta Description
                  </label>
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      seoState.metaDescription.length > 160
                        ? "text-amber-600"
                        : "text-emerald-700"
                    }`}
                  >
                    {seoState.metaDescription.length} / 160 recommended
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={seoState.metaDescription}
                  onChange={(e) =>
                    setSeoState((prev) => ({
                      ...prev,
                      metaDescription: e.target.value,
                    }))
                  }
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand resize-none shadow-2xs leading-relaxed"
                />
              </div>

              {/* Meta Keywords & Canonical */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Meta Keywords (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={seoState.metaKeywords}
                    onChange={(e) =>
                      setSeoState((prev) => ({
                        ...prev,
                        metaKeywords: e.target.value,
                      }))
                    }
                    placeholder="e.g. motorcycle helmets, riding gear, riding jackets..."
                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand shadow-2xs"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      Canonical URL
                    </label>
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Auto-Tracks Domain
                    </span>
                  </div>
                  <div className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-2.5 py-1.5 rounded-md font-mono flex items-center justify-between shadow-2xs">
                    <span>https://store4riders.com/</span>
                    <span className="text-[10px] text-slate-400 font-sans">Self-Referencing</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    The canonical tag automatically reflects your live domain to prevent duplicate content penalties.
                  </p>
                </div>
              </div>

              {/* OG Social Share Image */}
              <div className="pt-2 border-t border-slate-100">
                <ImageUploadWebP
                  label="OpenGraph Social Share Image (1200x630)"
                  value={seoState.ogImage}
                  onChange={(url) =>
                    setSeoState((prev) => ({ ...prev, ogImage: url }))
                  }
                  aspectRatio="aspect-[1.91/1]"
                  hint="Image displayed when homepage link is shared on WhatsApp, Facebook, iMessage, and Twitter."
                />
              </div>
            </div>
          </div>

          {/* Live Google Search SERP Snippet Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <Search size={13} className="text-brand" />
              Live Google Search SERP Snippet Preview
            </span>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs max-w-2xl space-y-1">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-800 font-medium">Store4Riders India</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    https://store4riders.com/
                  </span>
                </div>
              </div>

              <h3 className="text-blue-700 hover:underline font-semibold text-sm line-clamp-1 cursor-pointer pt-0.5">
                {seoState.metaTitle || "Store4Riders | Premium Motorcycle Riding Gear"}
              </h3>

              <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                {seoState.metaDescription || "Shop genuine motorcycle helmets and riding gear in India."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Product & Category Picker Modal for Floating Teaser Cards */}
      <ProductCategoryPicker
        isOpen={pickerForCardIdx !== null}
        onClose={() => setPickerForCardIdx(null)}
        onSelect={handleProductSelectedForCard}
        title={
          pickerForCardIdx !== null
            ? `Connect Product to Floating Teaser #${pickerForCardIdx + 1}`
            : "Select Product"
        }
      />
    </div>
  );
}
