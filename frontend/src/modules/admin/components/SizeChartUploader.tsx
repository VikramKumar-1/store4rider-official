"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import { 
  Ruler, 
  Upload, 
  Link2, 
  Code, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  AlertCircle,
  AlertTriangle,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";
import { normalizeExternalImageUrl } from "@/core/utils/mediaUrlHelper";
import { apiClient } from "@/core/api/client";
import { SizeChartModal, cleanSizeChartHtml, resolveSizeChartImageUrl } from "@/modules/product-detail/components/SizeChartModal";

interface SizeChartUploaderProps {
  value: string;
  onChange: (value: string) => void;
  categoryDefaultChart?: string;
  categoryName?: string;
  title?: string;
  description?: string;
  isCategoryLevel?: boolean;
}

export const SizeChartUploader: React.FC<SizeChartUploaderProps> = ({
  value,
  onChange,
  categoryDefaultChart,
  categoryName,
  title = "Size Guide / Chart",
  description,
  isCategoryLevel = false,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "html">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewChartData, setPreviewChartData] = useState<string>("");
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCustomChart = Boolean(value && value.trim().length > 0);
  const isImageChart = hasCustomChart && !value.includes("<");
  const isHtmlChart = hasCustomChart && value.includes("<");
  const resolvedImageUrl = useMemo(() => (isImageChart ? resolveSizeChartImageUrl(value) : ""), [isImageChart, value]);

  // Reset image error state whenever value changes
  useEffect(() => {
    setImageLoadError(false);
  }, [value]);

  // Determine what chart is currently active (either custom or inherited)
  const activeEffectiveChart = hasCustomChart ? value : (categoryDefaultChart || "");
  const isInherited = !hasCustomChart && Boolean(categoryDefaultChart);

  // 1. Direct File Upload Handler (Auto WebP with Lossless/High-Fidelity 0.95 Quality)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP, AVIF)");
      return;
    }

    setIsUploading(true);
    setUploadStats("Converting to lossless WebP...");

    try {
      // 0.95 quality + 1800 max dimension for razor-sharp, crisp text & measurement grids
      const compressed = await compressImageToWebP(file, 1800, 0.95);
      const origKb = Math.round(compressed.originalSize / 1024);
      const compKb = Math.round(compressed.compressedSize / 1024);

      setUploadStats(`Optimized: ${origKb} KB → ${compKb} KB (WebP). Uploading to S3...`);

      const s3Url = await uploadImageToS3(compressed.file);
      onChange(s3Url);
      setUploadStats(null);
      toast.success("Size chart uploaded successfully in crystal-clear WebP!");
    } catch (err: any) {
      console.error("Size chart upload error:", err);
      toast.error(err.message || "Failed to convert and upload size chart image");
      setUploadStats(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 2. Extract & Convert from External URL (Direct Image or Webpage)
  const handleExtractFromUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error("Please paste an image URL or webpage URL first");
      return;
    }

    setIsExtracting(true);

    try {
      // Normalize external URLs (Google Drive preview, Dropbox direct, Imgur, etc.)
      const normalized = normalizeExternalImageUrl(trimmed);

      // Check if it's already a direct image extension
      const isDirectImage = /\.(jpe?g|png|webp|avif|gif)(\?.*)?$/i.test(normalized) || normalized.includes("googleusercontent.com");

      let targetImageUrl = normalized;

      if (!isDirectImage) {
        // Scrape webpage to discover high-resolution images
        const scrapeRes = await apiClient.post("/upload/scrape-url", { url: trimmed });
        const scrapeData = scrapeRes.data?.data;

        if (!scrapeData?.images || scrapeData.images.length === 0) {
          throw new Error("Could not find any suitable images at this URL");
        }

        // Look for size chart candidate by keyword
        const sizeKeywords = ["size", "chart", "guide", "dimension", "measurement", "fit"];
        const candidate = scrapeData.images.find((img: any) => {
          const hay = `${img.url} ${img.altText || ""}`.toLowerCase();
          return sizeKeywords.some((kw) => hay.includes(kw));
        }) || scrapeData.images[0];

        targetImageUrl = candidate.url;
      }

      // Convert to WebP on backend & upload directly to S3
      const importRes = await apiClient.post("/upload/import-from-url", {
        items: [{ url: targetImageUrl, altText: "Size Guide" }],
        quality: 0.95, // Near-lossless high fidelity
        maxDimension: 1800,
      });

      const imported = importRes.data?.data?.imported;
      if (!imported || imported.length === 0 || !imported[0]?.s3Url) {
        const errorMsg = importRes.data?.data?.errors?.[0]?.error;
        throw new Error(errorMsg || "Failed to download and convert image");
      }

      const s3Url = imported[0].s3Url;
      onChange(s3Url);
      setUrlInput("");
      toast.success("Size chart extracted, converted to WebP, and saved to S3!");
    } catch (err: any) {
      console.error("URL extraction error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to extract size chart from URL");
    } finally {
      setIsExtracting(false);
    }
  };

  // 3. Handle HTML table paste / edit
  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleCleanHtmlBlur = () => {
    if (value && value.includes("<")) {
      const sanitized = cleanSizeChartHtml(value);
      onChange(sanitized);
    }
  };

  // 4. Open preview modal
  const openPreview = (chartToPreview: string) => {
    setPreviewChartData(chartToPreview);
    setIsPreviewOpen(true);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      {/* Header Bar */}
      <div className="p-3.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <Ruler size={14} className="text-brand" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block leading-tight">
              {title}
            </span>
            <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
              {description || (isCategoryLevel
                ? "This size chart will be inherited by all products in this category unless a product has a custom chart."
                : "Attach a product-specific size chart, or leave empty to inherit from category.")}
            </span>
          </div>
        </div>

        {/* Current status pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {hasCustomChart ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={12} />
              {isImageChart ? "Custom Image (WebP)" : "Custom HTML Table"}
            </span>
          ) : isInherited ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              <Sparkles size={12} />
              Inherited from {categoryName || "Category"}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 italic">No chart attached</span>
          )}
        </div>
      </div>

      {/* Main Content & Mode Tabs */}
      <div className="p-4 space-y-4">
        {/* Inherited Category Banner (when no custom product chart is set) */}
        {!isCategoryLevel && isInherited && !hasCustomChart && (
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-900">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={15} className="text-blue-600 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold block">
                  Category Default Active ({categoryName || "Category"})
                </span>
                <span className="text-[11px] text-blue-700 block truncate">
                  Products in this category automatically show this size guide. Uploading a custom chart below will override it for this product only.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openPreview(categoryDefaultChart!)}
              className="px-2.5 py-1 text-[11px] font-bold text-blue-800 bg-white hover:bg-blue-100 rounded-lg border border-blue-200 shadow-2xs shrink-0 cursor-pointer transition-colors"
            >
              Preview Category Chart
            </button>
          </div>
        )}

        {/* Active Attached Chart Preview Card */}
        {hasCustomChart && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {isImageChart ? (
                <div 
                  onClick={() => openPreview(value)}
                  className="relative w-14 h-14 rounded-lg overflow-hidden bg-white border border-slate-200 shadow-2xs shrink-0 cursor-pointer group flex items-center justify-center"
                  title="Click to preview full size chart"
                >
                  {imageLoadError ? (
                    <div className="flex flex-col items-center justify-center p-1 text-amber-600 bg-amber-50 w-full h-full text-center">
                      <AlertTriangle size={18} />
                      <span className="text-[8px] font-bold mt-0.5 leading-tight">Dead Link</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={resolvedImageUrl}
                        alt="Size Chart Thumbnail"
                        onError={() => setImageLoadError(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye size={14} className="text-white" />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-indigo-50 border border-indigo-200 flex flex-col items-center justify-center shrink-0">
                  <Code size={18} className="text-indigo-600" />
                  <span className="text-[9px] font-bold text-indigo-700 uppercase mt-0.5">Table</span>
                </div>
              )}

              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {isImageChart ? "Attached Image Size Chart" : "HTML Sizing Table"}
                </span>
                <span className="text-[11px] font-mono text-slate-500 block truncate max-w-sm sm:max-w-md">
                  {isImageChart ? value : value.slice(0, 80).replace(/\s+/g, " ")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => openPreview(value)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-brand bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Preview how riders will see this size chart"
              >
                <Eye size={12} />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setImageLoadError(false);
                  setUploadStats(null);
                  toast.success("Size chart removed");
                }}
                className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 rounded-lg border border-red-200 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Remove size chart"
              >
                <Trash2 size={12} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* Broken / Unreachable Image Warning Banner */}
        {hasCustomChart && isImageChart && imageLoadError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-bold block">Broken / Unreachable Size Chart Image</span>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                This image URL cannot be loaded (HTTP 404 Not Found or Access Denied). Click <strong>Clear</strong> to remove it, and either upload a real image file or paste a working URL.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setImageLoadError(false);
                setUploadStats(null);
                toast.success("Broken link cleared");
              }}
              className="px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 shrink-0 cursor-pointer transition-colors"
            >
              Clear Now
            </button>
          </div>
        )}

        {/* Tab Pills for Input Modes */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === "upload"
                ? "bg-brand text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Upload size={13} />
            <span>Upload Image (Lossless WebP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === "url"
                ? "bg-brand text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Link2 size={13} />
            <span>Paste URL (Extract to WebP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("html")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === "html"
                ? "bg-brand text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Code size={13} />
            <span>HTML Table Code</span>
          </button>
        </div>

        {/* Mode 1: Direct File Upload */}
        {activeTab === "upload" && (
          <div className="space-y-3 animate-in fade-in-50 duration-150">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              id="size-chart-file-input"
            />
            <label
              htmlFor="size-chart-file-input"
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isUploading
                  ? "border-brand bg-red-50/30 pointer-events-none"
                  : "border-slate-300 hover:border-brand hover:bg-slate-50/80 bg-slate-50/40"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-brand animate-spin mb-2" />
                  <span className="text-xs font-bold text-slate-800">
                    {uploadStats || "Processing Image..."}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Converting to 0.95 Quality WebP &amp; streaming to S3...
                  </span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-red-50 text-brand flex items-center justify-center mb-2 shadow-2xs">
                    <Upload size={18} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Click to browse or drop Size Chart image here
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Supports PNG, JPG, WEBP. Automatically converts to <strong>crystal-clear lossless WebP</strong>.
                  </span>
                </>
              )}
            </label>
          </div>
        )}

        {/* Mode 2: Extract & Import from URL */}
        {activeTab === "url" && (
          <div className="space-y-3 animate-in fade-in-50 duration-150">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Paste Image URL or Product Webpage URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleExtractFromUrl();
                    }
                  }}
                  placeholder="e.g. https://brand.com/images/size-chart.jpg or webpage URL"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-brand focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleExtractFromUrl}
                  disabled={isExtracting || !urlInput.trim()}
                  className="px-4 py-2 bg-brand text-white font-bold text-xs rounded-lg hover:bg-[#8a1107] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors shrink-0"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Extract &amp; Convert to WebP</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Downloads from external source, converts to high-fidelity WebP without quality loss, and hosts securely on S3.
              </p>
            </div>
          </div>
        )}

        {/* Mode 3: HTML Table Code */}
        {activeTab === "html" && (
          <div className="space-y-2 animate-in fade-in-50 duration-150">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Raw HTML Table Markup</span>
              <span className="text-[10px] text-slate-400 font-normal">Auto-cleaned on blur</span>
            </label>
            <textarea
              rows={4}
              value={value && value.includes("<") ? value : ""}
              onChange={handleHtmlChange}
              onBlur={handleCleanHtmlBlur}
              placeholder="<table><thead><tr><th>Size</th><th>Chest</th></tr></thead><tbody>...</tbody></table>"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-brand focus:outline-none"
            />
          </div>
        )}


      </div>

      {/* Visual Size Chart Rider Preview Modal */}
      <SizeChartModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        sizeChart={previewChartData}
        productName={title}
      />
    </div>
  );
};
