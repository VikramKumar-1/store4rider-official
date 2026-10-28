"use client";

import React, { useMemo, useState } from "react";
import { Sliders, Plus, Trash2, Shield, Package, Wrench, Check, X } from "lucide-react";
import { SearchableSelect, Option } from "@/components/ui/SearchableSelect";
import Button from "@/components/ui/Button";
import { useProductFormContext } from "../ProductFormContext";

const STANDARD_GENDER_OPTIONS = ["Men", "Women", "Unisex"];

export function ProductSpecsTab() {
  const {
    customAttributes,
    setCustomAttributes,
    brand,
    setBrand,
    brands,
    setIsAddBrandOpen,
    setNewBrandName,
    setNewBrandSlug,
    setNewBrandLogo,
    setNewBrandShowInMenu,
    setNewBrandMenuGroup,
    gender,
    setGender,
    shippingFee,
    setShippingFee,
    attributeSetCode,
    setAttributeSetCode,
    activeTemplate,
    currentSpecDefinition,
    categoryCustomSpecDef,
    selectedCategoryNode,
    getAttr,
    setAttr,
    additionalCustomAttributes,
  } = useProductFormContext();

  const [customGenderInput, setCustomGenderInput] = useState("");

  const selectedGenders = useMemo(() => {
    if (!gender) return [];
    return gender
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
  }, [gender]);

  const toggleGender = (val: string) => {
    const exists = selectedGenders.some((g) => g.toLowerCase() === val.toLowerCase());
    let updated: string[];
    if (exists) {
      updated = selectedGenders.filter((g) => g.toLowerCase() !== val.toLowerCase());
    } else {
      updated = [...selectedGenders, val];
    }
    setGender(updated.join(", "));
  };

  const handleAddCustomGender = () => {
    const trimmed = customGenderInput.trim();
    if (!trimmed) return;
    if (!selectedGenders.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...selectedGenders, trimmed];
      setGender(updated.join(", "));
    }
    setCustomGenderInput("");
  };

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

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Sliders className="text-brand" size={18} />
              Product Specifications & Attributes
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Accurate, category-specific motorcycle attributes stored in MongoDB. Choose presets or enter custom
              values. All data syncs directly with the product catalog.
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
            {customAttributes.length} Specifications Configured
          </span>
        </div>
      </div>

      {/* 1. Core Attributes Card */}
      <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Core Attributes</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Brand Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Brand <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={openNewBrandModal}
                className="text-[11px] text-brand font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Plus size={11} />
                + New Brand
              </button>
            </div>
            <SearchableSelect
              options={brandOptions}
              value={brand}
              onChange={(val: string) => setBrand(val)}
              allowCustom
              placeholder="Search or Select Brand..."
              className="w-full text-xs"
            />
            <p className="text-[10px] text-slate-400 mt-1">Synced with Tab 1. Select from database brands.</p>
          </div>

          {/* Rider Gender / Fit (Multi-Select) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Gender / Rider Fit
                {selectedGenders.length > 0 && (
                  <span className="ml-1 text-[11px] font-bold text-brand">
                    ({selectedGenders.length} selected)
                  </span>
                )}
              </label>
              {selectedGenders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setGender("")}
                  className="text-[10px] text-slate-400 hover:text-red-500 font-medium cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Quick multi-select toggle pills */}
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_GENDER_OPTIONS.map((opt) => {
                const isSelected = selectedGenders.some((g) => g.toLowerCase() === opt.toLowerCase());
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleGender(opt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                      isSelected
                        ? "bg-brand text-white border-brand shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                    }`}
                  >
                    {isSelected && <Check size={12} className="stroke-[3]" />}
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom tags if admin added any non-standard fits */}
            {selectedGenders.some((g) => !STANDARD_GENDER_OPTIONS.some((opt) => opt.toLowerCase() === g.toLowerCase())) && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {selectedGenders
                  .filter((g) => !STANDARD_GENDER_OPTIONS.some((opt) => opt.toLowerCase() === g.toLowerCase()))
                  .map((customTag) => (
                    <span
                      key={customTag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand/10 text-brand border border-brand/20"
                    >
                      <span>{customTag}</span>
                      <button
                        type="button"
                        onClick={() => toggleGender(customTag)}
                        className="hover:text-red-600 cursor-pointer p-0.5"
                        title={`Remove ${customTag}`}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
              </div>
            )}

            {/* Optional Custom Fit Input */}
            <div className="flex items-center gap-1 pt-0.5">
              <input
                type="text"
                value={customGenderInput}
                onChange={(e) => setCustomGenderInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomGender();
                  }
                }}
                placeholder="+ Custom fit (e.g. Youth)"
                className="w-full px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-slate-400"
              />
              {customGenderInput.trim() && (
                <button
                  type="button"
                  onClick={handleAddCustomGender}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-black text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors"
                >
                  Add
                </button>
              )}
            </div>

            <p className="text-[10px] text-slate-400">
              {selectedGenders.length > 0 ? (
                <span>Tagged: <strong className="text-slate-700">{selectedGenders.join(", ")}</strong></span>
              ) : (
                "Select one or more rider fits (e.g. Men, Women)"
              )}
            </p>
          </div>

          {/* Custom Shipping Fee Override */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Shipping Fee Override (₹)</label>
            <input
              type="number"
              min="0"
              value={shippingFee}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
              }}
              onChange={(e) => setShippingFee(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
              placeholder="Optional (e.g. 150)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <p className="text-[10px] text-slate-400 mt-1">Leave blank for default shipping rules</p>
          </div>

          {/* Specification Category Template Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Category Template</label>
              {categoryCustomSpecDef && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Custom Template
                </span>
              )}
            </div>
            <select
              value={attributeSetCode || activeTemplate}
              onChange={(e) => setAttributeSetCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {categoryCustomSpecDef && (
                <option value="CategoryCustom">
                  ⭐ {selectedCategoryNode?.name || "Category"} (Custom Category Template)
                </option>
              )}
              <option value="Helmets">Helmets (Full Face, Modular, Visors)</option>
              <option value="Jackets">Riding Jackets, Pants, Suits & Armor</option>
              <option value="Gloves">Riding Gloves (Full Gauntlet, Short Cuff)</option>
              <option value="Boots">Riding Boots & Footwear</option>
              <option value="Saddle Bag">Bags & Luggage (Saddle, Tank, Tail Bags)</option>
              <option value="Chain Lubes / Liquids">Chain Lubes, Oils & Bike Care</option>
              <option value="Spares, Accessories, Exhausts">Bike Spares, Exhausts, Mounts & Guards</option>
              <option value="Communicator">Bluetooth Communicators & Gadgets</option>
              <option value="Default">General / Other Specifications</option>
            </select>
            {categoryCustomSpecDef && (attributeSetCode === "CategoryCustom" || !attributeSetCode) ? (
              <p className="text-[10px] text-emerald-600 font-medium mt-1">
                ✓ Using custom template defined in Categories Manager ({categoryCustomSpecDef.fields?.length || 0} specs)
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">Auto-detected from store category or choose preset</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Category-Specific Accurate Technical Specifications */}
      {currentSpecDefinition && (
        <div className="p-5 bg-gradient-to-b from-slate-50/70 to-white rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand/10 text-brand rounded-lg">
                {currentSpecDefinition.icon === "shield" && <Shield size={18} />}
                {currentSpecDefinition.icon === "package" && <Package size={18} />}
                {currentSpecDefinition.icon === "wrench" && <Wrench size={18} />}
                {currentSpecDefinition.icon === "sliders" && <Sliders size={18} />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{currentSpecDefinition.title}</h4>
                <p className="text-xs text-slate-500">{currentSpecDefinition.subtitle}</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Click any chip to set value or type custom
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSpecDefinition.fields.map((field: any) => {
              const currentValue = getAttr(field.key);
              return (
                <div
                  key={field.key}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">{field.label}</label>
                    {currentValue && (
                      <button
                        type="button"
                        onClick={() => setAttr(field.key, "")}
                        className="text-[10px] text-slate-400 hover:text-red-500 cursor-pointer font-medium"
                        title="Clear this field"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => setAttr(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  {/* Quick preset chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {field.presets.map((preset: string) => {
                      const isSelected = currentValue === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAttr(field.key, preset)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-brand text-white border-brand font-semibold shadow-xs"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                          }`}
                        >
                          {isSelected ? `✓ ${preset}` : preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Additional & Custom Specifications Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Additional & Custom Specifications</h4>
            <p className="text-xs text-slate-500">
              Extra technical specifications, legacy database values, or custom fields.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCustomAttributes((prev) => [...prev, { key: "", value: "" }])}
            className="text-xs flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Custom Specification</span>
          </Button>
        </div>

        {additionalCustomAttributes.length === 0 ? (
          <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-medium text-slate-500">
              No extra custom specifications needed. All primary category specifications are configured above.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Click <strong>+ Add Custom Specification</strong> if you wish to add a custom attribute (e.g. Warranty,
              Color, Care Instructions).
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            <div className="bg-slate-50 px-4 py-2.5 grid grid-cols-12 gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="col-span-4 sm:col-span-4">Specification Name</span>
              <span className="col-span-7 sm:col-span-7">Value</span>
              <span className="col-span-1 sm:col-span-1 text-right">Action</span>
            </div>
            {additionalCustomAttributes.map((attr, idx) => (
              <div
                key={idx}
                className="p-3 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/50 transition-colors"
              >
                <div className="col-span-4 sm:col-span-4">
                  <input
                    type="text"
                    value={attr.key}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomAttributes((prev) =>
                        prev.map((item) => (item === attr ? { ...item, key: val } : item))
                      );
                    }}
                    placeholder="e.g. Warranty / Material"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div className="col-span-7 sm:col-span-7">
                  <input
                    type="text"
                    value={attr.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomAttributes((prev) =>
                        prev.map((item) => (item === attr ? { ...item, value: val } : item))
                      );
                    }}
                    placeholder="e.g. 2 Years Manufacturer Warranty"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div className="col-span-1 sm:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => setCustomAttributes((prev) => prev.filter((item) => item !== attr))}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete specification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
