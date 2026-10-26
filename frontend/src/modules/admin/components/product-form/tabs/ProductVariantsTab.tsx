"use client";

import React, { useState } from "react";
import Image from "next/image";
import { GitBranch, Plus, Check, Camera, Sliders, Trash2, Ruler, ChevronDown, ChevronUp } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { useProductFormContext } from "../ProductFormContext";
import { COLOR_OPTIONS, SIZE_OPTIONS } from "../product-specs.constants";

export function ProductVariantsTab() {
  const [showSizeChartDrawer, setShowSizeChartDrawer] = useState(false);
  const {
    variants,
    setVariants,
    sku,
    basePrice,
    setVariantImageModalIndex,
    applySizePreset,
    activeBlueprint,
    sizeChart,
    setSizeChart,
  } = useProductFormContext();

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
      <datalist id="color-presets">
        {COLOR_OPTIONS.map((c) => (
          <option key={c.value} value={c.value} />
        ))}
      </datalist>
      <datalist id="size-presets">
        {SIZE_OPTIONS.map((s) => (
          <option key={s.value} value={s.value} />
        ))}
      </datalist>

      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <GitBranch className="text-brand" size={18} />
            Child Variants (Sizes, Volumes in ml/L, Colors & Child Images)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage variants for this configurable product. Real database variants only.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Category Suggested Sizes Button */}
          {activeBlueprint && activeBlueprint.suggestedSizes && activeBlueprint.suggestedSizes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const sizes = activeBlueprint.suggestedSizes;
                const currentColor = variants[0]?.color || "Standard";
                const existingColorPhoto = variants.find(
                  (v) => (v.color || "").trim().toLowerCase() === currentColor.trim().toLowerCase() && (v.imageUrl || v.images?.[0]?.url)
                );
                const photoUrl = existingColorPhoto?.imageUrl || existingColorPhoto?.images?.[0]?.url;
                const photoAlt = existingColorPhoto?.altText || existingColorPhoto?.images?.[0]?.altText;

                const newVariants = sizes.map((s: string) => ({
                  id: crypto.randomUUID(),
                  sku: `${sku || "SKU"}-${s.replace(/\s+/g, "")}`,
                  color: currentColor,
                  size: s,
                  price: basePrice || 0,
                  stock: 10,
                  imageUrl: photoUrl,
                  altText: photoAlt,
                  images: photoUrl ? [{ id: crypto.randomUUID(), url: photoUrl, altText: photoAlt || `${currentColor} (${s})` }] : [],
                }));
                setVariants((prev) => [...prev, ...newVariants]);
                toast.success(`⚡ Added ${sizes.length} ${activeBlueprint.attributeSet} sizes`);
              }}
              className="px-2.5 py-1 bg-brand text-white rounded-lg text-xs font-bold hover:bg-brand/90 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Plus size={13} />
              <span>+ Add {activeBlueprint.attributeSet} Sizes ({activeBlueprint.suggestedSizes[0]}-{activeBlueprint.suggestedSizes[activeBlueprint.suggestedSizes.length - 1]})</span>
            </button>
          )}

          {/* Quick Preset Generators */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 text-[11px]">
            <span className="text-slate-400 font-bold px-1.5 uppercase">Other Sizes:</span>
            <button
              type="button"
              onClick={() => applySizePreset("apparel")}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-300 rounded font-semibold text-slate-700 cursor-pointer"
            >
              Apparel (XS-2XL)
            </button>
            <button
              type="button"
              onClick={() => applySizePreset("footwear")}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-300 rounded font-semibold text-slate-700 cursor-pointer"
            >
              Shoes (EU 39-45)
            </button>
            <button
              type="button"
              onClick={() => applySizePreset("volume")}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-300 rounded font-semibold text-slate-700 cursor-pointer"
            >
              Volumes (ml/L)
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const prevLast = variants[variants.length - 1];
              const inheritedColor = prevLast?.color || "";
              const existingColorPhoto = variants.find(
                (v) => inheritedColor && (v.color || "").trim().toLowerCase() === inheritedColor.trim().toLowerCase() && (v.imageUrl || v.images?.[0]?.url)
              );
              const photoUrl = existingColorPhoto?.imageUrl || existingColorPhoto?.images?.[0]?.url;
              const photoAlt = existingColorPhoto?.altText || existingColorPhoto?.images?.[0]?.altText;

              setVariants((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  sku: `${sku ? sku + "-" + (prev.length + 1) : "VAR-" + (prev.length + 1)}`,
                  color: inheritedColor,
                  size: "",
                  price: basePrice || 0,
                  stock: 0,
                  imageUrl: photoUrl,
                  altText: photoAlt,
                  images: photoUrl ? [{ id: crypto.randomUUID(), url: photoUrl, altText: photoAlt || "" }] : [],
                },
              ]);
            }}
            className="text-xs flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Add Child Variant</span>
          </Button>
        </div>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-700">Simple Product (No Child Variants)</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            This item is sold as a standalone single product. If this product has multiple sizes, colors, or volumes,
            click <strong>+ Add Child Variant</strong> above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Color Groups Photo Status Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Color Groups & Photos:
            </span>
            {Array.from(new Set(variants.map((v) => (v.color || "Standard").trim()))).map((c) => {
              const vars = variants.filter(
                (v) => (v.color || "Standard").trim().toLowerCase() === c.toLowerCase()
              );
              const firstWithPhoto = vars.find((v) => Boolean(v.imageUrl || v.images?.[0]?.url));
              const hasPhoto = Boolean(firstWithPhoto);
              const firstIdx = variants.findIndex(
                (v) => (v.color || "Standard").trim().toLowerCase() === c.toLowerCase()
              );
              const photoUrl = firstWithPhoto?.imageUrl || firstWithPhoto?.images?.[0]?.url;

              return (
                <div
                  key={c}
                  className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs"
                >
                  {photoUrl ? (
                    <div className="relative w-5 h-5 rounded overflow-hidden border border-slate-200 shrink-0">
                      <Image src={photoUrl} alt={c} fill sizes="20px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  )}
                  <span className="font-bold text-slate-800">{c}</span>
                  <span className="text-[10px] text-slate-400">({vars.length} sizes)</span>
                  {hasPhoto ? (
                    <button
                      type="button"
                      onClick={() => setVariantImageModalIndex(firstIdx)}
                      className="text-[10px] text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit photo & alt text for this color"
                    >
                      <Check size={11} className="text-emerald-600" />
                      <span>Photo & Alt Set</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVariantImageModalIndex(firstIdx)}
                      className="text-[10px] text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                      title="Assign photo & mandatory alt text to all variants of this color"
                    >
                      <Camera size={11} className="text-amber-600" />
                      <span>+ Add Photo & Alt</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Size Chart Manager Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Ruler size={16} className="text-brand shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800">Product Size Guide / Chart: </span>
                {sizeChart ? (
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded ml-1">
                    ✓ Attached ({sizeChart.startsWith("http") ? "Image Link" : "HTML Table"})
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">No size chart attached yet</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSizeChartDrawer(!showSizeChartDrawer)}
              className="text-xs font-bold text-brand hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>{sizeChart ? "Change Size Chart" : "+ Attach Size Chart"}</span>
              {showSizeChartDrawer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {showSizeChartDrawer && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-in fade-in-50 duration-150">
              <label className="block text-xs font-bold text-slate-700">
                Size Chart URL or HTML Table
              </label>
              <input
                type="text"
                value={sizeChart}
                onChange={(e) => setSizeChart(e.target.value)}
                placeholder="e.g. https://.../size-chart.webp or <table>...</table>"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-brand"
              />
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="text-slate-400 font-bold">Standard Presets:</span>
                {[
                  { label: "Helmets Chart", url: "https://store4riders.s3.ap-south-2.amazonaws.com/size-charts/helmets-size-guide.webp" },
                  { label: "Jackets Chart", url: "https://store4riders.s3.ap-south-2.amazonaws.com/size-charts/jackets-size-guide.webp" },
                  { label: "Gloves Chart", url: "https://store4riders.s3.ap-south-2.amazonaws.com/size-charts/gloves-size-guide.webp" },
                  { label: "Boots Chart", url: "https://store4riders.s3.ap-south-2.amazonaws.com/size-charts/boots-size-guide.webp" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSizeChart(preset.url);
                      toast.success(`Attached ${preset.label}`);
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-medium cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
                {sizeChart && (
                  <button
                    type="button"
                    onClick={() => setSizeChart("")}
                    className="px-2 py-0.5 text-red-600 hover:bg-red-50 rounded font-medium cursor-pointer ml-auto"
                  >
                    Clear Chart
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                  <th className="p-3 min-w-[120px]">Photo & Alt Text</th>
                  <th className="p-3">Variant SKU</th>
                  <th className="p-3">Color</th>
                  <th className="p-3">Size / Volume (ml/L)</th>
                  <th className="p-3">Price (₹)</th>
                  <th className="p-3">Special Price (₹)</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variants.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    {/* Child Variant Image Selector */}
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setVariantImageModalIndex(idx)}
                          className={`relative w-11 h-11 rounded-lg overflow-hidden border transition-all flex items-center justify-center group cursor-pointer shrink-0 ${
                            v.imageUrl
                              ? "border-slate-300 hover:border-brand shadow-2xs"
                              : "border-dashed border-amber-300 bg-amber-50/70 hover:border-brand hover:bg-brand/5"
                          }`}
                          title={v.altText || v.images?.[0]?.altText || "Click to add/edit photo & mandatory alt text"}
                        >
                          {v.imageUrl ? (
                            <>
                              <Image src={v.imageUrl} alt={v.altText || "Variant"} fill sizes="44px" className="object-cover" />
                              <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-amber-700 group-hover:text-brand">
                              <Camera size={14} />
                              <span className="text-[8px] font-bold mt-0.5">+Photo</span>
                            </div>
                          )}
                        </button>
                        {v.imageUrl ? (
                          <div className="min-w-0 max-w-[85px] hidden sm:block">
                            <span
                              className="text-[10px] text-slate-500 font-medium truncate block"
                              title={v.altText || v.images?.[0]?.altText || "Alt text"}
                            >
                              {v.altText || v.images?.[0]?.altText || "Alt Text Set"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium hidden sm:block">Required</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants((prev) => prev.map((item, i) => (i === idx ? { ...item, sku: val } : item)));
                        }}
                        className="w-32 px-2 py-1.5 border border-slate-200 rounded font-mono font-medium"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={v.color}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, color: val } : item))
                          );
                        }}
                        list="color-presets"
                        placeholder="Select/Type Color"
                        className="w-32 px-2 py-1.5 border border-slate-200 rounded focus:ring-2 focus:ring-brand"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={v.size}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants((prev) => prev.map((item, i) => (i === idx ? { ...item, size: val } : item)));
                        }}
                        list="size-presets"
                        placeholder="Select Size/Vol"
                        className="w-32 px-2 py-1.5 border border-slate-200 rounded font-bold text-slate-800 focus:ring-2 focus:ring-brand"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={v.price}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
                        }}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Math.max(0, Number(e.target.value));
                          setVariants((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
                          );
                        }}
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={v.specialPrice ?? ""}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
                        }}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Math.max(0, Number(e.target.value));
                          setVariants((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, specialPrice: val } : item))
                          );
                        }}
                        placeholder="Offer ₹"
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
                        }}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Math.max(0, Number(e.target.value));
                          setVariants((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, stock: val } : item))
                          );
                        }}
                        className="w-16 px-2 py-1.5 border border-slate-200 rounded font-bold"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setVariantImageModalIndex(idx)}
                          className="text-slate-400 hover:text-brand p-1.5 rounded hover:bg-brand/10 cursor-pointer"
                          title="Advanced Variant Settings (Weight, Images, Status)"
                        >
                          <Sliders size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 cursor-pointer"
                          title="Delete Variant"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
