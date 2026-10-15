"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, Trash2, ArrowLeft, ArrowRight, Loader2, Plus } from "lucide-react";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";
import { toast } from "sonner";

interface MultiImageUploadWebPProps {
  label?: string;
  values: string[];
  onChange: (urls: string[]) => void;
  aspectRatio?: string;
  hint?: string;
  maxImages?: number;
}

export function MultiImageUploadWebP({
  label,
  values = [],
  onChange,
  aspectRatio = "aspect-video",
  hint = "All uploaded images are automatically converted to optimized WebP in your browser.",
  maxImages = 10,
}: MultiImageUploadWebPProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (values.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    try {
      setIsProcessing(true);
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        setCurrentProgress(`Converting ${i + 1}/${files.length} to WebP in browser...`);
        const result = await compressImageToWebP(file, 1920, 0.85);

        setCurrentProgress(`Uploading ${i + 1}/${files.length} to cloud...`);
        const url = await uploadImageToS3(result.file);
        newUrls.push(url);
      }

      onChange([...values, ...newUrls]);
      toast.success(`${newUrls.length} image(s) converted to WebP & uploaded!`);
    } catch (err: any) {
      console.error("Multi-image upload error:", err);
      toast.error(err.message || "Failed to process images");
    } finally {
      setIsProcessing(false);
      setCurrentProgress("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const updated = [...values];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleMove = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= values.length) return;
    const updated = [...values];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    onChange(updated);
  };

  const handleAddManualUrl = () => {
    const url = prompt("Enter image URL:");
    if (url && url.trim()) {
      onChange([...values, url.trim()]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {label} ({values.length}/{maxImages})
          </label>
        )}
        <button
          type="button"
          onClick={handleAddManualUrl}
          className="text-xs text-brand hover:text-brand/80 font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus size={13} />
          <span>Add URL</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Grid of uploaded images */}
      {values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-3">
          {values.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs"
            >
              <div className={`relative w-full ${aspectRatio} bg-slate-100`}>
                <Image
                  src={url}
                  alt={`Image ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Order Badge */}
              <div className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                #{idx + 1}
              </div>

              {/* Hover Controls */}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMove(idx, "left")}
                    title="Move left"
                    className="p-1 rounded-full bg-white text-slate-800 hover:bg-slate-100 shadow transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  title="Remove"
                  className="p-1 rounded-full bg-red-600 text-white hover:bg-red-700 shadow transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>

                {idx < values.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMove(idx, "right")}
                    title="Move right"
                    className="p-1 rounded-full bg-white text-slate-800 hover:bg-slate-100 shadow transition-colors cursor-pointer"
                  >
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dropzone */}
      {values.length < maxImages && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed border-slate-300 hover:border-brand rounded-lg p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all bg-white hover:bg-slate-50/80 text-center shadow-xs ${
            isProcessing ? "opacity-75 pointer-events-none" : ""
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-1.5 py-2">
              <Loader2 className="w-6 h-6 text-brand animate-spin" />
              <p className="text-xs font-bold text-slate-800">{currentProgress}</p>
              <p className="text-[10px] text-slate-500">Auto-converting every image to .webp</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-brand">
                <UploadCloud size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Select Multiple Images (up to {maxImages})
                </p>
                <p className="text-[10px] text-slate-500">
                  Drag & drop or batch select • Auto WebP conversion
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}
