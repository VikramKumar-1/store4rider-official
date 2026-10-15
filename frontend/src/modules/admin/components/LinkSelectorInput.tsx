"use client";

import React, { useState } from "react";
import { ProductCategoryPicker, SelectedItemData } from "./ProductCategoryPicker";
import { Search, Link as LinkIcon, X, Check } from "lucide-react";

interface LinkSelectorInputProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  onAutoFill?: (data: {
    title?: string;
    priceFormatted?: string;
    imageUrl?: string;
    categoryName?: string;
  }) => void;
  placeholder?: string;
  hint?: string;
  mode?: "category-only" | "product-only" | "all";
  buttonLabel?: string;
}

export function LinkSelectorInput({
  label,
  value,
  onChange,
  onAutoFill,
  placeholder,
  hint,
  mode = "all",
  buttonLabel,
}: LinkSelectorInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<SelectedItemData | null>(null);

  const effectiveLabel =
    label !== undefined
      ? label
      : mode === "category-only"
      ? "Category Destination Link"
      : "Destination Link";

  const effectiveButtonLabel =
    buttonLabel ||
    (mode === "category-only"
      ? "Browse Categories"
      : mode === "product-only"
      ? "Browse Products"
      : "Browse Catalog");

  const effectivePlaceholder =
    placeholder ||
    (mode === "category-only"
      ? "e.g. /motorcycle-helmets or /riding-gear/motorcycle-riding-gloves"
      : "e.g. /motorcycle-helmets or /products/axor-apex-helmet");

  const effectiveHint =
    hint !== undefined
      ? hint
      : mode === "category-only"
      ? "Click 'Browse Categories' to select any store category, or enter a category URL."
      : "Click 'Browse Catalog' to select any store category or product, or enter a URL manually.";

  const handleSelect = (item: SelectedItemData) => {
    setSelectedMeta(item);
    onChange(item.linkUrl);

    if (onAutoFill) {
      onAutoFill({
        title: item.title,
        priceFormatted: item.priceFormatted,
        imageUrl: item.imageUrl,
        categoryName: item.categoryName,
      });
    }
  };

  return (
    <div className="space-y-1">
      {effectiveLabel && (
        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
          {effectiveLabel}
        </label>
      )}

      {/* Input Group */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <LinkIcon size={14} />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={effectivePlaceholder}
            className="w-full bg-white border border-slate-300 text-slate-800 text-xs pl-8 pr-8 py-2 rounded-md focus:outline-none focus:border-brand font-mono shadow-2xs placeholder:text-slate-400 placeholder:font-sans"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear input"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-md text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-2xs"
        >
          <Search size={14} className="text-brand" />
          <span>{effectiveButtonLabel}</span>
        </button>
      </div>

      {/* Selected Item Notification Badge if selected */}
      {selectedMeta && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold text-emerald-800 shrink-0">Selected:</span>
            <span className="truncate font-semibold">{selectedMeta.title}</span>
            {selectedMeta.sku && (
              <span className="text-[10px] bg-white text-slate-700 px-1.5 py-0.5 rounded font-mono border border-emerald-200 shrink-0">
                {selectedMeta.sku}
              </span>
            )}
            {selectedMeta.priceFormatted && (
              <span className="text-[11px] text-emerald-700 font-bold shrink-0">
                {selectedMeta.priceFormatted}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelectedMeta(null)}
            className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer"
            title="Dismiss badge"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {effectiveHint && !selectedMeta && (
        <p className="text-[11px] text-slate-500">{effectiveHint}</p>
      )}

      {/* Modal Picker */}
      <ProductCategoryPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        mode={mode}
      />
    </div>
  );
}
