"use client";

import React from "react";
import Image from "next/image";
import { ImageIcon, Upload, Star, ChevronLeft, ChevronRight, Trash2, Eye, Sparkles, Play } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";
import { StorefrontCardPreview } from "@/modules/admin/components/StorefrontCardPreview";
import { normalizeExternalImageUrl, getVideoEmbedInfo } from "@/core/utils/mediaUrlHelper";
import { useProductFormContext } from "../ProductFormContext";

export function ProductMediaTab() {
  const [isAdminVideoPlaying, setIsAdminVideoPlaying] = React.useState(false);
  const {
    name,
    brand,
    basePrice,
    specialPrice,
    images,
    setImages,
    variants,
    setVariantImageModalIndex,
    videoUrl,
    setVideoUrl,
    manualImageUrl,
    setManualImageUrl,
    manualImageAlt,
    setManualImageAlt,
    isCompressing,
    setIsCompressing,
    compressionBadge,
    setCompressionBadge,
    setPrimaryImage,
    productType,
    handleTabChange,
  } = useProductFormContext();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    setCompressionBadge("Compressing to WebP (0.85 quality)...");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { file: webpFile, originalSize, compressedSize } = await compressImageToWebP(file, 1600, 0.85);

        const origKb = Math.round(originalSize / 1024);
        const compKb = Math.round(compressedSize / 1024);
        setCompressionBadge(`Compressed: ${origKb} KB ➔ ${compKb} KB (WebP). Uploading...`);

        let finalUrl = "";
        try {
          finalUrl = await uploadImageToS3(webpFile);
        } catch (uploadErr) {
          console.warn("S3 upload failed, using object URL fallback", uploadErr);
          finalUrl = URL.createObjectURL(webpFile);
          toast.warning("S3 credentials inactive. Image saved with temporary URL.");
        }

        setImages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            url: finalUrl,
            altText: name || file.name.replace(/\.[^/.]+$/, ""),
            isBase: prev.length === 0,
          },
        ]);
      }
      toast.success("Images compressed and attached successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to process images");
    } finally {
      setIsCompressing(false);
      setCompressionBadge(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleAddManualImage = () => {
    const cleanUrl = normalizeExternalImageUrl(manualImageUrl);
    if (!cleanUrl) {
      toast.error("Please enter a valid image URL");
      return;
    }
    setImages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        url: cleanUrl,
        altText: manualImageAlt.trim() || name,
        isBase: prev.length === 0,
      },
    ]);
    setManualImageUrl("");
    setManualImageAlt("");
    toast.success("Image URL normalized & attached to gallery!");
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.isBase)) {
        updated[0].isBase = true;
      }
      return updated;
    });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const item = next.splice(fromIndex, 1)[0];
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <ImageIcon className="text-brand" size={18} />
            Gallery & Auto-WebP Compression
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Drop multiple product photos — automatically compressed to lossless WebP in browser and uploaded to S3.
          </p>
        </div>
      </div>

      {/* Smart Helper Banner for Configurable Products */}
      {productType === "configurable" && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row items-start justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <Sparkles className="text-sky-600 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <span>Configurable Product with Child Variants Detected</span>
                <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.2 rounded-full font-semibold">Zero Duplicate Uploads</span>
              </h4>
              <p className="text-xs text-sky-800 leading-relaxed max-w-2xl">
                Have different colors &amp; sizes (like Helmets or Jackets)? You do <strong>not</strong> need to upload photos twice:
              </p>
              <ul className="text-[11px] text-sky-900 space-y-1 pt-1 list-disc list-inside">
                <li>
                  <strong>Option A (Fastest):</strong> Skip this tab and go to <strong>Step 5 (Variants Matrix)</strong>. Upload 1 photo per color there, and simply click <span className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-semibold text-slate-800">★ Set as Front Thumbnail</span>. It will automatically become your catalog cover!
                </li>
                <li>
                  <strong>Option B:</strong> Drop all your photos here right now. In Step 5, you can click any photo from your gallery to link it to its color in 1 second.
                </li>
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleTabChange("variants")}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs self-start sm:self-center"
          >
            <span>Skip to Step 5 (Variants)</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-slate-200 hover:border-brand/50 rounded-xl p-8 text-center transition-colors bg-slate-50/50">
        <Upload className="mx-auto text-slate-400 mb-3" size={36} />
        <p className="text-sm font-medium text-slate-700">
          Drag & Drop product images or{" "}
          <label className="text-brand hover:underline cursor-pointer">
            browse
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isCompressing}
            />
          </label>
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Supports JPG, PNG, WebP up to 25MB (Auto-compressed to ~250KB WebP)
        </p>

        {isCompressing && (
          <div className="mt-4 flex items-center justify-center gap-2 text-brand text-xs font-semibold">
            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            <span>{compressionBadge || "Processing..."}</span>
          </div>
        )}
      </div>

      {/* Manual URL input */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={manualImageUrl}
            onChange={(e) => setManualImageUrl(e.target.value)}
            placeholder="Or paste external Image URL (e.g. S3 or CDN link)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="w-48">
          <input
            type="text"
            value={manualImageAlt}
            onChange={(e) => setManualImageAlt(e.target.value)}
            placeholder="Alt label (optional)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <Button type="button" variant="outline" onClick={handleAddManualImage} className="text-xs">
          Add URL
        </Button>
      </div>

      {/* Images Grid */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h4 className="text-sm font-semibold text-slate-700">Product Gallery ({images.length} images)</h4>
          <p className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
            💡 <strong>SEO & Swatch Tip:</strong> Set Alt text with the color name (e.g.{" "}
            <em>&quot;{name || "Product"} - Matte Black&quot;</em>) to auto-link with customer color swatches!
          </p>
        </div>
        {images.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No images attached yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className={`relative group bg-white border rounded-xl overflow-hidden shadow-2xs transition-all ${
                  img.isBase ? "ring-2 ring-brand border-transparent" : "border-slate-200"
                }`}
              >
                <div className="relative aspect-square w-full bg-slate-100">
                  <Image
                    src={normalizeExternalImageUrl(img.url)}
                    alt={img.altText || "Product preview"}
                    fill
                    unoptimized
                    referrerPolicy="no-referrer"
                    sizes="200px"
                    className="object-cover"
                  />
                  {img.isBase ? (
                    <div className="absolute top-2 left-2 bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <Star size={10} fill="currentColor" />
                      <span>Parent Cover (Card Thumbnail)</span>
                    </div>
                  ) : (
                    <div className="absolute top-2 left-2 bg-slate-900/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                      <span>Photo #{idx + 1}</span>
                    </div>
                  )}

                  {/* Show if linked to a variant color */}
                  {variants.some((v) => v.imageUrl === img.url) && (
                    <div className="absolute bottom-2 left-2 bg-emerald-600/95 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>Linked: {variants.find((v) => v.imageUrl === img.url)?.color}</span>
                    </div>
                  )}
                </div>

                <div className="p-2 space-y-1.5 bg-white">
                  <input
                    type="text"
                    value={img.altText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setImages((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, altText: val } : item))
                      );
                    }}
                    placeholder="Required: Image Alt text (e.g. Red, Black)"
                    required
                    className="w-full text-[11px] px-1.5 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand"
                  />

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveImage(idx, idx - 1)}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-25 disabled:cursor-not-allowed rounded hover:bg-slate-100 cursor-pointer"
                        title="Move Left"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => moveImage(idx, idx + 1)}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-25 disabled:cursor-not-allowed rounded hover:bg-slate-100 cursor-pointer"
                        title="Move Right"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>

                    {!img.isBase ? (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(idx)}
                        className="text-[11px] text-slate-600 hover:text-brand font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Star size={12} />
                        <span>Set Main</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold">Primary</span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                      title="Remove Image"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">
            YouTube / Video Embed URL
          </label>
          {videoUrl && (
            <button
              type="button"
              onClick={() => setVideoUrl("")}
              className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
            >
              Clear Video
            </button>
          )}
        </div>
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => {
            setVideoUrl(e.target.value);
            setIsAdminVideoPlaying(false);
          }}
          placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <p className="text-[11px] text-slate-500">
          Supports YouTube (standard watch, shorts, live), Vimeo, and direct MP4/WebM video URLs. Renders directly on the customer product detail page.
        </p>

        {/* Live Admin Video Preview */}
        {(() => {
          if (!videoUrl || !videoUrl.trim()) return null;
          const embed = getVideoEmbedInfo(videoUrl);
          if (!embed) {
            return (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <span>⚠️ Video link not recognized yet. Please paste a valid YouTube, Vimeo, or direct MP4 link.</span>
              </div>
            );
          }
          return (
            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Video Preview ({embed.type.toUpperCase()})
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Ready for Storefront
                </span>
              </div>
              <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden bg-black shadow-sm border border-slate-200 relative group">
                {isAdminVideoPlaying ? (
                  embed.type === "youtube" || embed.type === "vimeo" || embed.type === "iframe" ? (
                    <iframe
                      src={`${embed.embedUrl}${embed.embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
                      title="Product Video Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={embed.embedUrl} controls autoPlay className="w-full h-full object-contain" />
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAdminVideoPlaying(true)}
                    className="w-full h-full relative flex items-center justify-center cursor-pointer group focus:outline-none"
                  >
                    {embed.thumbnailUrl ? (
                      <img
                        src={embed.thumbnailUrl}
                        alt="Video Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <div className="relative z-10 flex items-center gap-1.5 bg-brand text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg group-hover:scale-105 active:scale-95 transition-transform">
                      <Play size={14} fill="currentColor" />
                      <span>Test Video Player</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Live Customer Storefront Card & Swatches Preview inside Media Tab */}
      <div className="border-t border-slate-200 pt-6">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Eye className="text-brand" size={16} />
            Live Customer Card & Thumbnail Preview
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify how your primary cover photo, brand, price, and color swatches appear to customers on catalog pages.
          </p>
        </div>

        <StorefrontCardPreview
          name={name}
          brand={brand}
          basePrice={basePrice}
          specialPrice={specialPrice}
          images={images}
          variants={variants}
          onSetPrimaryImage={(idx) => setPrimaryImage(idx)}
          onSelectColorPhoto={(targetColor) => {
            const idx = variants.findIndex(
              (v) => (v.color || "Standard").toLowerCase() === targetColor.toLowerCase()
            );
            if (idx !== -1) {
              setVariantImageModalIndex(idx);
            } else {
              toast.info(`Please add a variant with color "${targetColor}" in Tab 5 first.`);
            }
          }}
        />
      </div>
    </div>
  );
}
