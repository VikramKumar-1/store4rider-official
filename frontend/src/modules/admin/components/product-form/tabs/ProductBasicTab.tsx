"use client";

import React from "react";
import { Layers, Plus } from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ModernCategorySelect } from "@/components/ui/ModernCategorySelect";
import { useProductFormContext } from "../ProductFormContext";
import { detectAttributeSetFromCategory } from "../product-specs.constants";

export function ProductBasicTab() {
  const {
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
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Motul C2 Chain Lube 400ml / Axor Apex Helmet"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            SKU (Stock Keeping Unit) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            placeholder="e.g. MOT-C2-400ML / AX-APEX-01"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            URL Key / Slug (SEO Route)
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="Leave blank to auto-generate from name"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
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
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="">-- Select Brand --</option>
              {brands.map((b) => (
                <option key={b._id} value={b.name}>
                  {b.name}
                </option>
              ))}
              {brand && !brands.some((b) => b.name.toLowerCase() === brand.toLowerCase()) && (
                <option value={brand}>{brand} (Custom)</option>
              )}
            </select>
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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Store Category <span className="text-red-500">*</span>
          </label>
          <ModernCategorySelect
            value={categoryId}
            onChange={(catVal) => {
              setCategoryId(catVal);
              if (!attributeSetCode || attributeSetCode === "Default") {
                const detected = detectAttributeSetFromCategory(catVal, categoryTree);
                if (detected && detected !== "Default") {
                  setAttributeSetCode(detected);
                }
              }
            }}
            dbCategories={categoryTree}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Searchable megamenu & database categories (Helmets, Riding Gear, Luggage, Bike Accessories, Care).
          </p>
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
