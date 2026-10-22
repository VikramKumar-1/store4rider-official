"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { IInstagramReel } from "@store4riders/shared-types";
import { ImageUploadWebP } from "./ImageUploadWebP";
import { uploadVideoToS3 } from "@/core/utils/videoUploader";
import {
  X,
  Instagram,
  Video,
  UploadCloud,
  CheckCircle2,
  Loader2,
  Play,
  Film,
  Eye,
  Heart,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface ReelEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReel: IInstagramReel | null;
  onSave: (reel: IInstagramReel) => void;
}

export function ReelEditorModal({
  isOpen,
  onClose,
  initialReel,
  onSave,
}: ReelEditorModalProps) {
  const [title, setTitle] = useState("");
  const [videoType, setVideoType] = useState<"upload" | "embed">("embed");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("https://www.instagram.com/store4riders/");
  const [views, setViews] = useState("12.5K");
  const [likes, setLikes] = useState("1.1K");
  const [author, setAuthor] = useState("@store4riders");
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Video upload state
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when initialReel changes
  useEffect(() => {
    if (initialReel) {
      setTitle(initialReel.title || "");
      setVideoType(initialReel.videoType || "embed");
      setVideoUrl(initialReel.videoUrl || "");
      setThumbnailUrl(initialReel.thumbnailUrl || "");
      setInstagramUrl(initialReel.instagramUrl || "https://www.instagram.com/store4riders/");
      setViews(initialReel.views || "12.5K");
      setLikes(initialReel.likes || "1.1K");
      setAuthor(initialReel.author || "@store4riders");
      setOrder(initialReel.order || 0);
      setIsActive(initialReel.isActive !== false);
    } else {
      setTitle("");
      setVideoType("embed");
      setVideoUrl("");
      setThumbnailUrl("");
      setInstagramUrl("https://www.instagram.com/store4riders/");
      setViews("12.5K");
      setLikes("1.1K");
      setAuthor("@store4riders");
      setOrder(0);
      setIsActive(true);
    }
    setUploadProgress(0);
    setIsUploadingVideo(false);
  }, [initialReel, isOpen]);

  if (!isOpen) return null;

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingVideo(true);
      setUploadProgress(5);

      // Auto-extract cover frame from video if not provided
      if (!thumbnailUrl) {
        try {
          const videoEl = document.createElement("video");
          videoEl.preload = "metadata";
          videoEl.src = URL.createObjectURL(file);
          videoEl.muted = true;
          videoEl.currentTime = 1;
          videoEl.onloadeddata = () => {
            const canvas = document.createElement("canvas");
            canvas.width = videoEl.videoWidth || 400;
            canvas.height = videoEl.videoHeight || 500;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL("image/webp", 0.85);
              if (dataUrl) setThumbnailUrl(dataUrl);
            }
          };
        } catch {
          // Ignore canvas extraction error
        }
      }

      const uploadedUrl = await uploadVideoToS3(file, (percent) => {
        setUploadProgress(percent);
      });

      setVideoUrl(uploadedUrl);
      setVideoType("upload");
      toast.success("Video uploaded successfully to cloud storage!");
    } catch (err: any) {
      console.error("Video upload error:", err);
      toast.error(err.message || "Failed to upload video");
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoUrl.trim()) {
      toast.error("Please provide an Instagram Reel link or upload a video file");
      return;
    }

    let cleanedVideoUrl = videoUrl.trim();
    const igMatch = cleanedVideoUrl.match(/(https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p|tv)\/[^/?#&]+)/i);
    if (igMatch && igMatch[1]) {
      cleanedVideoUrl = `${igMatch[1]}/`;
    }

    const defaultFallbackThumbnail =
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&h=600&q=80";

    const finalThumbnail = thumbnailUrl.trim() || defaultFallbackThumbnail;

    const savedReel: IInstagramReel = {
      _id: initialReel?._id,
      id: initialReel?.id,
      title: title.trim() || "Store4Riders Reel",
      thumbnailUrl: finalThumbnail,
      videoType,
      videoUrl: cleanedVideoUrl,
      instagramUrl:
        instagramUrl.trim() && instagramUrl.trim() !== "https://www.instagram.com/store4riders/"
          ? instagramUrl.trim()
          : igMatch
          ? cleanedVideoUrl
          : "https://www.instagram.com/store4riders/",
      views: views.trim() || "12.5K",
      likes: likes.trim() || "1.1K",
      author: author.trim() || "@store4riders",
      order: Number(order) || 0,
      isActive,
    };

    onSave(savedReel);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-xs">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {initialReel ? "Edit Instagram Reel" : "Add New Instagram Reel"}
              </h3>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                Configure video link, thumbnail, stats, and modal viewer settings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Reel Caption / Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reel Title / Caption <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MT Thunder 4 SV Helmet Unboxing & Sound Test"
              className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-lg focus:outline-none focus:border-brand font-medium shadow-2xs"
              required
            />
          </div>

          {/* Video Source Type Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Video Source Type <span className="text-brand">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setVideoType("embed")}
                className={`py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  videoType === "embed"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Instagram className="w-3.5 h-3.5 text-[#e1306c]" />
                <span>Instagram Reel / Embed Link</span>
              </button>

              <button
                type="button"
                onClick={() => setVideoType("upload")}
                className={`py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  videoType === "upload"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Video className="w-3.5 h-3.5 text-brand" />
                <span>Video Upload / MP4 URL</span>
              </button>
            </div>
          </div>

          {/* Video URL or Upload Section */}
          {videoType === "embed" ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase">
                  Instagram Reel URL or Embed Code
                </span>
                <span className="text-[10px] text-slate-500">
                  Accepts reel link or &lt;iframe&gt; code
                </span>
              </div>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/C8-0xO9pQ2m/ or embed link"
                className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-md focus:outline-none focus:border-brand font-mono text-xs shadow-2xs"
                required={videoType === "embed"}
              />
              <p className="text-[10px] text-slate-500">
                Tip: Copy any link from Instagram app or web browser (e.g. <code>https://www.instagram.com/reel/...</code>). The player will embed it automatically in the video modal.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase">
                  Direct Video File (.mp4 / .webm)
                </span>
                <span className="text-[10px] text-slate-500">Max size 50MB</span>
              </div>

              {/* Upload Button & Progress */}
              <div className="flex items-center gap-3">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoFileSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploadingVideo}
                  className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:border-brand text-slate-700 font-bold flex items-center gap-2 transition-all shadow-2xs hover:bg-slate-50"
                >
                  {isUploadingVideo ? (
                    <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  ) : (
                    <UploadCloud className="w-4 h-4 text-brand" />
                  )}
                  <span>{isUploadingVideo ? `Uploading (${uploadProgress}%)` : "Select Video File"}</span>
                </button>

                {videoUrl && (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 truncate max-w-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Video configured</span>
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {isUploadingVideo && (
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand h-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {/* Or manual URL input */}
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-1">
                  Or enter direct public video URL:
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://.../my-reel.mp4"
                  className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-mono text-xs shadow-2xs"
                  required={videoType === "upload"}
                />
              </div>
            </div>
          )}

          {/* Cover Thumbnail Image (WebP Uploader) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start pt-2 border-t border-slate-100">
            <div className="sm:col-span-5">
              <ImageUploadWebP
                label="Reel Cover Thumbnail (9:16 Aspect) *"
                value={thumbnailUrl}
                onChange={(url) => setThumbnailUrl(url)}
                aspectRatio="aspect-[9/16]"
                hint="Upload vertical cover image. Auto converts to WebP."
              />
            </div>

            <div className="sm:col-span-7 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Or Paste Thumbnail Image URL
                </label>
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://.../thumbnail.jpg"
                  className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-mono text-xs shadow-2xs"
                />
              </div>

              {/* Quick Motorcycle Cover Presets */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Or Pick a Preset Rider Cover
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[
                    { label: "Helmet", url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&h=600&q=80" },
                    { label: "Track", url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=400&h=600&q=80" },
                    { label: "Exhaust", url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&h=600&q=80" },
                    { label: "Jacket", url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=600&q=80" },
                    { label: "Gloves", url: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&h=600&q=80" },
                    { label: "Touring", url: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=400&h=600&q=80" },
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setThumbnailUrl(preset.url)}
                      className={`relative aspect-[3/4] rounded-md border overflow-hidden transition-all cursor-pointer ${
                        thumbnailUrl === preset.url
                          ? "border-brand ring-2 ring-brand/40 shadow-xs"
                          : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                      }`}
                      title={preset.label}
                    >
                      <Image
                        src={preset.url}
                        alt={preset.label}
                        fill
                        className="object-cover"
                        sizes="60px"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Views and Likes */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" />
                    <span>Views Count</span>
                  </label>
                  <input
                    type="text"
                    value={views}
                    onChange={(e) => setViews(e.target.value)}
                    placeholder="e.g. 14.8K"
                    className="w-full bg-white border border-slate-300 text-slate-900 px-2.5 py-1.5 rounded-md focus:outline-none focus:border-brand text-xs font-semibold shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500" />
                    <span>Likes Count</span>
                  </label>
                  <input
                    type="text"
                    value={likes}
                    onChange={(e) => setLikes(e.target.value)}
                    placeholder="e.g. 1.2K"
                    className="w-full bg-white border border-slate-300 text-slate-900 px-2.5 py-1.5 rounded-md focus:outline-none focus:border-brand text-xs font-semibold shadow-2xs"
                  />
                </div>
              </div>

              {/* Instagram URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                  <span>Instagram Post Link</span>
                </label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/store4riders/"
                  className="w-full bg-white border border-slate-300 text-slate-900 px-2.5 py-1.5 rounded-md focus:outline-none focus:border-brand text-xs shadow-2xs"
                />
              </div>

              {/* Order & Active Status */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={order}
                    onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault(); }}
                    onChange={(e) => setOrder(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-300 text-slate-900 px-2.5 py-1.5 rounded-md focus:outline-none focus:border-brand text-xs font-semibold shadow-2xs"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-brand rounded focus:ring-brand accent-brand cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Active on Storefront
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Reel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
