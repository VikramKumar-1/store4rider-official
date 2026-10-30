"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Sliders, X, ImageIcon, Check, Upload, Link as LinkIcon, 
  Trash2, AlertCircle, RefreshCw, Eye, Star, Palette 
} from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";
import { normalizeExternalImageUrl, buildVariantAltText } from "@/core/utils/mediaUrlHelper";
import { useProductFormContext } from "../ProductFormContext";
import { parseColorToBackground } from "@/modules/product-detail/components/ProductDetailPageModule";
import { ColorSwatchModal } from "./ColorSwatchModal";
import { COLOR_OPTIONS, SIZE_OPTIONS } from "../product-specs.constants";


const MULTI_SPLIT_PRESETS: Record<"2" | "3" | "4", Array<{ name: string; c: string[] }>> = {
  "2": [
    { name: "Black / Red", c: ["#111111", "#DC2626"] },
    { name: "Black / Fluo Yellow", c: ["#111111", "#EAB308"] },
    { name: "Black / White", c: ["#111111", "#FFFFFF"] },
    { name: "Black / Orange", c: ["#111111", "#EA580C"] },
    { name: "Blue / White", c: ["#2563EB", "#FFFFFF"] },
    { name: "Black / Grey", c: ["#111111", "#6B7280"] },
  ],
  "3": [
    { name: "Black / White / Red", c: ["#111111", "#FFFFFF", "#DC2626"] },
    { name: "Blue / White / Red", c: ["#2563EB", "#FFFFFF", "#DC2626"] },
    { name: "Green / White / Red", c: ["#009246", "#FFFFFF", "#CE2B37"] },
    { name: "Black / Fluo Yellow / Red", c: ["#111111", "#EAB308", "#DC2626"] },
    { name: "Black / Fluo Green / White", c: ["#111111", "#CCFF00", "#FFFFFF"] },
  ],
  "4": [
    { name: "Black / White / Red / Grey", c: ["#111111", "#FFFFFF", "#DC2626", "#6B7280"] },
    { name: "Black / Fluo Green / Orange / White", c: ["#111111", "#CCFF00", "#EA580C", "#FFFFFF"] },
    { name: "Navy / Blue / White / Red", c: ["#1E3A8A", "#2563EB", "#FFFFFF", "#DC2626"] },
    { name: "Black / Camo / Olive / Grey", c: ["#111111", "#4A5D4E", "#556B2F", "#6B7280"] },
  ],
};

export function VariantSettingsModal() {
  const {
    variantImageModalIndex,
    setVariantImageModalIndex,
    variants,
    setVariants,
    name,
    images,
    setImages,
    weightUnit,
    applyToAllSameColor,
    setApplyToAllSameColor,
    colorSwatches,
    setColorSwatches,
  } = useProductFormContext();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activePhotoTab, setActivePhotoTab] = useState<"upload" | "gallery" | "url">("upload");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [altText, setAltText] = useState<string>("");
  const [colorInput, setColorInput] = useState<string>("");
  const [sizeInput, setSizeInput] = useState<string>("");
  const [weightInput, setWeightInput] = useState<number | "">("");
  const [statusInput, setStatusInput] = useState<"enabled" | "disabled">("enabled");
  const [visibilityInput, setVisibilityInput] = useState<string>("Catalog, Search");
  const [syncToParentGallery, setSyncToParentGallery] = useState<boolean>(true);
  const [applyToSameColor, setApplyToSameColor] = useState<boolean>(true);
  const [isCoverImage, setIsCoverImage] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [manualUrlInput, setManualUrlInput] = useState<string>("");
  const [isSwatchModalOpen, setIsSwatchModalOpen] = useState<boolean>(false);
  const [activeSplitTab, setActiveSplitTab] = useState<"2" | "3" | "4">("2");

  const currentVariant = variantImageModalIndex !== null ? variants[variantImageModalIndex] : null;

  const originalColor = (currentVariant?.color || "").trim();
  const matchingVariants = variants.filter(
    (v) => (v.color || "").trim().toLowerCase() === originalColor.toLowerCase()
  );
  const matchingCount = matchingVariants.length;
  const matchingSizesList = matchingVariants.map((v) => v.size || "Std").join(", ");
  const splitParts = colorInput.split(/[/+&]/).map((p) => p.trim()).filter(Boolean);
  const detectedSplitCount = (() => {
    if (splitParts.length >= 2) return Math.min(splitParts.length, 4);
    const bg = colorSwatches[colorInput.trim()] || parseColorToBackground(colorInput.trim());
    if (bg.includes("24.5%") || bg.includes("25.5%")) return 4;
    if (bg.includes("32.8%") || bg.includes("33.3%")) return 3;
    if (bg.includes("49.5%") || bg.includes("50.5%")) return 2;
    return splitParts.length >= 2 ? Math.min(splitParts.length, 4) : 1;
  })();
  const isMultiColorDetected = detectedSplitCount >= 2;


  // Initialize modal local state whenever the opened variant changes
  useEffect(() => {
    if (currentVariant) {
      const existingImg = currentVariant.imageUrl || currentVariant.images?.[0]?.url || "";
      const existingAlt = 
        currentVariant.altText || 
        currentVariant.images?.[0]?.altText || 
        buildVariantAltText(name, currentVariant.color, currentVariant.size);

      setImageUrl(existingImg);
      setAltText(existingAlt);
      setColorInput(currentVariant.color || "");
      setSizeInput(currentVariant.size || "");
      setWeightInput(currentVariant.weight ?? "");
      setStatusInput(currentVariant.status || "enabled");
      setVisibilityInput(currentVariant.visibility || "Catalog, Search");
      setApplyToSameColor(applyToAllSameColor);
      setSyncToParentGallery(true);

      const isCurrentlyBase = Boolean(
        existingImg &&
        (images.some((img) => img.isBase && img.url === existingImg) ||
         (!images.some((img) => img.isBase) && images[0]?.url === existingImg))
      );
      setIsCoverImage(isCurrentlyBase || images.length === 0);

      setActivePhotoTab(existingImg ? "gallery" : (images && images.length > 0 ? "gallery" : "upload"));
      setManualUrlInput("");
    }
  }, [variantImageModalIndex, currentVariant, name, applyToAllSameColor, images]);

  if (variantImageModalIndex === null || !currentVariant) {
    return null;
  }

  const generateSuggestedAlt = (col = colorInput, sz = sizeInput) => {
    return buildVariantAltText(name, col, sz);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setIsUploading(true);
    try {
      const { file: webpFile } = await compressImageToWebP(file, 1440, 0.85);
      let finalUrl = "";
      try {
        finalUrl = await uploadImageToS3(webpFile);
      } catch (uploadErr) {
        finalUrl = URL.createObjectURL(webpFile);
      }

      setImageUrl(finalUrl);
      setAltText(buildVariantAltText(name, colorInput, sizeInput));
      toast.success("Image uploaded & WebP compressed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAttachManualUrl = () => {
    if (!manualUrlInput.trim()) {
      toast.error("Please enter an image URL");
      return;
    }
    setImageUrl(normalizeExternalImageUrl(manualUrlInput.trim()));
    setAltText(buildVariantAltText(name, colorInput, sizeInput));
    setManualUrlInput("");
    toast.success("Image URL attached!");
  };

  const handleSave = () => {
    // If an image is attached, alt text is strictly mandatory
    if (imageUrl && !altText.trim()) {
      toast.error("Alt text is mandatory for variant image (Required for SEO & Google Image search)");
      return;
    }

    const trimmedAlt = altText.trim();
    const targetColor = colorInput.trim();
    const originalColor = (currentVariant?.color || "").trim();

    // 1. Update the variant(s)
    setVariants((prev) =>
      prev.map((v, i) => {
        const isCurrent = i === variantImageModalIndex;
        const isSameColor = 
          applyToSameColor && 
          originalColor && 
          (v.color || "").trim().toLowerCase() === originalColor.toLowerCase();

        if (isCurrent || isSameColor) {
          const finalColor = isCurrent ? targetColor : (applyToSameColor ? targetColor : v.color);
          const finalSize = isCurrent ? sizeInput.trim() : v.size;
          // Auto SEO Alt Text: Always ensure every size has both accurate color and its own size!
          const variantAlt = isCurrent 
            ? trimmedAlt 
            : buildVariantAltText(name, finalColor, finalSize);

          const updatedImages = imageUrl
            ? [{ id: crypto.randomUUID(), url: imageUrl, altText: variantAlt }]
            : [];

          return {
            ...v,
            color: finalColor,
            size: finalSize,
            weight: isCurrent ? (weightInput !== "" ? Number(weightInput) : "") : v.weight,
            status: isCurrent ? statusInput : v.status,
            visibility: isCurrent ? visibilityInput : v.visibility,
            imageUrl: imageUrl || undefined,
            altText: imageUrl ? variantAlt : undefined,
            images: updatedImages,
          };
        }
        return v;
      })
    );

    
    // 2. Preserve and migrate color swatch
    if (targetColor) {
      const effectiveSwatch = colorSwatches[targetColor] || parseColorToBackground(targetColor);
      setColorSwatches((prev) => {
        const next = { ...prev, [targetColor]: effectiveSwatch };
        if (originalColor && originalColor.toLowerCase() !== targetColor.toLowerCase()) {
          delete next[originalColor];
        }
        return next;
      });
    }

    // 3. Sync image into parent gallery if requested (or if marked as catalog cover)
    if (imageUrl && (syncToParentGallery || isCoverImage)) {
      // In parent gallery, the photo represents the entire colorway (e.g. "Test Product 1 - Golden")
      // Remove single size suffix like " (XS)" so the parent gallery photo has a clean, accurate alt label
      const parentAltClean = sizeInput 
        ? trimmedAlt.replace(new RegExp(`\\s*\\(${sizeInput.trim()}\\)`, "i"), "").trim()
        : trimmedAlt;
      const finalParentAlt = parentAltClean || generateSuggestedAlt(targetColor, "");

      setImages((prev) => {
        const alreadyExists = prev.some((img) => img.url === imageUrl);
        if (!alreadyExists) {
          const newImg = {
            id: crypto.randomUUID(),
            url: imageUrl,
            altText: finalParentAlt,
            isBase: isCoverImage || prev.length === 0,
          };
          if (isCoverImage) {
            return [newImg, ...prev.map((img) => ({ ...img, isBase: false }))];
          }
          return [...prev, newImg];
        }

        // Update alt text in parent gallery and update isBase flag
        return prev.map((img) => {
          if (img.url === imageUrl) {
            return {
              ...img,
              altText: finalParentAlt,
              ...(isCoverImage ? { isBase: true } : {}),
            };
          }
          return isCoverImage ? { ...img, isBase: false } : img;
        });
      });
    }

    toast.success(
      applyToSameColor && targetColor
        ? `Saved photo & alt text for all "${targetColor}" variants!`
        : "Variant details saved successfully!"
    );

    setVariantImageModalIndex(null);
  };

  const handleClearPhoto = () => {
    setImageUrl("");
    setAltText("");
    toast.info("Variant photo removed");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Child Variant: <span className="font-mono text-brand">{currentVariant.sku}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Configure variant image with mandatory SEO Alt Text, color group syncing & stock attributes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVariantImageModalIndex(null)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* SECTION 1: PHOTO & ALT TEXT (PRIMARY FOCUS) */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="text-brand" size={16} />
              Variant Photo & Mandatory SEO Alt Text
            </h4>
            {imageUrl && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check size={12} /> Photo Attached
              </span>
            )}
          </div>

          {/* Current Photo Preview & Alt Text Input Card */}
          {imageUrl ? (
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border-2 border-brand shadow-sm bg-slate-100">
                  <Image
                    src={imageUrl}
                    alt={altText || "Variant"}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Image Alt Text <span className="text-red-500">*Mandatory</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAltText(generateSuggestedAlt())}
                        className="text-[11px] font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={11} /> Auto-suggest
                      </button>
                    </label>
                    <input
                      type="text"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="e.g. AGV K3 Helmet - Matt Red (L)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand focus:border-brand"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Required for SEO, Google Images ranking, and riders browsing with screen-readers.
                    </p>
                    {applyToSameColor && matchingCount > 1 && (
                      <span className="text-[10.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 font-semibold mt-1.5 shadow-2xs">
                        <Check size={11} className="text-emerald-600" />
                        <span>Auto-sync active: All {matchingCount} sizes will get this photo with their own size tag e.g. ({matchingVariants[1]?.size || "S"}), ({matchingVariants[2]?.size || "M"}).</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-xs text-slate-600 hover:text-brand font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} /> Change Photo
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> Remove Photo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tabbed Selector: Upload, Pick from Gallery, or Paste URL */
            <div className="space-y-3">
              <div className="flex items-center gap-1 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setActivePhotoTab("upload")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activePhotoTab === "upload"
                      ? "border-brand text-brand bg-white rounded-t-lg"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Upload size={13} />
                  <span>Upload from Computer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab("gallery")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activePhotoTab === "gallery"
                      ? "border-brand text-brand bg-white rounded-t-lg"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <ImageIcon size={13} />
                  <span>Pick from Gallery ({images.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab("url")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activePhotoTab === "url"
                      ? "border-brand text-brand bg-white rounded-t-lg"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LinkIcon size={13} />
                  <span>Paste Image URL</span>
                </button>
              </div>

              {/* Upload Tab */}
              {activePhotoTab === "upload" && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 bg-white border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                    dragOver
                      ? "border-brand bg-brand/5 scale-[0.99]"
                      : "border-slate-300 hover:border-brand hover:bg-slate-50/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center py-2 space-y-2">
                      <div className="w-7 h-7 border-3 border-brand border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-bold text-slate-700">Compressing to WebP & Uploading to S3...</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-2">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Click or drag & drop variant photo here
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Auto-compressed to WebP (lossless, max 1440px)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Gallery Tab */}
              {activePhotoTab === "gallery" && (
                <div>
                  {images.length === 0 ? (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-2">
                      <p className="text-xs font-medium text-slate-500">
                        No images found in the parent gallery yet.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setActivePhotoTab("upload")}
                        className="text-xs"
                      >
                        Upload directly from Computer
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-[11px] text-slate-500 mb-2 font-medium">
                        Click any image below to link it to this variant:
                      </p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1">
                        {images.map((img) => {
                          const isSelected = imageUrl === img.url;
                          return (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => {
                                setImageUrl(img.url);
                                setAltText(img.altText || generateSuggestedAlt());
                                toast.success("Gallery photo linked!");
                              }}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${
                                isSelected ? "border-brand ring-2 ring-brand/30" : "border-slate-200 hover:border-brand"
                              }`}
                              title={img.altText || "Gallery photo"}
                            >
                              <Image
                                src={img.url}
                                alt={img.altText || "Gallery"}
                                fill
                                sizes="80px"
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                              {img.isBase && (
                                <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow-xs" title="Catalog Front Cover">
                                  <Star size={9} fill="currentColor" />
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute top-1 right-1 bg-brand text-white p-0.5 rounded-full shadow-xs">
                                  <Check size={9} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* URL Tab */}
              {activePhotoTab === "url" && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Direct Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={manualUrlInput}
                      onChange={(e) => setManualUrlInput(e.target.value)}
                      placeholder="https://store4riders.s3.ap-south-2.amazonaws.com/products/..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-brand"
                    />
                    <Button
                      type="button"
                      onClick={handleAttachManualUrl}
                      className="text-xs bg-brand text-white px-4 shrink-0"
                    >
                      Attach
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sync & Batch Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-200/80">
            {/* Set as Main Front Thumbnail Toggle */}
            <label className="flex items-start gap-2.5 p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-50 transition-colors">
              <input
                type="checkbox"
                checked={isCoverImage}
                onChange={(e) => setIsCoverImage(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-amber-950 block flex items-center gap-1.5">
                  <Star size={13} className={isCoverImage ? "text-amber-500 fill-amber-500" : "text-amber-500"} />
                  Set as Main Catalog Cover (Front Thumbnail)
                </span>
                <span className="text-[11px] text-amber-800 block">
                  Show this color&apos;s photo by default on the catalog cards, search results, and initial product hero image.
                </span>
              </div>
            </label>

            {/* Sync to Parent Gallery Toggle */}
            <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={syncToParentGallery}
                onChange={(e) => setSyncToParentGallery(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                  <Eye size={13} className="text-brand" />
                  Sync to Parent Product Gallery
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Automatically adds this variant photo to the parent gallery so customers can view it when selecting &quot;{colorInput || "this color"}&quot; on the storefront.
                </span>
              </div>
            </label>

            {/* Batch Apply to Same Color Group Toggle */}
            {(colorInput.trim() || originalColor) && (
              <label className="flex items-start gap-2.5 p-3 bg-brand/5 rounded-xl border border-brand/20 cursor-pointer hover:bg-brand/10 transition-colors">
                <input
                  type="checkbox"
                  checked={applyToSameColor}
                  onChange={(e) => {
                    setApplyToSameColor(e.target.checked);
                    setApplyToAllSameColor(e.target.checked);
                  }}
                  className="w-4 h-4 mt-0.5 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    {colorInput.trim() && originalColor && colorInput.trim().toLowerCase() !== originalColor.toLowerCase()
                      ? `Apply photo & Alt Text to ALL ${matchingCount} variants (Rename "${originalColor}" → "${colorInput.trim()}")`
                      : `Apply photo & Alt Text to ALL ${matchingCount} variants with color "${colorInput.trim() || originalColor || "this group"}"`}
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-relaxed">
                    Applies this photo and auto-generates size-specific SEO Alt Text for all ${matchingCount} sizes: <strong className="text-slate-700 font-bold">${matchingSizesList || "all sizes"}</strong>
                  </span>

                  <div className="mt-2 pt-2 border-t border-brand/10 flex items-start gap-1.5 text-[11px] text-slate-700 leading-relaxed font-normal">
                    <span className="font-bold text-brand shrink-0">💡 Multi-Color Tip:</span>
                    <span>
                      For dual-tone or multi-color items (e.g. Black boots with Red accents), enter color as <code className="bg-white px-1 py-0.5 rounded font-mono font-bold text-slate-900 border border-slate-300">Black / Red</code> below. This checkbox will update all ${matchingCount} sizes simultaneously with split swatches and size-specific Alt Text.
                    </span>
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* SECTION 2: ATTRIBUTES & OVERRIDES (COLOR, SIZE, WEIGHT, VISIBILITY) */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Variant Attributes & Specifications
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Color Group / Dual-Tone
                  </label>
                  <span className="text-[10.5px] text-slate-500 block">
                    For multi-color gear, write slash-separated e.g. <strong className="font-mono text-slate-800 font-bold">Black / Red</strong>. System auto-renders a 50/50 dual split swatch.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSwatchModalOpen(true)}
                  className="text-[11px] font-bold text-brand hover:text-brand/80 flex items-center gap-1 cursor-pointer"
                >
                  <Palette size={12} />
                  <span>Customize Swatch Palette</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwatchModalOpen(true)}
                  className="relative w-9 h-9 rounded-xl border-2 border-slate-300 shadow-sm cursor-pointer overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 ring-1 ring-black/10 group"
                  style={{
                    background:
                      colorSwatches[colorInput.trim()] ||
                      parseColorToBackground(colorInput.trim() || "Standard") ||
                      "#111111",
                  }}
                  title="Click to open full color swatch palette & multi-tone picker"
                >
                  <span className="text-[9px] font-bold text-white bg-black/60 rounded px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    ✎
                  </span>
                </button>

                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setColorInput(val);
                    if (imageUrl && (!altText.trim() || altText === generateSuggestedAlt(colorInput, sizeInput))) {
                      setAltText(generateSuggestedAlt(val, sizeInput));
                    }
                  }}
                  list="color-presets"
                  placeholder="e.g. Black / Red or Matte Black"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-brand"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSwatchModalOpen(true)}
                  className="text-xs shrink-0 flex items-center gap-1 px-2.5 py-2 cursor-pointer border-slate-300 text-slate-700 hover:text-brand hover:border-brand"
                  title="Customize dual/multi-color swatch"
                >
                  <Palette size={13} className="text-brand" />
                  <span className="hidden sm:inline">Palette</span>
                </Button>
              </div>

              {/* Multi-Color 2, 3 or 4 Split Live Indicator */}
              {isMultiColorDetected && (
                <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-5 h-5 rounded-full border border-black/20 shadow-2xs shrink-0"
                      style={{
                        background:
                          colorSwatches[colorInput.trim()] ||
                          parseColorToBackground(colorInput.trim() || "Standard"),
                      }}
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block text-[11.5px]">
                        {detectedSplitCount === 3
                          ? `3-Way Split (Tri-Color Active: 33% each)`
                          : detectedSplitCount === 4
                          ? `4-Way Split (Quad Graphic Active: 25% each)`
                          : `2-Way Split (Dual-Tone Active: 50% each)`}: &quot;{colorInput}&quot;
                      </span>
                      <span className="text-[10.5px] text-slate-600 block leading-tight">
                        Storefront swatch renders {detectedSplitCount} equal diagonal stripes. Saving applies this photo & Alt Text to all ${matchingCount} sizes.
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0">
                    {detectedSplitCount}-Way Split
                  </span>
                </div>
              )}

              {/* 1-Click 2-Way, 3-Way & 4-Way Split Presets */}
              <div className="pt-1 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    1-Click Split Presets:
                  </span>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveSplitTab("2")}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        activeSplitTab === "2" ? "bg-brand text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      2-Split (Dual)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSplitTab("3")}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        activeSplitTab === "3" ? "bg-brand text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      3-Split (Racing)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSplitTab("4")}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        activeSplitTab === "4" ? "bg-brand text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      4-Split (Graphics)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {MULTI_SPLIT_PRESETS[activeSplitTab].map((p) => {
                    const isActive = colorInput.trim().toLowerCase() === p.name.toLowerCase();
                    const bg =
                      p.c.length === 2
                        ? `linear-gradient(135deg, ${p.c[0]} 0%, ${p.c[0]} 49.5%, ${p.c[1]} 50.5%, ${p.c[1]} 100%)`
                        : p.c.length === 3
                        ? `linear-gradient(135deg, ${p.c[0]} 0%, ${p.c[0]} 32.8%, ${p.c[1]} 33.3%, ${p.c[1]} 66.1%, ${p.c[2]} 66.6%, ${p.c[2]} 100%)`
                        : `linear-gradient(135deg, ${p.c[0]} 0%, ${p.c[0]} 24.5%, ${p.c[1]} 25.5%, ${p.c[1]} 49.5%, ${p.c[2]} 50.5%, ${p.c[2]} 74.5%, ${p.c[3]} 75.5%, ${p.c[3]} 100%)`;

                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setColorInput(p.name);
                          setColorSwatches((prev) => ({
                            ...prev,
                            [p.name]: bg,
                          }));
                          if (imageUrl && (!altText.trim() || altText === generateSuggestedAlt(colorInput, sizeInput))) {
                            setAltText(generateSuggestedAlt(p.name, sizeInput));
                          }
                          toast.info(`Selected "${p.name}" (${activeSplitTab}-way split)`);
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                          isActive
                            ? "border-brand bg-brand/10 text-brand font-bold ring-1 ring-brand"
                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 shadow-2xs"
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs shrink-0"
                          style={{ background: bg }}
                        />
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Size / Volume</label>
              <input
                type="text"
                value={sizeInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSizeInput(val);
                  if (imageUrl && (!altText.trim() || altText === generateSuggestedAlt(colorInput, sizeInput))) {
                    setAltText(generateSuggestedAlt(colorInput, val));
                  }
                }}
                list="size-presets"
                placeholder="e.g. L or 500ml"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Child Weight ({weightUnit})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={weightInput}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
                }}
                onChange={(e) => setWeightInput(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 1.45"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand"
              />
              <p className="text-[10px] text-slate-400 mt-1">Override parent weight for shipping calculations.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Variant Status
              </label>
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value as "enabled" | "disabled")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand"
              >
                <option value="enabled">Enabled (Active for sale)</option>
                <option value="disabled">Disabled (Hidden from riders)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Visibility Options</label>
              <select
                value={visibilityInput}
                onChange={(e) => setVisibilityInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand"
              >
                <option value="Catalog, Search">Catalog, Search (Searchable & Direct Access)</option>
                <option value="Not Visible Individually">Not Visible Individually (Child of Parent Only)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {imageUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearPhoto}
                className="text-xs text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Remove Photo</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVariantImageModalIndex(null)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="text-xs bg-brand hover:bg-brand/90 text-white font-semibold px-5 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check size={14} />
              <span>Save Variant Details</span>
            </Button>
          </div>
        </div>

        {/* Swatch Customizer Modal for 1, 2, 3 or 4 Multi-Colors */}
        {isSwatchModalOpen && (
          <ColorSwatchModal
            isOpen={isSwatchModalOpen}
            colorName={colorInput || "Standard"}
            currentSwatch={colorSwatches[colorInput.trim()] || parseColorToBackground(colorInput.trim() || "Standard")}
            sameColorCount={matchingCount}
            zIndex="z-[70]"
            onClose={() => setIsSwatchModalOpen(false)}
            onSave={(swatchValue, finalColorName) => {
              setColorInput(finalColorName);
              setColorSwatches((prev) => ({
                ...prev,
                [finalColorName]: swatchValue,
              }));
              if (imageUrl && (!altText.trim() || altText === generateSuggestedAlt(colorInput, sizeInput))) {
                setAltText(generateSuggestedAlt(finalColorName, sizeInput));
              }
              setIsSwatchModalOpen(false);
              toast.success(`Color "${finalColorName}" & swatch selected!`);
            }}
            onReset={() => {
              setColorSwatches((prev) => {
                const next = { ...prev };
                delete next[colorInput.trim()];
                return next;
              });
              setIsSwatchModalOpen(false);
              toast.info(`Color swatch reset to auto.`);
            }}
          />
        )}
      </div>
    </div>
  );
}
