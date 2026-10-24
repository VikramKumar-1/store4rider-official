"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { IInstagramReel } from "@store4riders/shared-types";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/solid";

interface ReelVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeReel: IInstagramReel | null;
  reels: IInstagramReel[];
  onSelectReel: (reel: IInstagramReel) => void;
  instagramHandle?: string;
  instagramProfileUrl?: string;
  profileAvatarUrl?: string;
}

/**
 * Extracts a embeddable iframe URL from an Instagram link or raw embed string
 */
function getEmbedUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  const trimmed = rawUrl.trim();

  // If user pasted full <iframe> code, extract src
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1];
  }

  // If user pasted Instagram link: instagram.com/reel/CODE or instagram.com/p/CODE
  const igMatch = trimmed.match(/instagram\.com\/(?:reel|p|tv)\/([^/?#&]+)/i);
  if (igMatch && igMatch[1]) {
    return `https://www.instagram.com/reel/${igMatch[1]}/embed/`;
  }

  // YouTube Shorts or standard YouTube video
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([^/?#&]+)/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1`;
  }

  // If it's an Instagram profile link (not a specific reel), don't embed inside iframe as Instagram blocks it
  if (/instagram\.com\/[^/?#&]+\/?$/i.test(trimmed) && !/instagram\.com\/(?:reel|p|tv)\//i.test(trimmed)) {
    return "";
  }

  return trimmed;
}

export const ReelVideoModal: React.FC<ReelVideoModalProps> = ({
  isOpen,
  onClose,
  activeReel,
  reels,
  onSelectReel,
  instagramHandle = "store4riders",
  instagramProfileUrl = "https://www.instagram.com/store4riders/",
  profileAvatarUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Determine current reel index and navigation
  const currentIndex = useMemo(() => {
    if (!activeReel) return -1;
    return reels.findIndex(
      (r) =>
        (r._id && r._id === activeReel._id) ||
        (r.videoUrl && r.videoUrl === activeReel.videoUrl) ||
        (r.title && r.title === activeReel.title)
    );
  }, [activeReel, reels]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < reels.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onSelectReel(reels[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelectReel(reels[currentIndex + 1]);
    }
  };

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (hasPrev) handlePrev();
      } else if (e.key === "ArrowRight") {
        if (hasNext) handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, hasPrev, hasNext, currentIndex]);

  // Reset video state when active reel changes
  useEffect(() => {
    setIsPlaying(true);
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
        setIsPlaying(false);
      });
    }
  }, [activeReel]);

  if (!isOpen || !activeReel) return null;

  const isUploadedVideo =
    activeReel.videoType === "upload" ||
    /\.(mp4|webm|mov)(\?.*)?$/i.test(activeReel.videoUrl) ||
    activeReel.videoUrl?.includes(".mp4") ||
    activeReel.videoUrl?.includes("fbcdn.net/o1/v/t2/f2");

  const embedUrl = !isUploadedVideo ? getEmbedUrl(activeReel.videoUrl) : "";

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    if (duration > 0) {
      setProgress((current / duration) * 100);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Floating Prev Button (Desktop) */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 transition-transform hover:scale-110 z-50 border border-white/20 shadow-xl"
          aria-label="Previous Reel"
        >
          <ChevronLeftIcon className="w-7 h-7" />
        </button>
      )}

      {/* Floating Next Button (Desktop) */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 transition-transform hover:scale-110 z-50 border border-white/20 shadow-xl"
          aria-label="Next Reel"
        >
          <ChevronRightIcon className="w-7 h-7" />
        </button>
      )}

      {/* Modal Frame - 9:16 Aspect Smartphone Container */}
      <div
        className="relative w-full max-w-[420px] h-[85vh] sm:h-[88vh] max-h-[760px] bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl border border-white/15 flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* Instagram Account Pill */}
          <a
            href={activeReel.instagramUrl || instagramProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="relative w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900 relative">
                <Image
                  src={profileAvatarUrl || "/favicon.png"}
                  alt="Store4Riders Logo"
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-xs font-bold leading-tight flex items-center gap-1 group-hover:text-banner transition-colors">
                @{instagramHandle}
                <span className="w-1.5 h-1.5 rounded-full bg-banner inline-block" />
              </span>
              <span className="text-[10px] text-neutral-300 font-medium leading-none">
                {activeReel.views ? `${activeReel.views} views` : "Store4Riders Reel"}
              </span>
            </div>
          </a>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <a
              href={activeReel.instagramUrl || instagramProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-sm transition-colors border border-white/20"
              title="Watch on Instagram"
            >
              <span>Follow</span>
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors border border-white/20 shadow-md"
              aria-label="Close Modal"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
          {isUploadedVideo ? (
            <div
              className="relative w-full h-full flex items-center justify-center cursor-pointer group"
              onClick={togglePlay}
            >
              <video
                ref={videoRef}
                src={activeReel.videoUrl}
                poster={activeReel.thumbnailUrl}
                playsInline
                autoPlay
                loop
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-cover"
              />

              {/* Pause/Play Overlay Icon */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-2xl">
                    <PlayIcon className="w-8 h-8 ml-1" />
                  </div>
                </div>
              )}

              {/* In-video controls for uploaded video */}
              <div
                className="absolute top-16 right-3.5 z-20 flex flex-col gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={toggleMute}
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 backdrop-blur-sm transition-transform hover:scale-105"
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="w-4 h-4 text-red-400" />
                  ) : (
                    <SpeakerWaveIcon className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>

              {/* Progress Scrubber Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                <div
                  className="h-full bg-gradient-to-r from-banner to-brand transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : embedUrl ? (
            <div className="w-full h-full bg-black flex items-center justify-center relative">
              <iframe
                src={embedUrl}
                className="w-full h-full border-0 rounded-2xl"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                title={activeReel.title || "Instagram Reel"}
              />
            </div>
          ) : (
            /* Fallback if no valid URL is configured */
            <div className="w-full h-full relative flex items-center justify-center">
              <Image
                src={activeReel.thumbnailUrl || "/reel-1.jpg"}
                alt={activeReel.title || "Reel"}
                fill
                className="object-cover"
                sizes="(max-width: 420px) 100vw, 420px"
              />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-6 text-center text-white">
                <p className="text-sm font-semibold mb-3">
                  {activeReel.title || "Store4Riders Instagram Reel"}
                </p>
                <a
                  href={activeReel.instagramUrl || instagramProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-banner to-brand text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
                >
                  <span>Open on Instagram</span>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Overlay: Caption & Link (Shown only for uploaded video or fallback so it doesn't overlap IG embed) */}
        {isUploadedVideo && (
          <div className="absolute bottom-1 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-auto">
            {activeReel.title && (
              <p className="text-white text-xs sm:text-sm font-medium line-clamp-2 drop-shadow-md mb-2">
                {activeReel.title}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] text-neutral-300">
              <div className="flex items-center gap-3 font-semibold">
                {activeReel.views && (
                  <span className="flex items-center gap-1">
                    <PlayIcon className="w-3.5 h-3.5 text-white" />
                    {activeReel.views}
                  </span>
                )}
                {activeReel.likes && <span>❤️ {activeReel.likes} likes</span>}
              </div>

              <a
                href={activeReel.instagramUrl || instagramProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-banner hover:text-white font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 transition-colors"
              >
                <span>View on App</span>
                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
