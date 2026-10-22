"use client";

import React from "react";
import Image from "next/image";
import { GitBranch, Plus, Check, Camera, Sliders, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useProductFormContext } from "../ProductFormContext";
import { COLOR_OPTIONS, SIZE_OPTIONS } from "../product-specs.constants";

export function ProductVariantsTab() {
  const {
    variants,
    setVariants,
    sku,
    basePrice,
    setVariantImageModalIndex,
    applySizePreset,
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

        <div className="flex items-center gap-2">
          {/* Quick Preset Generators */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 text-[11px]">
            <span className="text-slate-400 font-bold px-1.5 uppercase">Quick Sizes:</span>
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
              setVariants((prev) => [
                ...prev,
                {
                  sku: `${sku ? sku + "-" + (prev.length + 1) : "VAR-" + (prev.length + 1)}`,
                  color: "",
                  size: "",
                  price: basePrice || 0,
                  stock: 0,
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
              const hasPhoto = vars.some((v) => Boolean(v.imageUrl));
              const firstIdx = variants.findIndex(
                (v) => (v.color || "Standard").trim().toLowerCase() === c.toLowerCase()
              );

              return (
                <div
                  key={c}
                  className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs"
                >
                  <span className="font-bold text-slate-800">{c}</span>
                  <span className="text-[10px] text-slate-400">({vars.length} sizes)</span>
                  {hasPhoto ? (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Check size={11} /> Photo Set
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVariantImageModalIndex(firstIdx)}
                      className="text-[10px] text-amber-700 font-bold bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                      title="Assign image to all variants of this color"
                    >
                      <Camera size={11} /> Set Photo
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                  <th className="p-3 w-16">Photo</th>
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
                      <button
                        type="button"
                        onClick={() => setVariantImageModalIndex(idx)}
                        className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-brand bg-slate-100 flex items-center justify-center group cursor-pointer"
                        title="Click to change variant image"
                      >
                        {v.imageUrl ? (
                          <Image src={v.imageUrl} alt="Variant" fill sizes="40px" className="object-cover" />
                        ) : (
                          <Camera size={16} className="text-slate-400 group-hover:text-brand" />
                        )}
                      </button>
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
