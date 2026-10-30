"use client";

import { parseColorToBackground } from "@/modules/product-detail/components/ProductDetailPageModule";
import { buildVariantAltText } from "@/core/utils/mediaUrlHelper";

import React, { useState } from "react";
import Image from "next/image";
import { GitBranch, Plus, Check, Camera, Sliders, Trash2, Ruler, ChevronDown, ChevronUp, Lightbulb, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { useProductFormContext } from "../ProductFormContext";
import { COLOR_OPTIONS, SIZE_OPTIONS } from "../product-specs.constants";
import { ColorSwatchModal } from "../modals/ColorSwatchModal";
import { AddSizeRunModal } from "../modals/AddSizeRunModal";

export function generateVariantSku(
  baseSku: string | undefined,
  color: string,
  size: string,
  existingSkus: Set<string>
): string {
  const prefix = (baseSku || "SKU").trim();
  const cleanSize = size.replace(/\s+/g, "").toUpperCase();
  const cleanColor =
    color && color.toLowerCase() !== "standard"
      ? color.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase()
      : "";

  let candidate = cleanColor
    ? `${prefix}-${cleanColor}-${cleanSize}`
    : `${prefix}-${cleanSize}`;

  if (existingSkus.has(candidate.toUpperCase())) {
    let inc = 2;
    while (existingSkus.has(`${candidate}-${inc}`.toUpperCase())) {
      inc++;
    }
    candidate = `${candidate}-${inc}`;
  }

  return candidate;
}

export function ProductVariantsTab() {
  const [editingColorTarget, setEditingColorTarget] = useState<{ colorName: string; variantIndex?: number } | null>(null);
  const [showSizeChartDrawer, setShowSizeChartDrawer] = useState(false);
  const [sizeRunModalConfig, setSizeRunModalConfig] = useState<{
    isOpen: boolean;
    attributeSetName: string;
    suggestedSizes: string[];
  } | null>(null);
  const {
    variants,
    setVariants,
    colorSwatches,
    setColorSwatches,
    sku,
    basePrice,
    specialPrice,
    setVariantImageModalIndex,
    applySizePreset,
    activeBlueprint,
    sizeChart,
    setSizeChart,
    images,
    setImages,
    name,
  } = useProductFormContext();

  const getSwatchBg = (colorName: string) => {
    if (!colorName) return "#111111";
    const trimmed = colorName.trim();
    if (colorSwatches[trimmed]) return colorSwatches[trimmed];
    const norm = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
    const matchKey = Object.keys(colorSwatches).find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === norm
    );
    if (matchKey && colorSwatches[matchKey]) return colorSwatches[matchKey];
    return parseColorToBackground(trimmed) || "#111111";
  };
  const handleColorChange = (idx: number, newColor: string) => {
    setVariants((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updatedAlt = item.imageUrl
          ? buildVariantAltText(name, newColor, item.size)
          : item.altText;
        return {
          ...item,
          color: newColor,
          altText: updatedAlt,
          images: item.images?.length
            ? item.images.map((img) => ({ ...img, altText: updatedAlt || img.altText }))
            : item.images,
        };
      })
    );
  };

  const handleSizeChange = (idx: number, newSize: string) => {
    setVariants((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updatedAlt = item.imageUrl
          ? buildVariantAltText(name, item.color, newSize)
          : item.altText;
        return {
          ...item,
          size: newSize,
          altText: updatedAlt,
          images: item.images?.length
            ? item.images.map((img) => ({ ...img, altText: updatedAlt || img.altText }))
            : item.images,
        };
      })
    );
  };

  const handleApplyColorToAll = (colorToApply: string) => {
    const trimmed = colorToApply.trim();
    if (!trimmed) {
      toast.error("Please enter a valid color name");
      return;
    }
    setVariants((prev) =>
      prev.map((item) => {
        const updatedAlt = item.imageUrl
          ? buildVariantAltText(name, trimmed, item.size)
          : item.altText;
        return {
          ...item,
          color: trimmed,
          altText: updatedAlt,
          images: item.images?.length
            ? item.images.map((img) => ({ ...img, altText: updatedAlt || img.altText }))
            : item.images,
        };
      })
    );
    toast.success(`✓ Color "${trimmed}" & auto Alt Texts applied to all ${variants.length} sizes!`);
  };

  
  const handleAddSizeRun = (colorName: string, selectedSizes: string[], swatchCss?: string) => {
    const finalColor = colorName.trim() || (variants.length === 0 ? "Standard" : "New Color");
    const existingSkus = new Set(variants.map((v) => (v.sku || "").toUpperCase()));

    const newVariants = selectedSizes.map((s) => {
      const autoSku = generateVariantSku(sku, finalColor, s, existingSkus);
      existingSkus.add(autoSku.toUpperCase());
      const autoAlt = buildVariantAltText(name, finalColor, s);

      return {
        id: crypto.randomUUID(),
        sku: autoSku,
        color: finalColor,
        size: s,
        price: basePrice || 0,
        specialPrice: (typeof specialPrice === "number" && specialPrice > 0 ? specialPrice : "") as number | "",
        stock: 10,
        imageUrl: undefined, // New color starts with clean photo slot!
        altText: autoAlt,
        images: [],
      };
    });

    setVariants((prev) => [...prev, ...newVariants]);

    if (swatchCss && finalColor.toLowerCase() !== "standard") {
      setColorSwatches((prev) => ({
        ...prev,
        [finalColor]: swatchCss,
      }));
    }

    toast.success(`⚡ Added ${newVariants.length} sizes for color "${finalColor}"!`);

    setTimeout(() => {
      const bottomElem = document.getElementById("variants-table-bottom");
      if (bottomElem) {
        bottomElem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleSyncAllAltTexts = () => {
    setVariants((prev) =>
      prev.map((item) => {
        if (!item.imageUrl) return item;
        const autoAlt = buildVariantAltText(name, item.color, item.size);
        return {
          ...item,
          altText: autoAlt,
          images: item.images?.length
            ? item.images.map((img) => ({ ...img, altText: autoAlt }))
            : [{ id: crypto.randomUUID(), url: item.imageUrl, altText: autoAlt }],
        };
      })
    );
    toast.success("✓ All variant SEO Alt Texts synced with Product Name, Color & Size!");
  };


  const handleAddChildVariant = () => {
    const prevLast = variants[variants.length - 1];
    const inheritedColor = prevLast?.color || "";
    const existingColorPhoto = variants.find(
      (v) => inheritedColor && (v.color || "").trim().toLowerCase() === inheritedColor.trim().toLowerCase() && (v.imageUrl || v.images?.[0]?.url)
    );
    const photoUrl = existingColorPhoto?.imageUrl || existingColorPhoto?.images?.[0]?.url;
    const photoAlt = existingColorPhoto?.altText || existingColorPhoto?.images?.[0]?.altText;

    const newIndex = variants.length + 1;
    const newVariant = {
      id: crypto.randomUUID(),
      sku: `${sku ? sku + "-" + newIndex : "VAR-" + newIndex}`,
      color: inheritedColor,
      size: "",
      price: basePrice || 0,
      specialPrice: (typeof specialPrice === "number" && specialPrice > 0 ? specialPrice : "") as number | "",
      stock: 0,
      imageUrl: photoUrl,
      altText: photoUrl ? buildVariantAltText(name, inheritedColor, "") : undefined,
      images: photoUrl ? [{ id: crypto.randomUUID(), url: photoUrl, altText: buildVariantAltText(name, inheritedColor, "") }] : [],
    };

    setVariants((prev) => [...prev, newVariant]);
    toast.success(`Child variant #${newIndex} added!`);

    setTimeout(() => {
      const bottomElem = document.getElementById("variants-table-bottom");
      if (bottomElem) {
        bottomElem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleSetCoverFromColor = (colorName: string, photoUrl?: string, altText?: string) => {
    if (!photoUrl) return;
    setImages((prev) => {
      const cleanAlt = altText || (name ? `${name} - ${colorName}` : colorName);
      const exists = prev.some((img) => img.url === photoUrl);
      if (!exists) {
        return [
          { id: crypto.randomUUID(), url: photoUrl, altText: cleanAlt, isBase: true },
          ...prev.map((img) => ({ ...img, isBase: false })),
        ];
      }
      return prev.map((img) => ({
        ...img,
        isBase: img.url === photoUrl,
      }));
    });
    toast.success(`⭐ "${colorName}" photo set as Main Storefront Thumbnail!`);
  };

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
          <div className="mt-0.5 space-y-1">
            <p className="text-xs text-slate-500">
              Manage variants for this configurable product. Real database variants only.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
              <span className="font-bold text-brand">💡 Multi-Color Tip:</span>
              <span>For dual/multi-color gear (e.g. Black boots with Red accents), enter color as <code className="bg-white px-1 py-0.2 rounded font-mono font-bold text-slate-800 border border-slate-300">Black / Red</code> for automatic 50/50 split diagonal swatches on storefront!</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Category Suggested Sizes Button */}
          {activeBlueprint && activeBlueprint.suggestedSizes && activeBlueprint.suggestedSizes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSizeRunModalConfig({
                  isOpen: true,
                  attributeSetName: activeBlueprint.attributeSet || "Sizes",
                  suggestedSizes: activeBlueprint.suggestedSizes,
                });
              }}
              className="px-2.5 py-1 bg-brand text-white rounded-lg text-xs font-bold hover:bg-brand/90 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Plus size={13} />
              <span>Add {activeBlueprint.attributeSet} Sizes ({activeBlueprint.suggestedSizes[0]}-{activeBlueprint.suggestedSizes[activeBlueprint.suggestedSizes.length - 1]})</span>
            </button>
          )}

          {/* Quick Preset Generators */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 text-[11px]">
            <span className="text-slate-400 font-bold px-1.5 uppercase">Other Sizes:</span>
            <button
              type="button"
              onClick={() => {
                setSizeRunModalConfig({
                  isOpen: true,
                  attributeSetName: "Apparel",
                  suggestedSizes: ["XS", "S", "M", "L", "XL", "2XL"],
                });
              }}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-300 rounded font-semibold text-slate-700 cursor-pointer"
            >
              Apparel (XS-2XL)
            </button>
            <button
              type="button"
              onClick={() => {
                setSizeRunModalConfig({
                  isOpen: true,
                  attributeSetName: "Shoes",
                  suggestedSizes: ["EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45"],
                });
              }}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-300 rounded font-semibold text-slate-700 cursor-pointer"
            >
              Shoes (EU 39-45)
            </button>
            <button
              type="button"
              onClick={() => {
                setSizeRunModalConfig({
                  isOpen: true,
                  attributeSetName: "Volumes",
                  suggestedSizes: ["50ml", "100ml", "150ml", "250ml", "500ml", "1L"],
                });
              }}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-300 rounded font-semibold text-slate-700 cursor-pointer"
            >
              Volumes (ml/L)
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddChildVariant}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:border-brand text-slate-700 hover:text-brand rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus size={14} className="text-brand" />
            <span>Add Child Variant</span>
          </button>
        </div>
      </div>

      {/* Catalog Guide: Color Naming Rule */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
        <Lightbulb size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1.5 w-full">
          <div className="font-bold text-amber-950 flex items-center justify-between">
            <span>💡 Color Naming Guide (When to use &quot;Standard&quot; vs Real Colors)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] text-amber-900 leading-relaxed">
            <div className="bg-white/85 border border-amber-200/70 rounded-lg p-2.5 shadow-2xs">
              <strong className="text-amber-950 block mb-0.5 font-bold">
                1. Leave as &quot;Standard&quot; (Single-Color / No Color Choice)
              </strong>
              <span>Use for products with <em>sizes or volumes only</em> (e.g. Chain Cleaner 150ml/400ml, Knee Protectors S/M/L, Bags 30L/50L).</span>
              <span className="block text-emerald-700 font-semibold mt-1">
                ✓ Storefront hides color selector completely — customer directly selects Size or Volume.
              </span>
            </div>
            <div className="bg-white/85 border border-amber-200/70 rounded-lg p-2.5 shadow-2xs">
              <strong className="text-amber-950 block mb-0.5 font-bold">
                2. Change to Real Color (Helmets, Jackets, Gloves)
              </strong>
              <span>Type or select the actual color name (e.g. <em>Matte Black</em>, <em>Gloss Red</em>, <em>Golden</em>, <em>Flu. Green</em>).</span>
              <span className="block text-brand font-semibold mt-1">
                ✓ Storefront renders interactive Color Swatches &amp; switches photos when clicked.
              </span>
            </div>
          </div>
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

              const isCover = Boolean(
                photoUrl &&
                (images.some((img) => img.isBase && img.url === photoUrl) ||
                 (!images.some((img) => img.isBase) && images[0]?.url === photoUrl))
              );

              return (
                <div
                  key={c}
                  className={`flex items-center gap-2 px-2.5 py-1.5 bg-white border rounded-lg text-xs shadow-2xs transition-all ${
                    isCover ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20" : "border-slate-200"
                  }`}
                >
                  {/* Visual: Photo if uploaded, otherwise Color Swatch Circle */}
                  {photoUrl ? (
                    <div className="relative w-6 h-6 rounded-md overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                      <Image src={photoUrl} alt={c} fill sizes="24px" className="object-cover" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingColorTarget({ colorName: c })}
                      className="relative w-6 h-6 rounded-full border-2 border-slate-300 shadow-2xs hover:scale-110 active:scale-95 transition-all shrink-0 ring-1 ring-black/10 cursor-pointer overflow-hidden flex items-center justify-center group"
                      style={{ background: getSwatchBg(c) }}
                      title={`Click to edit color swatch for "${c}"`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold text-white drop-shadow-md bg-black/60 w-full h-full flex items-center justify-center">
                        ✎
                      </span>
                    </button>
                  )}

                  {/* Color Name + Size Count */}
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800">{c}</span>
                    <button
                      type="button"
                      onClick={() => setEditingColorTarget({ colorName: c })}
                      className="text-slate-400 hover:text-brand p-0.5 rounded cursor-pointer transition-colors"
                      title={`Rename "${c}" for all ${vars.length} sizes`}
                    >
                      ✎
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">({vars.length} {vars.length === 1 ? 'size' : 'sizes'})</span>

                  {/* Swatch circle button if photo already set */}
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingColorTarget({ colorName: c })}
                      className="relative w-5 h-5 rounded-full border-2 border-slate-300 shadow-2xs hover:scale-110 active:scale-95 transition-all shrink-0 ring-1 ring-black/10 cursor-pointer overflow-hidden flex items-center justify-center group ml-0.5"
                      style={{ background: getSwatchBg(c) }}
                      title={`Click to edit color swatch for "${c}"`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[7px] font-bold text-white drop-shadow-md bg-black/60 w-full h-full flex items-center justify-center">
                        ✎
                      </span>
                    </button>
                  )}

                  {/* Photo Actions */}
                  {hasPhoto ? (
                    <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-200">
                      <button
                        type="button"
                        onClick={() => setVariantImageModalIndex(firstIdx)}
                        className="text-[10px] text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                        title="Edit photo & alt text for this color"
                      >
                        <Check size={11} className="text-emerald-600" />
                        <span>Photo Set</span>
                      </button>

                      {isCover ? (
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <Star size={10} fill="currentColor" />
                          <span>Front Cover</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCoverFromColor(c, photoUrl, firstWithPhoto?.altText)}
                          className="text-[10px] text-slate-600 hover:text-amber-800 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                          title="Set this color as the primary storefront catalog thumbnail"
                        >
                          <Star size={10} className="text-amber-500" />
                          <span>Set Front</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVariantImageModalIndex(firstIdx)}
                      className="text-[10px] text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ml-1"
                      title="Assign photo & mandatory alt text to all variants of this color"
                    >
                      <Camera size={11} className="text-amber-600" />
                      <span>+ Add Photo</span>
                    </button>
                  )}
                </div>
              );
            })}

            {variants.some((v) => v.imageUrl) && (
              <button
                type="button"
                onClick={handleSyncAllAltTexts}
                className="ml-auto text-[10.5px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                title="Automatically update all variant image alt texts to [Product Name] - [Color] ([Size])"
              >
                <Check size={12} className="text-emerald-600" />
                <span>Auto-Sync Alt Texts (Color + Size)</span>
              </button>
            )}
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
                  <th className="p-3">
                    <div className="flex items-center justify-between gap-1">
                      <span>Color</span>
                      {variants.length > 1 && variants[0]?.color && (
                        <button
                          type="button"
                          onClick={() => handleApplyColorToAll(variants[0].color)}
                          className="text-[9.5px] text-brand hover:text-red-700 font-bold lowercase tracking-normal flex items-center gap-0.5 cursor-pointer underline"
                          title={`Apply "${variants[0].color}" to all ${variants.length} sizes`}
                        >
                          ⚡ Apply 1st to All
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal lowercase tracking-normal block">&quot;Standard&quot; if single color</span>
                  </th>
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
                          <div className="min-w-0 max-w-[140px] sm:max-w-[180px]">
                            <span
                              className="text-[10.5px] text-slate-800 font-bold truncate block"
                              title={v.altText || v.images?.[0]?.altText || buildVariantAltText(name, v.color, v.size)}
                            >
                              {v.altText || v.images?.[0]?.altText || buildVariantAltText(name, v.color, v.size)}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                              <Check size={9} /> Auto Alt (Color+Size)
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const cName = v.color?.trim() || "";
                            setEditingColorTarget({ colorName: cName, variantIndex: idx });
                          }}
                          className={`relative w-7 h-7 rounded-full border-2 shadow-2xs hover:scale-110 active:scale-95 transition-all shrink-0 cursor-pointer overflow-hidden flex items-center justify-center group ${
                            v.color?.trim()
                              ? "border-slate-300 ring-1 ring-black/10"
                              : "border-dashed border-amber-400 bg-amber-50/70"
                          }`}
                          style={{ background: getSwatchBg(v.color) }}
                          title={v.color?.trim() ? `Click to customize swatch for "${v.color}"` : "Click to select color & auto-name variant"}
                        >
                          <span className={`text-[9px] font-bold drop-shadow-md w-full h-full flex items-center justify-center transition-opacity ${
                            v.color?.trim()
                              ? "opacity-0 group-hover:opacity-100 text-white bg-black/60"
                              : "opacity-80 group-hover:opacity-100 text-amber-700 bg-amber-100/60"
                          }`}>
                            {v.color?.trim() ? "✎" : "+"}
                          </span>
                        </button>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={v.color}
                            onChange={(e) => handleColorChange(idx, e.target.value)}
                            list="color-presets"
                            placeholder="Color or Standard"
                            className="w-24 sm:w-28 px-2 py-1.5 border border-slate-200 rounded focus:ring-2 focus:ring-brand font-medium text-xs"
                          />
                          {variants.length > 1 && v.color && (
                            <button
                              type="button"
                              onClick={() => handleApplyColorToAll(v.color)}
                              className="text-[9px] text-slate-400 hover:text-brand font-bold bg-slate-100 hover:bg-slate-200 px-1 py-0.5 rounded cursor-pointer transition-colors shrink-0"
                              title={`Apply "${v.color}" to all ${variants.length} sizes`}
                            >
                              All
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={v.size}
                        onChange={(e) => handleSizeChange(idx, e.target.value)}
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
                        value={v.specialPrice !== undefined && v.specialPrice !== null ? v.specialPrice : ""}
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

          {/* Bottom Table Bar: Row Count & Add Variant Button */}
          <div id="variants-table-bottom" className="flex items-center justify-between p-3 bg-slate-50 border-t border-slate-200 rounded-b-xl">
            <span className="text-xs font-semibold text-slate-500">
              Total {variants.length} child variants
            </span>
            <button
              type="button"
              onClick={handleAddChildVariant}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:border-brand text-slate-700 hover:text-brand rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus size={14} className="text-brand" />
              <span>Add Another Variant</span>
            </button>
          </div>
        </div>
      )}

      {sizeRunModalConfig?.isOpen && (
        <AddSizeRunModal
          isOpen={sizeRunModalConfig.isOpen}
          attributeSetName={sizeRunModalConfig.attributeSetName}
          suggestedSizes={sizeRunModalConfig.suggestedSizes}
          existingColors={Array.from(new Set(variants.map((v) => (v.color || "Standard").trim()))).filter((c) => c !== "Standard")}
          onClose={() => setSizeRunModalConfig(null)}
          onAdd={handleAddSizeRun}
        />
      )}

      {editingColorTarget && (
        <ColorSwatchModal
          isOpen={Boolean(editingColorTarget)}
          colorName={editingColorTarget.colorName}
          targetVariantIndex={editingColorTarget.variantIndex}
          sameColorCount={
            variants.filter(
              (v) => (v.color || "Standard").trim().toLowerCase() === (editingColorTarget.colorName || "Standard").trim().toLowerCase()
            ).length
          }
          currentSwatch={colorSwatches[editingColorTarget.colorName]}
          onClose={() => setEditingColorTarget(null)}
          onSave={(swatchValue, finalColorName, applyToAllMatching) => {
            const targetColor = editingColorTarget.colorName || "Standard";
            const targetIdx = editingColorTarget.variantIndex;

            if (applyToAllMatching || targetIdx === undefined) {
              // Update all variants sharing this color
              setVariants((prev) =>
                prev.map((item, i) => {
                  const matches =
                    (item.color || "Standard").trim().toLowerCase() === targetColor.trim().toLowerCase() ||
                    (targetIdx !== undefined && i === targetIdx);
                  if (!matches) return item;

                  const updatedAlt = item.imageUrl
                    ? buildVariantAltText(name, finalColorName, item.size)
                    : item.altText;

                  return {
                    ...item,
                    color: finalColorName,
                    altText: updatedAlt,
                    images: item.images?.length
                      ? item.images.map((img) => ({ ...img, altText: updatedAlt || img.altText }))
                      : item.images,
                  };
                })
              );
              toast.success(`✓ Color "${finalColorName}" & swatch applied to matching sizes!`);
            } else {
              // Update only this single variant
              setVariants((prev) =>
                prev.map((item, i) => {
                  if (i !== targetIdx) return item;
                  const updatedAlt = item.imageUrl
                    ? buildVariantAltText(name, finalColorName, item.size)
                    : item.altText;
                  return {
                    ...item,
                    color: finalColorName,
                    altText: updatedAlt,
                    images: item.images?.length
                      ? item.images.map((img) => ({ ...img, altText: updatedAlt || img.altText }))
                      : item.images,
                  };
                })
              );
              toast.success(`Color swatch for "${finalColorName}" saved!`);
            }

            // Save swatch for this specific color name
            setColorSwatches((prev) => ({
              ...prev,
              [finalColorName]: swatchValue,
            }));
          }}
          onReset={() => {
            const nameToReset = editingColorTarget.colorName;
            if (nameToReset) {
              setColorSwatches((prev) => {
                const next = { ...prev };
                delete next[nameToReset];
                return next;
              });
              toast.info(`Color swatch for "${nameToReset}" reset to auto.`);
            }
          }}
        />
      )}
    </div>
  );
}
