"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, CheckCircle2, Trash2, Loader2, RefreshCw, Link as LinkIcon } from "lucide-react";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";
import { toast } from "sonner";

interface ImageUploadWebPProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  aspectRatio?: string;
  hint?: string;
  recommendedDimensions?: string;
  recommendedRatio?: string;
  safeAreaNotice?: string;
  maxDimension?: number;
  quality?: number;
  className?: string;
}

export function ImageUploadWebP({
  label,
  value,
  onChange,
  aspectRatio = "aspect-video",
  hint = "Images are automatically converted to optimized WebP in your browser before upload.",
  recommendedDimensions,
  recommendedRatio,
  safeAreaNotice,
  maxDimension = 1440,
  quality = 0.82,
  className = "",
}: ImageUploadWebPProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [compressionRatio, setCompressionRatio] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const processAndUploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage("Optimizing to WebP in browser...");

      // 1. Convert to WebP in client browser (0.82 quality for 80-180KB industry standard)
      const result = await compressImageToWebP(file, maxDimension, quality);
      
      const savedPercent = Math.round(
        ((result.originalSize - result.compressedSize) / result.originalSize) * 100
      );
      setCompressionRatio(
        `${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${savedPercent > 0 ? `-${savedPercent}%` : "Optimized"})`
      );

      // 2. Upload WebP file to S3
      setStatusMessage("Uploading WebP to cloud storage...");
      const uploadedUrl = await uploadImageToS3(result.file);

      onChange(uploadedUrl);
      toast.success("Image converted to WebP & uploaded successfully!");
    } catch (err: any) {
      console.error("WebP upload failed:", err);
      toast.error(err.message || "Failed to process and upload image");
    } finally {
      setIsProcessing(false);
      setStatusMessage("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Specifications Box: Explicit Dimensions, Ratio & Safe Area */}
      {(recommendedDimensions || recommendedRatio) && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-md px-2.5 py-1.5 text-xs space-y-1 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
            {recommendedDimensions && (
              <span className="font-semibold text-slate-800">
                <span className="text-slate-500 font-normal">Target Size: </span>
                <span className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-amber-200/60 font-bold">
                  {recommendedDimensions}
                </span>
              </span>
            )}
            {recommendedRatio && (
              <span className="text-[10px] font-bold text-brand bg-white px-1.5 py-0.5 rounded border border-amber-200/60">
                Ratio: {recommendedRatio}
              </span>
            )}
          </div>
          {safeAreaNotice && (
            <p className="text-[10px] text-amber-900/90 font-medium leading-tight">
              ★ {safeAreaNotice}
            </p>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs">
          {/* Preview Image */}
          <div className={`relative w-full ${aspectRatio} bg-slate-100`}>
            <Image
              src={value}
              alt={label || "Uploaded image"}
              fill
              className="object-cover transition-transform group-hover:scale-105 duration-300"
            />
          </div>

          {/* WebP Badge */}
          <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>WebP Ultra-HD</span>
          </div>

          {/* Hover Overlay Actions */}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className="text-slate-600" />
              <span>Change Image</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setCompressionRatio(null);
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Remove</span>
            </button>
          </div>

          {/* Direct URL input fallback */}
          <div className="p-2 bg-white border-t border-slate-200 flex items-center gap-2">
            <LinkIcon size={12} className="text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Or paste external image URL"
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md focus:outline-none focus:border-brand"
            />
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed border-slate-300 hover:border-brand rounded-lg p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all bg-white hover:bg-slate-50/80 text-center shadow-xs ${
            isProcessing ? "opacity-75 pointer-events-none" : ""
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-1.5 py-2">
              <Loader2 className="w-6 h-6 text-brand animate-spin" />
              <p className="text-xs font-bold text-slate-800">{statusMessage}</p>
              <p className="text-[10px] text-slate-500">Fast WebP Compression (~80–180 KB Target)</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-brand">
                <UploadCloud size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Click to upload or drag & drop
                </p>
                <p className="text-[10px] text-slate-500">
                  PNG, JPG, WEBP • Auto WebP (~80–180 KB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {compressionRatio && (
        <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
          <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
          <span>WebP Processed: {compressionRatio}</span>
        </p>
      )}

      {hint && (
        <p className="text-[11px] text-slate-500 leading-tight">{hint}</p>
      )}
    </div>
  );
}
