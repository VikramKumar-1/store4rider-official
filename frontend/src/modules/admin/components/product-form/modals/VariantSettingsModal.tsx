"use client";

import React from "react";
import Image from "next/image";
import { Sliders, X, ImageIcon, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { useProductFormContext } from "../ProductFormContext";

export function VariantSettingsModal() {
  const {
    variantImageModalIndex,
    setVariantImageModalIndex,
    variants,
    setVariants,
    weightUnit,
    images,
    applyToAllSameColor,
    setApplyToAllSameColor,
  } = useProductFormContext();

  if (variantImageModalIndex === null || !variants[variantImageModalIndex]) {
    return null;
  }

  const currentVariant = variants[variantImageModalIndex];
  const targetColor = currentVariant?.color;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Sliders className="text-brand" size={18} />
            Variant Details: {currentVariant.sku}
          </h3>
          <button
            type="button"
            onClick={() => setVariantImageModalIndex(null)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Variant Info Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Variant SKU</span>
            <strong className="text-slate-800 font-mono">{currentVariant.sku}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Color</span>
            <strong className="text-brand">{currentVariant.color}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Size</span>
            <strong className="text-slate-800">{currentVariant.size}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Price</span>
            <strong className="text-slate-800">₹{currentVariant.price || 0}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Variant Status (Enable/Disable)
            </label>
            <select
              value={currentVariant.status || "enabled"}
              onChange={(e) => {
                const val = e.target.value as "enabled" | "disabled";
                setVariants((prev) =>
                  prev.map((v, i) => (i === variantImageModalIndex ? { ...v, status: val } : v))
                );
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand"
            >
              <option value="enabled">Enabled (Active)</option>
              <option value="disabled">Disabled (Hidden)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Temporarily hide this specific variant without deleting it.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Child Weight ({weightUnit})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={currentVariant.weight ?? ""}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
              }}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Math.max(0, Number(e.target.value));
                setVariants((prev) =>
                  prev.map((v, i) => (i === variantImageModalIndex ? { ...v, weight: val } : v))
                );
              }}
              placeholder="e.g. 1.2"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand"
            />
            <p className="text-[10px] text-slate-400 mt-1">Override parent weight for shipping calculations.</p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Visibility Options</label>
            <select
              value={currentVariant.visibility || "Catalog, Search"}
              onChange={(e) => {
                const val = e.target.value;
                setVariants((prev) =>
                  prev.map((v, i) => (i === variantImageModalIndex ? { ...v, visibility: val } : v))
                );
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand"
            >
              <option value="Catalog, Search">Catalog, Search (Searchable)</option>
              <option value="Not Visible Individually">Not Visible Individually (Child of Parent Only)</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
            <ImageIcon className="text-brand" size={16} />
            Child Image Gallery (Optional)
          </h4>
          <p className="text-[11px] text-slate-500 mb-3">
            Select images from the parent gallery to assign directly to this specific variant (or color).
          </p>

          {/* Color-Batch Checkbox */}
          {currentVariant.color && (
            <label className="flex items-start gap-2.5 p-2.5 mb-3 bg-brand/5 border border-brand/20 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={applyToAllSameColor}
                onChange={(e) => setApplyToAllSameColor(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Apply images to ALL variants with color &quot;{currentVariant.color}&quot;
                </span>
              </div>
            </label>
          )}

          {images.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
              No images in parent gallery yet. Add images in the Media tab first.
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {images.map((img) => {
                const isSelected =
                  currentVariant.imageUrl === img.url ||
                  currentVariant.images?.some((i) => i.url === img.url);

                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      setVariants((prev) =>
                        prev.map((v, i) => {
                          if (
                            i === variantImageModalIndex ||
                            (applyToAllSameColor &&
                              targetColor &&
                              v.color.toLowerCase() === targetColor.toLowerCase())
                          ) {
                            const currentImages = v.images || [];
                            const alreadyHas = currentImages.some((ci) => ci.url === img.url);
                            const newImages = alreadyHas
                              ? currentImages.filter((ci) => ci.url !== img.url)
                              : [...currentImages, { id: img.id, url: img.url, altText: img.altText }];
                            return {
                              ...v,
                              imageUrl: newImages.length > 0 ? newImages[0].url : undefined,
                              images: newImages,
                            };
                          }
                          return v;
                        })
                      );
                    }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${
                      isSelected ? "border-brand ring-2 ring-brand/30" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || "Gallery"}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-brand/20 flex items-center justify-center">
                        <div className="bg-brand text-white rounded-full p-1">
                          <Check size={14} />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setVariants((prev) =>
                prev.map((v, i) => {
                  if (
                    i === variantImageModalIndex ||
                    (applyToAllSameColor &&
                      targetColor &&
                      v.color.toLowerCase() === targetColor.toLowerCase())
                  ) {
                    return { ...v, imageUrl: undefined, images: [] };
                  }
                  return v;
                })
              );
            }}
            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
          >
            Clear Images
          </Button>
          <Button
            type="button"
            onClick={() => setVariantImageModalIndex(null)}
            className="text-xs bg-brand text-white px-6"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
