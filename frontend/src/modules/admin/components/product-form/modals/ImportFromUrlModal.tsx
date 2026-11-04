"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { CheckSquare, Square, DownloadCloud, AlertCircle, Sparkles, Check, Loader2, Eye, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/core/api/client";

export interface DiscoveredImageItem {
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

interface ImportFromUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
  sourceUrl: string;
  images: DiscoveredImageItem[];
  productName: string;
  onSuccess: (uploadedImages: Array<{ url: string; altText: string; isBase: boolean }>) => void;
}

export function ImportFromUrlModal({
  isOpen,
  onClose,
  pageTitle,
  sourceUrl,
  images,
  productName,
  onSuccess,
}: ImportFromUrlModalProps) {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [altTexts, setAltTexts] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

  const getPreviewUrl = (rawUrl: string) => {
    if (!rawUrl) return "";
    if (rawUrl.startsWith("/")) return rawUrl;
    return `${apiBase}/upload/preview-proxy?url=${encodeURIComponent(rawUrl)}`;
  };

  useEffect(() => {
    if (isOpen && images.length > 0) {
      setSelectedUrls(new Set(images.map((img) => img.url)));
      const initialAlts: Record<string, string> = {};
      images.forEach((img, idx) => {
        initialAlts[img.url] =
          img.altText && img.altText !== pageTitle
            ? img.altText
            : `${productName || pageTitle} - Angle ${idx + 1}`;
      });
      setAltTexts(initialAlts);
    }
  }, [isOpen, images, pageTitle, productName]);

  const toggleSelect = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedUrls(new Set(images.map((img) => img.url)));
  };

  const deselectAll = () => {
    setSelectedUrls(new Set());
  };

  const handleImport = async () => {
    const selectedList = images
      .filter((img) => selectedUrls.has(img.url))
      .map((img) => ({
        url: img.url,
        altText: altTexts[img.url]?.trim() || productName || "Product Photo",
      }));

    if (selectedList.length === 0) {
      toast.error("Please select at least one image to upload");
      return;
    }

    try {
      setIsUploading(true);
      setStatusMessage(`Downloading ${selectedList.length} images & optimizing to WebP...`);

      const res = await apiClient.post("/upload/import-from-url", {
        items: selectedList,
        maxDimension: 1600,
        quality: 0.86,
      });

      const data = res.data?.data;
      if (!data || !data.imported || data.imported.length === 0) {
        throw new Error(data?.errors?.[0]?.error || "No images could be successfully imported");
      }

      const newGalleryItems = data.imported.map((item: any, idx: number) => ({
        url: item.s3Url,
        altText: item.altText,
        isBase: idx === 0,
      }));

      const skippedCount = data.imported.filter((item: any) => item.skippedRecompression).length;
      if (skippedCount > 0) {
        toast.info(
          `Protected quality: ${skippedCount} image(s) were already optimal WebP and kept at 100% original sharpness.`
        );
      }

      if (data.errors && data.errors.length > 0) {
        toast.warning(`${data.errors.length} image(s) could not be downloaded from source.`);
      }

      onSuccess(newGalleryItems);
      toast.success(`Successfully saved ${newGalleryItems.length} photos to Store4Riders!`);
      onClose();
    } catch (err: any) {
      console.error("URL Import error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to import images to Store4Riders");
    } finally {
      setIsUploading(false);
      setStatusMessage("");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isUploading ? () => {} : onClose}
      title="📸 Step 1: Preview Discovered Photos Before Upload"
      maxWidth="max-w-4xl"
    >
      <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[75vh]">
        {/* Source URL Info Banner */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5 min-w-0">
            <p className="font-bold text-sky-950 truncate flex items-center gap-1.5">
              <Eye size={14} className="text-sky-700 shrink-0" />
              <span>Previewing: <span className="font-medium text-sky-800">{pageTitle || sourceUrl}</span></span>
            </p>
            <p className="text-sky-700 truncate font-mono text-[11px]">{sourceUrl}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={selectAll}
              className="px-2.5 py-1 bg-white hover:bg-sky-100 text-sky-900 border border-sky-300 rounded font-semibold transition-colors cursor-pointer"
            >
              Select All ({images.length})
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="px-2.5 py-1 bg-white hover:bg-sky-100 text-slate-700 border border-slate-300 rounded font-medium transition-colors cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Quality Notice */}
        <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
          <Sparkles size={15} className="text-brand shrink-0 mt-0.5" />
          <span>
            <strong>Instructions:</strong> Review the photo thumbnails below. Uncheck any photos you do not want. You can customize the Alt label for each photo (e.g. <em>"Sole View"</em> or <em>"Safety Armor"</em>). When ready, click the <strong>Save to Store4Riders</strong> button at the bottom.
          </span>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {images.map((img, idx) => {
            const isSelected = selectedUrls.has(img.url);
            return (
              <div
                key={img.url + idx}
                onClick={() => !isUploading && toggleSelect(img.url)}
                className={`relative rounded-xl border-2 overflow-hidden transition-all cursor-pointer bg-white flex flex-col ${
                  isSelected
                    ? "border-brand ring-2 ring-brand/20 shadow-xs"
                    : "border-slate-200 opacity-50 hover:opacity-80"
                }`}
              >
                {/* Preview Thumbnail */}
                <div className="relative aspect-square w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  <ImageIcon size={32} className="text-slate-300 absolute pointer-events-none" />
                  <img
                    src={getPreviewUrl(img.url)}
                    alt=""
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-contain p-2 relative z-1"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.triedDirect) {
                        target.dataset.triedDirect = "true";
                        target.src = img.url;
                      }
                    }}
                  />

                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    {isSelected ? (
                      <div className="bg-brand text-white rounded-md p-1 shadow-xs">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="bg-white/90 text-slate-400 rounded-md p-1 border border-slate-300 shadow-xs">
                        <Square size={14} />
                      </div>
                    )}
                  </div>

                  {img.isPrimary && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                      Main Cover
                    </div>
                  )}
                </div>

                {/* Alt Text Label Input */}
                <div className="p-2 border-t border-slate-100 bg-slate-50/50" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={altTexts[img.url] || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAltTexts((prev) => ({ ...prev, [img.url]: val }));
                    }}
                    placeholder="Alt text (e.g. Sole, Safety, Side)"
                    disabled={isUploading}
                    className="w-full text-[11px] px-1.5 py-1 border border-slate-200 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer with Step 2: Upload Action Button */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-600 font-medium">
          Ready: <strong className="text-slate-900">{selectedUrls.size}</strong> of {images.length} photos selected for upload
        </p>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 sm:flex-initial text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleImport}
            disabled={isUploading || selectedUrls.size === 0}
            className="flex-1 sm:flex-initial text-xs gap-1.5 bg-brand hover:bg-brand/90 text-white font-bold shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{statusMessage || "Saving to Store4Riders..."}</span>
              </>
            ) : (
              <>
                <DownloadCloud size={14} />
                <span>Save {selectedUrls.size} Photo(s) to Store4Riders &amp; Attach to Gallery</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
