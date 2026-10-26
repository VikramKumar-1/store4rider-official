"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Layers, Plus, Sliders, FolderTree, ChevronDown, ChevronUp, Sparkles, CheckCircle2, AlertCircle, Loader2, HelpCircle, Info, Globe, Edit2, Check, RefreshCw } from "lucide-react";
import { slugify } from "@store4riders/shared-utils";
import { SearchableSelect, Option } from "@/components/ui/SearchableSelect";
import { ModernCategorySelect, MultiCategorySelect } from "@/components/ui/ModernCategorySelect";
import { useProductFormContext } from "../ProductFormContext";
import { detectAttributeSetFromCategory } from "../product-specs.constants";
import { apiClient } from "@/core/api/client";
import { toast } from "sonner";

export function ProductBasicTab() {
  const [showMultiCategoryDrawer, setShowMultiCategoryDrawer] = useState(false);
  const [skuStatus, setSkuStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [conflictingProduct, setConflictingProduct] = useState<{ name: string; sku: string } | null>(null);
  const [showSkuInfo, setShowSkuInfo] = useState<boolean>(false);

  // Real-time URL Slug state
  const [isSlugCustomized, setIsSlugCustomized] = useState<boolean>(false);
  const [isEditingSlug, setIsEditingSlug] = useState<boolean>(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [conflictingSlugProduct, setConflictingSlugProduct] = useState<{ name: string; slug: string } | null>(null);
  const [showSlugInfo, setShowSlugInfo] = useState<boolean>(false);

  const {
    existingProduct,
    name,
    setName,
    sku,
    setSku,
    slug,
    setSlug,
    brand,
    setBrand,
    brands,
    setIsAddBrandOpen,
    setNewBrandName,
    setNewBrandSlug,
    setNewBrandLogo,
    setNewBrandShowInMenu,
    setNewBrandMenuGroup,
    categoryId,
    setCategoryId,
    categorySlugs,
    setCategorySlugs,
    applyCategoryBlueprint,
    activeBlueprint,
    categoryTree,
    attributeSetCode,
    setAttributeSetCode,
    productType,
    setProductType,
    status,
    setStatus,
    visibility,
    setVisibility,
    weight,
    setWeight,
    weightUnit,
    setWeightUnit,
    countryOfManufacture,
    setCountryOfManufacture,
    isFeatured,
    setIsFeatured,
    showFeaturedBadge,
    setShowFeaturedBadge,
    isFreeShipping,
    setIsFreeShipping,
  } = useProductFormContext();

  const openNewBrandModal = () => {
    setNewBrandName("");
    setNewBrandSlug("");
    setNewBrandLogo("");
    setNewBrandShowInMenu(true);
    setNewBrandMenuGroup("Featured Brands");
    setIsAddBrandOpen(true);
  };

  const brandOptions: Option[] = useMemo(() => {
    const list: Option[] = [
      { label: "-- Select Brand --", value: "", description: "Choose manufacturer" },
      ...brands.map((b) => ({
        label: b.name,
        value: b.name,
        badge: b.menuGroup || undefined,
        description: b.slug ? `/${b.slug}` : undefined,
      })),
    ];
    if (brand && !brands.some((b) => b.name.toLowerCase() === brand.toLowerCase())) {
      list.push({ label: `${brand} (Custom)`, value: brand, badge: "Custom" });
    }
    return list;
  }, [brands, brand]);

  // Live real-time SKU availability & uniqueness check
  useEffect(() => {
    const trimmed = sku.trim();
    if (!trimmed || trimmed.length < 3) {
      setSkuStatus("idle");
      setConflictingProduct(null);
      return;
    }

    // In edit mode: if SKU is identical to the existing product's current SKU, it is valid for this product
    if (existingProduct && (existingProduct.sku || "").toUpperCase() === trimmed.toUpperCase()) {
      setSkuStatus("available");
      setConflictingProduct(null);
      return;
    }

    setSkuStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const excludeParam = existingProduct?._id ? `&excludeId=${existingProduct._id}` : "";
        const res = await apiClient.get<{ success: boolean; data: { available: boolean; existingProduct?: { name: string; sku: string } } }>(
          `/products/check-sku?sku=${encodeURIComponent(trimmed)}${excludeParam}`
        );
        const data = res.data?.data;
        if (data?.available === false) {
          setSkuStatus("taken");
          setConflictingProduct(data.existingProduct || null);
        } else {
          setSkuStatus("available");
          setConflictingProduct(null);
        }
      } catch (e) {
        setSkuStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [sku, existingProduct]);

  // Smart SKU Sanitizer (Enforces uppercase, replaces spaces/underscores with hyphens, removes special chars, max 30 chars)
  const handleSkuChange = (val: string) => {
    const sanitized = val
      .toUpperCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^A-Z0-9-]/g, "")
      .replace(/-+/g, "-")
      .slice(0, 30);
    setSku(sanitized);
  };

    // 1-Click Auto-Generate industry standard SKU from Brand + Name + Salt
  const handleAutoGenerateSku = () => {
    let brandPrefix = (brand || "S4R")
      .trim()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 4);
    if (brandPrefix.length < 2) brandPrefix = "S4R";

    const cleanWords = (name || "PROD")
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .toUpperCase()
      .split(/\s+/)
      .filter(Boolean);

    let modelPart = cleanWords.slice(0, 2).map((w) => w.slice(0, 4)).join("-");
    if (!modelPart) modelPart = "ITEM";

    const randomSalt = Math.floor(100 + Math.random() * 900);
    const generated = `${brandPrefix}-${modelPart}-${randomSalt}`.slice(0, 24);
    setSku(generated);
    toast.success(`Generated standard SKU: ${generated}`);
  };

  // Title change: auto-updates slug immediately in real-time unless customized
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugCustomized) {
      setSlug(slugify(val));
    }
  };

  // Manual slug change: sanitizes and flags as customized
  const handleSlugChange = (val: string) => {
    const sanitized = val
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    setSlug(sanitized);
    setIsSlugCustomized(true);
  };

  // 1-Click Re-sync slug from product title
  const handleSyncSlugFromTitle = () => {
    const autoSlug = slugify(name || "product");
    setSlug(autoSlug);
    setIsSlugCustomized(false);
    toast.success(`Re-synced slug with product title: "${autoSlug}"`);
  };

  // 1-Click Auto-fix duplicate slug (appends -1, -2, etc.)
  const handleAutoFixSlug = () => {
    const match = slug.match(/^(.*?)-(\d+)$/);
    let nextSlug = "";
    if (match) {
      const base = match[1];
      const num = parseInt(match[2], 10) + 1;
      nextSlug = `${base}-${num}`;
    } else {
      nextSlug = `${slug}-1`;
    }
    setSlug(nextSlug);
    setIsSlugCustomized(true);
    toast.success(`Updated slug to "${nextSlug}"`);
  };

  // Live real-time Slug availability & uniqueness check
  useEffect(() => {
    const trimmed = slug.trim();
    if (!trimmed || trimmed.length < 2) {
      setSlugStatus("idle");
      setConflictingSlugProduct(null);
      return;
    }

    // In edit mode: if slug matches the existing product's slug, it's valid for this product
    if (existingProduct && (existingProduct.slug || "").toLowerCase() === trimmed.toLowerCase()) {
      setSlugStatus("available");
      setConflictingSlugProduct(null);
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const excludeParam = existingProduct?._id ? `&excludeId=${existingProduct._id}` : "";
        const res = await apiClient.get<{ success: boolean; data: { available: boolean; existingProduct?: { name: string; slug: string } } }>(
          `/products/check-slug?slug=${encodeURIComponent(trimmed)}${excludeParam}`
        );
        const data = res.data?.data;
        if (data?.available === false) {
          setSlugStatus("taken");
          setConflictingSlugProduct(data.existingProduct || null);
        } else {
          setSlugStatus("available");
          setConflictingSlugProduct(null);
        }
      } catch (e) {
        setSlugStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug, existingProduct]);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
      <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Layers className="text-brand" size={18} />
        Product Identity & Categorization
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Motul C2 Chain Lube 400ml / Axor Apex Helmet"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <div className="flex items-center gap-1.5">
              <label className="block text-sm font-medium text-slate-700">
                SKU (Stock Keeping Unit) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowSkuInfo(!showSkuInfo)}
                className="text-slate-400 hover:text-brand transition-colors p-0.5 cursor-pointer"
                title="What is SKU & Industry standards?"
              >
                <HelpCircle size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono font-medium ${
                sku.length === 0 ? "text-slate-400" :
                sku.length < 6 ? "text-amber-600" :
                sku.length <= 16 ? "text-emerald-600" :
                sku.length < 30 ? "text-blue-600" : "text-red-600 font-bold"
              }`}>
                {sku.length}/30 chars
              </span>
              <button
                type="button"
                onClick={handleAutoGenerateSku}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand/80 bg-brand/5 hover:bg-brand/10 border border-brand/20 px-2 py-0.5 rounded transition-colors cursor-pointer"
                title="Auto-generate a clean, unique industry-standard SKU from Brand & Product Name"
              >
                <Sparkles size={11} />
                <span>Auto-Generate</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={sku}
              onChange={(e) => handleSkuChange(e.target.value)}
              maxLength={30}
              placeholder="e.g. AXOR-APEX-BLK-M / MOT-C2-400ML"
              className={`w-full px-3.5 py-2.5 pr-9 border rounded-lg text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 transition-colors ${
                skuStatus === "taken"
                  ? "border-red-400 bg-red-50/30 text-red-900 focus:ring-red-400"
                  : skuStatus === "available"
                  ? "border-emerald-400 bg-emerald-50/20 text-slate-800 focus:ring-emerald-400"
                  : "border-slate-300 text-slate-800 focus:ring-brand focus:border-transparent"
              }`}
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {skuStatus === "checking" && <Loader2 size={16} className="text-slate-400 animate-spin" />}
              {skuStatus === "available" && <CheckCircle2 size={16} className="text-emerald-600" />}
              {skuStatus === "taken" && <AlertCircle size={16} className="text-red-600" />}
            </div>
          </div>

          {/* Real-time Uniqueness & Length Feedback */}
          <div className="mt-1.5 space-y-1">
            {skuStatus === "taken" && conflictingProduct && (
              <p className="text-xs text-red-600 flex items-center gap-1 font-medium bg-red-50 border border-red-200 p-2 rounded-lg">
                <AlertCircle size={14} className="shrink-0" />
                <span>
                  <strong>SKU Already In Use:</strong> &quot;{conflictingProduct.sku}&quot; is already assigned to <strong>{conflictingProduct.name}</strong>. SKU must be 100% unique.
                </span>
              </p>
            )}

            {skuStatus === "available" && sku.length >= 3 && (
              <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 size={12} className="shrink-0" />
                <span>✓ Unique & Available in catalog</span>
                {sku.length >= 8 && sku.length <= 16 && (
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">
                    Ideal Length (8-16 chars)
                  </span>
                )}
              </p>
            )}

            {sku.length > 0 && sku.length < 6 && (
              <p className="text-[11px] text-amber-600">
                Tip: Industry standard SKU is usually 8–16 characters (e.g. BRAND-MODEL-SIZE).
              </p>
            )}
          </div>

          {/* Collapsible Industry Standard SKU Guidance Box */}
          {showSkuInfo && (
            <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-brand">
                  <Info size={14} />
                  SKU Industry Standards & Rules
                </span>
                <button
                  type="button"
                  onClick={() => setShowSkuInfo(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>
              <ul className="space-y-1.5 text-[11px] leading-relaxed list-disc pl-4 text-slate-600">
                <li>
                  <strong>Admin kya type karega?</strong> Brand name, product model, color/variant ya volume ka short code. E.g. <span className="font-mono bg-white px-1 py-0.5 border rounded">AXOR-APEX-BLK-M</span> ya <span className="font-mono bg-white px-1 py-0.5 border rounded">MOT-C2-400ML</span>.
                </li>
                <li>
                  <strong>Industry Standard Length:</strong> <strong>8 to 16 characters</strong> sabse ideal hoti hai. Maximum 30 characters tak allowed hai (30 se lamba barcode scanners aur 4x6 thermal shipping labels me fit nahi hota).
                </li>
                <li>
                  <strong>Kya ye Unique hota hai?</strong> <strong>HAAN, 100% Unique.</strong> Pure catalog me kisi dusre product ya variant ka SKU same nahi hona chahiye. System automatically duplicate SKU detect karke block kar deta hai.
                </li>
                <li>
                  <strong>Allowed Characters:</strong> Sirf <strong>A-Z</strong> (Capital Letters), <strong>0-9</strong> (Numbers), aur <strong>-</strong> (Hyphen). Spaces aur special symbols allow nahi hain.
                </li>
              </ul>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <div className="flex items-center gap-1.5">
              <label className="block text-sm font-medium text-slate-700">
                URL Key / Slug (SEO Route)
              </label>
              <button
                type="button"
                onClick={() => setShowSlugInfo(!showSlugInfo)}
                className="text-slate-400 hover:text-brand transition-colors p-0.5 cursor-pointer"
                title="SEO URL Slug Guidelines"
              >
                <HelpCircle size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isEditingSlug ? (
                <>
                  <button
                    type="button"
                    onClick={handleSyncSlugFromTitle}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-brand bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    title="Re-generate URL slug from product name"
                  >
                    <RefreshCw size={11} />
                    <span>Sync with Title</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingSlug(false)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    title="Done editing URL slug"
                  >
                    <Check size={11} />
                    <span>Done</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingSlug(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand/80 bg-brand/5 hover:bg-brand/10 border border-brand/20 px-2 py-0.5 rounded transition-colors cursor-pointer"
                  title="Customize URL slug route"
                >
                  <Edit2 size={11} />
                  <span>Edit URL Slug</span>
                </button>
              )}
            </div>
          </div>

          {/* If NOT editing: clean live route preview card */}
          {!isEditingSlug ? (
            <div
              onClick={() => setIsEditingSlug(true)}
              className={`flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg text-xs font-mono transition-colors cursor-pointer hover:bg-slate-100/70 ${
                slugStatus === "taken"
                  ? "border-red-300 bg-red-50/20 text-red-900"
                  : slugStatus === "available"
                  ? "border-emerald-300 text-slate-700"
                  : "border-slate-300 text-slate-700"
              }`}
              title="Click to edit URL slug"
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Globe size={14} className="text-slate-400 shrink-0" />
                <span className="text-slate-400 font-normal select-none">/products/</span>
                <span className="font-bold text-brand truncate">{slug || "auto-generated-from-title"}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {slugStatus === "checking" && <Loader2 size={14} className="text-slate-400 animate-spin" />}
                {slugStatus === "available" && <CheckCircle2 size={14} className="text-emerald-600" />}
                {slugStatus === "taken" && <AlertCircle size={14} className="text-red-600" />}
                <span className="text-[11px] text-slate-500 underline ml-1">Edit</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g. motul-c2-chain-lube-400ml"
                className={`w-full px-3.5 py-2.5 pr-9 border rounded-lg text-sm font-mono lowercase tracking-wide focus:outline-none focus:ring-2 transition-colors ${
                  slugStatus === "taken"
                    ? "border-red-400 bg-red-50/30 text-red-900 focus:ring-red-400"
                    : slugStatus === "available"
                    ? "border-emerald-400 bg-emerald-50/20 text-slate-800 focus:ring-emerald-400"
                    : "border-slate-300 text-slate-800 focus:ring-brand focus:border-transparent"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {slugStatus === "checking" && <Loader2 size={16} className="text-slate-400 animate-spin" />}
                {slugStatus === "available" && <CheckCircle2 size={16} className="text-emerald-600" />}
                {slugStatus === "taken" && <AlertCircle size={16} className="text-red-600" />}
              </div>
            </div>
          )}

          {/* Real-time Uniqueness Feedback & Auto-Fix */}
          <div className="mt-1.5 space-y-1">
            {slugStatus === "taken" && conflictingSlugProduct && (
              <div className="text-xs text-red-600 flex items-center justify-between font-medium bg-red-50 border border-red-200 p-2 rounded-lg gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="truncate">
                    <strong>URL Slug Already In Use:</strong> &quot;{conflictingSlugProduct.slug}&quot; is taken by <strong>{conflictingSlugProduct.name}</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFixSlug}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold shrink-0 shadow-2xs transition-colors cursor-pointer"
                  title="Auto-append suffix like -1 to make this slug unique"
                >
                  ⚡ Auto-Fix Slug
                </button>
              </div>
            )}

            {slugStatus === "available" && slug.length >= 2 && (
              <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 size={12} className="shrink-0" />
                <span>✓ Unique & Available for SEO route (/products/{slug})</span>
              </p>
            )}

            {!isEditingSlug && !isSlugCustomized && slug && (
              <p className="text-[11px] text-slate-400">
                Auto-syncing with Product Name. Click &quot;Edit URL Slug&quot; to customize.
              </p>
            )}
          </div>

          {/* Collapsible Slug SEO Guidance Box */}
          {showSlugInfo && (
            <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-brand">
                  <Info size={14} />
                  URL Key / Slug Rules & SEO Best Practices
                </span>
                <button
                  type="button"
                  onClick={() => setShowSlugInfo(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>
              <ul className="space-y-1.5 text-[11px] leading-relaxed list-disc pl-4 text-slate-600">
                <li>
                  <strong>Kya hota hai?</strong> Ye customer ke browser me product page ka web address hota hai (e.g. <span className="font-mono bg-white px-1 py-0.5 border rounded">store4riders.com/products/axor-apex-helmet</span>).
                </li>
                <li>
                  <strong>Auto-generation:</strong> Jaise hi aap product title likhte hain, ye automatically lowercase hyphens me convert ho kar set ho jata hai.
                </li>
                <li>
                  <strong>Uniqueness:</strong> Database me do products ka slug kabhi same nahi ho sakta. Agar duplicate hoga toh system turant red warning aur 1-click &quot;⚡ Auto-Fix Slug&quot; button de dega.
                </li>
                <li>
                  <strong>Allowed Characters:</strong> Sirf lowercase English letters (a-z), numbers (0-9), aur hyphens (-).
                </li>
              </ul>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Brand</label>
            <button
              type="button"
              onClick={openNewBrandModal}
              className="text-xs text-brand font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              + Add New Brand
            </button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchableSelect
                options={brandOptions}
                value={brand}
                onChange={(val: string) => setBrand(val)}
                allowCustom
                placeholder="Search or Select Brand..."
                className="w-full text-sm"
              />
            </div>
            <button
              type="button"
              onClick={openNewBrandModal}
              className="px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
              title="Create new brand with logo & submenu settings"
            >
              <Plus size={14} />
              New Brand
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Choose an existing brand or create a custom one with logo & navigation submenu settings.
          </p>
        </div>

        {/* Modern Searchable Category Dropdown */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Primary Store Category <span className="text-red-500">*</span>
            </label>
            <ModernCategorySelect
              value={categoryId}
              onChange={(catVal) => {
                setCategoryId(catVal);
                applyCategoryBlueprint(catVal);
                setCategorySlugs((prev) => Array.from(new Set([catVal, ...prev])));
              }}
              dbCategories={categoryTree}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Main store category. Auto-configures industry specs template, HSN tax code, weight unit &amp; size presets.
            </p>
          </div>

          {/* Auto-Blueprint Feedback Card */}
          {activeBlueprint && activeBlueprint.attributeSet !== "Default" && (
            <div className="flex items-start gap-2.5 p-3 bg-brand/5 border border-brand/20 rounded-lg text-xs text-slate-800">
              <Sliders size={16} className="text-brand shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-brand">Auto-Blueprint Applied: </span>
                <span className="font-semibold text-slate-700">{activeBlueprint.description}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Specs template, HSN ({activeBlueprint.defaultHsn}), and weight unit ({activeBlueprint.defaultWeightUnit}) are prefilled. You can change any of them in Pricing &amp; Specs tabs.
                </p>
              </div>
            </div>
          )}

          {/* Multi-Category Selector Accordion / Drawer */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowMultiCategoryDrawer(!showMultiCategoryDrawer)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 hover:text-brand transition-colors cursor-pointer py-1"
            >
              <span className="flex items-center gap-1.5">
                <FolderTree size={14} className="text-brand" />
                <span>Also Display in Additional Categories ({categorySlugs.filter((c) => c !== categoryId).length} additional)</span>
              </span>
              {showMultiCategoryDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showMultiCategoryDrawer && (
              <div className="mt-2 space-y-1.5 animate-in fade-in-50 duration-150">
                <p className="text-[11px] text-slate-400">
                  Tag this product into multiple submenus or clearance/deal categories. It will appear across all selected categories.
                </p>
                <MultiCategorySelect
                  values={categorySlugs}
                  onChange={setCategorySlugs}
                  dbCategories={categoryTree}
                  primaryCategory={categoryId}
                  placeholder="Search and attach secondary categories..."
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
          <SearchableSelect
            options={[
              { label: "Simple Product (Fixed size / Single unit)", value: "simple" },
              { label: "Configurable Product (Multiple sizes / colors)", value: "configurable" },
            ]}
            value={productType}
            onChange={(val: string) => setProductType(val as any)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Catalog Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            <option value="published">Published (Visible to customers)</option>
            <option value="draft">Draft (Hidden in store)</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            <option value="Catalog, Search">Catalog, Search (Default)</option>
            <option value="Catalog">Catalog Only</option>
            <option value="Search">Search Only</option>
            <option value="Not Visible Individually">Not Visible Individually (Child variant)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Weight / Volume Unit</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={weight}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
              }}
              onChange={(e) => setWeight(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
              placeholder="e.g. 1.6 or 400"
              className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <select
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value as any)}
              className="w-24 px-2 py-2.5 border border-slate-300 rounded-lg text-sm bg-white font-bold"
            >
              <option value="kg">kg</option>
              <option value="g">grams</option>
              <option value="ml">ml (Liquid)</option>
              <option value="L">Litres</option>
            </select>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Helmets in kg, lubes/sprays in ml, gear in grams.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Country of Manufacture</label>
          <input
            type="text"
            value={countryOfManufacture}
            onChange={(e) => setCountryOfManufacture(e.target.value)}
            placeholder="e.g. India, Italy, France"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition-colors">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => {
                  setIsFeatured(e.target.checked);
                  if (!e.target.checked) setShowFeaturedBadge(false);
                }}
                className="rounded text-brand focus:ring-brand h-4 w-4 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  ⭐ Mark as Featured Product
                </span>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  <strong>What this does:</strong> Pushes this product to the top (first row) of category and search
                  listings, and includes it in homepage showcase collections.
                </p>
              </div>
            </label>

            {isFeatured && (
              <div className="ml-6 pl-3 border-l-2 border-slate-200 mt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFeaturedBadge}
                    onChange={(e) => setShowFeaturedBadge(e.target.checked)}
                    className="rounded text-brand focus:ring-brand h-3.5 w-3.5 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-700">
                      Show &quot;★ FEATURED&quot; badge text on card (Optional)
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Off by default so product cards stay clean with no overlay text. Check this only if you want an
                      extra badge tag displayed over the product photo.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={isFreeShipping}
              onChange={(e) => setIsFreeShipping(e.target.checked)}
              className="rounded text-brand focus:ring-brand h-4 w-4 mt-0.5"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                🚚 Free Shipping Eligible
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Waives standard delivery charges for this product at checkout across all serviceable pincodes.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
