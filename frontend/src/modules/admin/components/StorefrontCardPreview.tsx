"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { 
  Eye, Check, Star, Camera, AlertCircle, Sparkles, Layers,
  ChevronRight, Palette, Tag
} from "lucide-react";
import Button from "@/components/ui/Button";
import { parseColorToBackground } from "@/modules/product-detail/components/ProductDetailPageModule";

export interface PreviewImage {
  id: string;
  url: string;
  altText: string;
  isBase?: boolean;
}

export interface PreviewVariant {
  sku: string;
  color: string;
  size: string;
  price: number | "";
  specialPrice?: number | "";
  stock: number | "";
  imageUrl?: string;
}

interface StorefrontCardPreviewProps {
  name: string;
  brand: string;
  basePrice: number | "";
  specialPrice?: number | "";
  images: PreviewImage[];
  variants: PreviewVariant[];
  onSetPrimaryImage?: (index: number) => void;
  onSelectColorPhoto?: (color: string) => void;
}

export const StorefrontCardPreview: React.FC<StorefrontCardPreviewProps> = ({
  name,
  brand,
  basePrice,
  specialPrice,
  images = [],
  variants = [],
  onSetPrimaryImage,
  onSelectColorPhoto,
}) => {
  // 1. Identify the Parent / Cover image (isBase: true or images[0])
  const baseImage = useMemo(() => {
    if (!images || images.length === 0) return null;
    return images.find((img) => img.isBase) || images[0];
  }, [images]);

  // 2. Extract distinct colors from variants
  const distinctColors = useMemo(() => {
    const map = new Map<string, {
      color: string;
      imageUrl?: string;
      sizes: string[];
      minPrice: number;
      totalStock: number;
      variantsCount: number;
    }>();

    variants.forEach((v) => {
      const c = (v.color || "Standard").trim();
      const existing = map.get(c.toLowerCase());
      const p = typeof v.price === "number" ? v.price : Number(v.price) || Number(basePrice) || 0;
      const st = typeof v.stock === "number" ? v.stock : Number(v.stock) || 0;

      if (!existing) {
        map.set(c.toLowerCase(), {
          color: c,
          imageUrl: v.imageUrl,
          sizes: v.size ? [v.size] : [],
          minPrice: p,
          totalStock: st,
          variantsCount: 1,
        });
      } else {
        if (v.imageUrl && !existing.imageUrl) existing.imageUrl = v.imageUrl;
        if (v.size && !existing.sizes.includes(v.size)) existing.sizes.push(v.size);
        if (p > 0 && (existing.minPrice === 0 || p < existing.minPrice)) existing.minPrice = p;
        existing.totalStock += st;
        existing.variantsCount += 1;
      }
    });

    return Array.from(map.values());
  }, [variants, basePrice]);

  // 3. Selected Color in Interactive Simulator
  const [selectedPreviewColor, setSelectedPreviewColor] = useState<string>("");

  // Keep selected preview color in sync if colors change
  const activeColorData = useMemo(() => {
    if (distinctColors.length === 0) return null;
    if (selectedPreviewColor) {
      const found = distinctColors.find(
        (c) => c.color.toLowerCase() === selectedPreviewColor.toLowerCase()
      );
      if (found) return found;
    }
    return distinctColors[0];
  }, [distinctColors, selectedPreviewColor]);

  // Determine active photo for the selected color
  const activeColorImage = useMemo(() => {
    if (!activeColorData) return baseImage?.url || "/no-image.svg";

    // 1. Direct variant image
    if (activeColorData.imageUrl) return activeColorData.imageUrl;

    // 2. Search gallery images for Alt text containing the color name
    const colorLower = activeColorData.color.toLowerCase();
    const matchedGalleryImg = images.find((img) =>
      (img.altText || "").toLowerCase().includes(colorLower)
    );
    if (matchedGalleryImg) return matchedGalleryImg.url;

    // 3. Fallback to Parent Cover image
    return baseImage?.url || "/no-image.svg";
  }, [activeColorData, images, baseImage]);

  // Pricing calculations
  const numericBasePrice = Number(basePrice) || 0;
  const numericSpecialPrice = Number(specialPrice) || 0;
  const hasDiscount = numericSpecialPrice > 0 && numericBasePrice > numericSpecialPrice;
  const displayPrice = hasDiscount ? numericSpecialPrice : numericBasePrice;
  const discountPercent = hasDiscount
    ? Math.round(((numericBasePrice - numericSpecialPrice) / numericBasePrice) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl p-6 text-slate-800 shadow-xs border border-slate-200 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand/10 text-brand shadow-2xs">
              <Eye size={18} />
            </span>
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Live Storefront Experience Preview
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time preview of the catalog listing card and interactive product detail page swatches as seen by customers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>

      {/* Grid: Left (Catalog Card View) & Right (Detail Page & Color Swapper) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ================= COLUMN 1: CATALOG LISTING CARD (Parent Cover) ================= */}
        <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                Catalog Listing View (Parent Cover)
              </h4>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-200">
              Primary Thumbnail
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Displayed as the primary product card when customers browse category listings, brand pages, or search results:
          </p>

          {/* Actual Card Simulation (Matches Storefront) */}
          <div className="max-w-[280px] mx-auto bg-white rounded-xl overflow-hidden shadow-xs border border-slate-200 text-slate-900 group transition-shadow duration-200 hover:shadow-md">
            {/* Image Box */}
            <div className="relative aspect-square w-full bg-[#f8f8f8] flex items-center justify-center overflow-hidden">
              {baseImage?.url ? (
                <Image
                  src={baseImage.url}
                  alt={baseImage.altText || name || "Catalog Cover"}
                  fill
                  sizes="280px"
                  className="object-contain mix-blend-multiply p-2 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <Camera size={36} className="mb-2 text-slate-300" />
                  <span className="text-xs font-semibold">No Image Uploaded</span>
                  <span className="text-[10px] text-slate-400">Add photos in Tab 3</span>
                </div>
              )}

              {/* Cover Badge */}
              <div className="absolute top-2 left-2 bg-slate-900/85 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-xs">
                <Star size={10} fill="#f59e0b" className="text-amber-400" />
                <span>Catalog Cover</span>
              </div>

              {/* Rating Badge */}
              <div className="absolute top-2 right-2 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-0.5">
                <span>★ 4.8</span>
              </div>

              {/* Discount Tag */}
              {hasDiscount && (
                <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
                  {discountPercent}% OFF
                </div>
              )}
            </div>

            {/* Card Content */}
            <div className="p-3.5 space-y-1">
              {brand && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {brand}
                </span>
              )}
              <h5 className="font-bold text-sm text-slate-900 line-clamp-1 leading-snug">
                {name || "Untitled Product"}
              </h5>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="font-extrabold text-sm text-slate-900">
                  {displayPrice > 0 ? `₹${displayPrice.toLocaleString("en-IN")}` : "₹ 0"}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-slate-400 line-through">
                    ₹{numericBasePrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              {distinctColors.length > 1 && (
                <div className="pt-1.5 flex items-center gap-1 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                  <Palette size={11} className="text-brand" />
                  <span>{distinctColors.length} Colors Available</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Change Cover Image Dropdown */}
          {images.length > 1 && (
            <div className="pt-3 border-t border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Set Primary Catalog Cover:
              </label>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => onSetPrimaryImage && onSetPrimaryImage(idx)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      img.isBase
                        ? "border-brand ring-2 ring-brand/30"
                        : "border-slate-200 hover:border-slate-400 opacity-60 hover:opacity-100"
                    }`}
                    title={img.isBase ? "Current Catalog Cover" : "Click to set as Catalog Cover"}
                  >
                    <Image src={img.url} alt="Thumbnail" fill sizes="48px" className="object-cover" />
                    {img.isBase && (
                      <div className="absolute inset-0 bg-brand/20 flex items-center justify-center">
                        <Check size={14} className="text-brand drop-shadow-sm stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= COLUMN 2: PDP DETAIL PAGE & COLOR SWAP SIMULATOR ================= */}
        <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                Interactive Storefront Simulator
              </h4>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
              Detail Page & Swatches
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Click any color swatch below to test how customer color selection dynamically swaps the main product image and updates available sizes:
          </p>

          {/* Color Swatches Selector */}
          {distinctColors.length > 0 ? (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                  <Palette size={13} className="text-brand" />
                  Select Color to Test Image Swap:
                </span>
                <span className="text-slate-900 font-mono font-bold">
                  {activeColorData?.color || "None"}
                </span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {distinctColors.map((c) => {
                  const isSelected = activeColorData?.color.toLowerCase() === c.color.toLowerCase();
                  const bg = parseColorToBackground(c.color);
                  const hasPhoto = Boolean(c.imageUrl);

                  return (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setSelectedPreviewColor(c.color)}
                      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-50 border-brand ring-2 ring-brand/20 shadow-xs text-brand font-bold"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {/* Color circle */}
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-inner"
                        style={{ background: bg }}
                      />
                      <span className="text-xs">{c.color}</span>

                      {/* Photo indicator dot */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          hasPhoto ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        title={hasPhoto ? "Custom photo linked" : "Using fallback photo"}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
              <Layers size={20} className="mx-auto mb-1.5 text-slate-400" />
              <span>No variants configured yet.</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Use Quick Presets in Tab 5 to generate Volume, Apparel, or Boot sizes in one click.
              </p>
            </div>
          )}

          {/* Swapped Image & Variant Status Display */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row gap-4 items-center shadow-2xs">
            {/* Swapped Photo Preview */}
            <div className="relative w-32 h-32 bg-[#f8f8f8] rounded-lg shrink-0 border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
              <Image
                src={activeColorImage}
                alt={activeColorData ? `${name} - ${activeColorData.color}` : "Swapped Preview"}
                fill
                sizes="128px"
                className="object-contain mix-blend-multiply p-1.5"
              />
              <div className="absolute top-1 left-1 bg-slate-900/80 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded">
                Active Photo
              </div>
            </div>

            {/* Status Breakdown for this Color */}
            <div className="flex-1 space-y-2 text-xs w-full">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Selected Color:</span>
                <strong className="text-slate-900 text-sm">
                  {activeColorData?.color || "Standard / Single"}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Photo Link Status:</span>
                {activeColorData?.imageUrl ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check size={11} /> Custom Photo Linked
                  </span>
                ) : (
                  <span className="text-amber-800 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200" title="No custom photo assigned to this color variant; displaying catalog cover image as fallback.">
                    <AlertCircle size={11} /> Using Catalog Cover
                  </span>
                )}
              </div>

              {activeColorData?.sizes && activeColorData.sizes.length > 0 && (
                <div>
                  <span className="text-slate-500 font-medium block mb-1">Available Sizes:</span>
                  <div className="flex flex-wrap gap-1">
                    {activeColorData.sizes.map((sz) => (
                      <span
                        key={sz}
                        className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] font-semibold"
                      >
                        {sz}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {onSelectColorPhoto && activeColorData && (
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectColorPhoto(activeColorData.color)}
                    className="w-full text-xs flex items-center justify-center gap-1.5 bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
                  >
                    <Camera size={13} />
                    <span>Assign / Change Photo for &quot;{activeColorData.color}&quot;</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Chips Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Tag size={13} className="text-brand" />
            Total Gallery Photos: <strong className="text-slate-900">{images.length}</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <Palette size={13} className="text-blue-600" />
            Total Colors: <strong className="text-slate-900">{distinctColors.length}</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <Layers size={13} className="text-emerald-600" />
            Total Sellable Variants: <strong className="text-slate-900">{variants.length}</strong>
          </span>
        </div>

        <p className="text-[11px] text-slate-400">
          💡 Photo #1 automatically serves as the primary catalog thumbnail. Color swatches dynamically display their assigned variant image.
        </p>
      </div>
    </div>
  );
};
