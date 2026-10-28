"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Sliders, X, ImageIcon, Check, Upload, Link as LinkIcon, 
  Trash2, AlertCircle, Sparkles, RefreshCw, Eye, Star 
} from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";
import { normalizeExternalImageUrl } from "@/core/utils/mediaUrlHelper";
import { useProductFormContext } from "../ProductFormContext";
import { parseColorToBackground } from "@/modules/product-detail/components/ProductDetailPageModule";
import { COLOR_OPTIONS, SIZE_OPTIONS } from "../product-specs.constants";

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

  const currentVariant = variantImageModalIndex !== null ? variants[variantImageModalIndex] : null;

  // Initialize modal local state whenever the opened variant changes
  useEffect(() => {
    if (currentVariant) {
      const existingImg = currentVariant.imageUrl || currentVariant.images?.[0]?.url || "";
      const existingAlt = 
        currentVariant.altText || 
        currentVariant.images?.[0]?.altText || 
        (name 
          ? `${name} - ${currentVariant.color || "Variant"}${currentVariant.size ? " (" + currentVariant.size + ")" : ""}`
          : "");

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
    const parts = [name?.trim() || "Product"];
    if (col?.trim()) parts.push(col.trim());
    if (sz?.trim()) parts.push(`(${sz.trim()})`);
    return parts.join(" - ");
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
      if (!altText.trim() || altText === "Product - Variant") {
        setAltText(generateSuggestedAlt());
      }
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
    if (!altText.trim()) {
      setAltText(generateSuggestedAlt());
    }
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

    // 1. Update the variant(s)
    setVariants((prev) =>
      prev.map((v, i) => {
        const isCurrent = i === variantImageModalIndex;
        const isSameColor = 
          applyToSameColor && 
          targetColor && 
          (v.color || "").trim().toLowerCase() === targetColor.toLowerCase();

        if (isCurrent || isSameColor) {
          // Dynamic SEO Alt Text: Ensure other sizes of the same color get their OWN size in alt text, not the current variant's size!
          let variantAlt = trimmedAlt;
          if (!isCurrent) {
            if (sizeInput && v.size && trimmedAlt.toLowerCase().includes(`(${sizeInput.trim().toLowerCase()})`)) {
              variantAlt = trimmedAlt.replace(
                new RegExp(`\\(${sizeInput.trim()}\\)`, "i"),
                `(${v.size})`
              );
            } else if (v.size) {
              variantAlt = generateSuggestedAlt(targetColor, v.size);
            } else {
              variantAlt = trimmedAlt;
            }
          }

          const updatedImages = imageUrl
            ? [{ id: crypto.randomUUID(), url: imageUrl, altText: variantAlt }]
            : [];

          return {
            ...v,
            color: isCurrent ? targetColor : v.color,
            size: isCurrent ? sizeInput.trim() : v.size,
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

    // 2. Sync image into parent gallery if requested (or if marked as catalog cover)
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
                        <Sparkles size={11} /> Auto-suggest
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

            {/* Batch Apply to Same Color Toggle */}
            {colorInput.trim() && (
              <label className="flex items-start gap-2.5 p-2.5 bg-brand/5 rounded-xl border border-brand/20 cursor-pointer hover:bg-brand/10 transition-colors">
                <input
                  type="checkbox"
                  checked={applyToSameColor}
                  onChange={(e) => {
                    setApplyToSameColor(e.target.checked);
                    setApplyToAllSameColor(e.target.checked);
                  }}
                  className="w-4 h-4 mt-0.5 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Apply this photo & Alt Text to ALL variants with color &quot;{colorInput.trim()}&quot;
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Applies to all size variants of this color (e.g. {colorInput} - S, M, L, XL, etc.)
                  </span>
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
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Color Group</span>
                {colorInput.trim() && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {colorSwatches[colorInput.trim()] || "Auto"}
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <label
                  className="relative w-8 h-8 rounded-lg border-2 border-slate-300 shadow-sm cursor-pointer overflow-hidden flex items-center justify-center hover:scale-105 transition-transform shrink-0 ring-1 ring-black/5"
                  style={{
                    background: colorSwatches[colorInput.trim()] || parseColorToBackground(colorInput.trim() || "Standard") || "#111111",
                  }}
                  title={`Click to pick exact color for "${colorInput || "Standard"}"`}
                >
                  <input
                    type="color"
                    value={
                      colorSwatches[colorInput.trim()] ||
                      (parseColorToBackground(colorInput.trim() || "Standard").startsWith("#")
                        ? parseColorToBackground(colorInput.trim() || "Standard")
                        : "#111111")
                    }
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      const colorKey = colorInput.trim() || "Standard";
                      setColorSwatches((prev) => ({
                        ...prev,
                        [colorKey]: val,
                      }));
                    }}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </label>
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
                  placeholder="e.g. Matt Red"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand"
                />
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
      </div>
    </div>
  );
}
