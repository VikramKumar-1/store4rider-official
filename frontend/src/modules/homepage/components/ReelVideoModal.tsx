"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { IInstagramReel } from "@store4riders/shared-types";
import {
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
  ArrowTopRightOnSquareIcon,
  HeartIcon,
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
 * Extracts an embeddable iframe URL from an Instagram link or raw embed string
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

/**
 * Individual Reel Slide in the Vertical Snap Feed
 */
interface ReelSlideProps {
  reel: IInstagramReel;
  index: number;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  instagramHandle: string;
  instagramProfileUrl: string;
  profileAvatarUrl?: string;
  onClose: () => void;
}

const ReelSlide: React.FC<ReelSlideProps> = ({
  reel,
  index,
  isActive,
  isMuted,
  onToggleMute,
  instagramHandle,
  instagramProfileUrl,
  profileAvatarUrl,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [showPlayIconFeedback, setShowPlayIconFeedback] = useState<boolean>(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState<boolean>(false);
  const [hasLiked, setHasLiked] = useState<boolean>(false);

  const isUploadedVideo =
    reel.videoType === "upload" ||
    /\.(mp4|webm|mov)(\?.*)?$/i.test(reel.videoUrl) ||
    reel.videoUrl?.includes(".mp4") ||
    reel.videoUrl?.includes("fbcdn.net/o1/v/t2/f2");

  const embedUrl = !isUploadedVideo ? getEmbedUrl(reel.videoUrl) : "";

  // Play / Pause when active slide changes
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay policy fallback: try muted
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            }
          });
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setProgress(0);
    }
  }, [isActive]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    if (duration > 0) {
      setProgress((current / duration) * 100);
    }
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    setShowPlayIconFeedback(true);
    setTimeout(() => setShowPlayIconFeedback(false), 500);
  };

  return (
    <div
      data-reel-index={index}
      className="snap-start snap-always h-full w-full relative flex-shrink-0 flex items-center justify-center bg-black overflow-hidden select-none"
    >
      {/* 1. Video Player / Embed Stream */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden cursor-pointer" onClick={handleTogglePlay}>
        {isUploadedVideo ? (
          <>
            <video
              ref={videoRef}
              src={reel.videoUrl}
              poster={reel.thumbnailUrl}
              playsInline
              loop
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              className="w-full h-full object-cover"
            />

            {/* Play / Pause Animated Feedback Icon */}
            {showPlayIconFeedback && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-opacity duration-200">
                <div className="w-16 h-16 rounded-full bg-black/65 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-2xl scale-110 transition-transform">
                  {isPlaying ? (
                    <PlayIcon className="w-8 h-8 ml-0.5 text-white" />
                  ) : (
                    <PauseIcon className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
            )}

            {/* Inactive Pause Indicator */}
            {!isPlaying && !showPlayIconFeedback && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none z-20">
                <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-xl">
                  <PlayIcon className="w-7 h-7 ml-0.5 text-white" />
                </div>
              </div>
            )}
          </>
        ) : embedUrl ? (
          <div className="w-full h-full bg-black flex items-center justify-center relative">
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              title={reel.title || "Instagram Reel"}
            />
          </div>
        ) : (
          <div className="w-full h-full relative flex items-center justify-center">
            {reel.thumbnailUrl && (
              <Image
                src={reel.thumbnailUrl}
                alt={reel.title || "Reel"}
                fill
                className="object-cover"
                sizes="(max-width: 420px) 100vw, 420px"
                unoptimized={true}
              />
            )}
            <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center p-6 text-center text-white">
              <p className="text-sm font-semibold mb-3">
                {reel.title || "Store4Riders Instagram Reel"}
              </p>
              <a
                href={reel.instagramUrl || instagramProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-banner to-brand text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
              >
                <span>Watch on Instagram</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Header Bar (Profile Info & Close Button) */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/85 via-black/45 to-transparent pointer-events-auto">
        <a
          href={reel.instagramUrl || instagramProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 group cursor-pointer"
        >
          {/* Avatar with Story Ring */}
          <div className="relative w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900 relative">
              <Image
                src={profileAvatarUrl || "/favicon.png"}
                alt="Store4Riders Logo"
                fill
                className="object-cover"
                sizes="32px"
                unoptimized={true}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-white text-xs font-bold leading-tight flex items-center gap-1 group-hover:text-banner transition-colors">
              @{instagramHandle}
              {/* Verified Blue Checkmark */}
              <svg className="w-3.5 h-3.5 text-[#0095f6] fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7l-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4-8 8z" />
              </svg>
            </span>
            <span className="text-[10px] text-neutral-300 font-medium leading-none">
              {reel.views ? `${reel.views} views` : "Store4Riders Reel"}
            </span>
          </div>
        </a>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <a
            href={reel.instagramUrl || instagramProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-sm transition-colors border border-white/20 shadow-xs"
            title="Follow on Instagram"
          >
            <span>Follow</span>
            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors border border-white/20 shadow-md cursor-pointer"
            aria-label="Close Reels Modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Right Action Rail (Instagram Reels Style) */}
      <div
        className="absolute right-3.5 bottom-24 z-30 flex flex-col items-center gap-4.5 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Like Button */}
        <button
          type="button"
          onClick={() => setHasLiked(!hasLiked)}
          className="flex flex-col items-center gap-1 group cursor-pointer"
          title="Like this reel"
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-transform group-hover:scale-110 shadow-lg ${
              hasLiked
                ? "bg-rose-600/90 border-rose-400 text-white"
                : "bg-black/60 border-white/20 text-white hover:bg-black/80"
            }`}
          >
            <HeartIcon className={`w-5 h-5 ${hasLiked ? "text-white" : "text-white group-hover:text-rose-400"}`} />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">
            {reel.likes || "0"}
          </span>
        </button>

        {/* Views Counter Badge */}
        <div className="flex flex-col items-center gap-1" title="Real Instagram Play Views">
          <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
            <PlayIcon className="w-5 h-5 text-banner" />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">
            {reel.views || "Live"}
          </span>
        </div>

        {/* Global Sound Mute/Unmute Toggle */}
        <button
          type="button"
          onClick={onToggleMute}
          className="flex flex-col items-center gap-1 group cursor-pointer"
          title={isMuted ? "Unmute audio" : "Mute audio"}
        >
          <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition-transform group-hover:scale-110 shadow-lg">
            {isMuted ? (
              <SpeakerXMarkIcon className="w-5 h-5 text-rose-400" />
            ) : (
              <SpeakerWaveIcon className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <span className="text-[9.5px] font-medium text-white/80 drop-shadow-md">
            {isMuted ? "Muted" : "Sound"}
          </span>
        </button>

        {/* External Link: Watch on Instagram */}
        <a
          href={reel.instagramUrl || instagramProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 group cursor-pointer"
          title="Watch reel on Instagram App"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] border border-white/30 backdrop-blur-md flex items-center justify-center text-white transition-transform group-hover:scale-110 shadow-lg">
            <ArrowTopRightOnSquareIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-[9.5px] font-medium text-white/80 drop-shadow-md">
            App
          </span>
        </a>
      </div>

      {/* 4. Bottom Overlay (Caption, Audio Info & Scrubber Bar) */}
      <div
        className="absolute bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Caption text with expandable toggle */}
        {reel.title && (
          <div className="mb-2.5 pr-14 text-left">
            <p
              onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
              className={`text-white text-xs sm:text-[13px] font-medium drop-shadow-md cursor-pointer transition-all ${
                isCaptionExpanded ? "" : "line-clamp-2"
              }`}
            >
              {reel.title}
            </p>
            {reel.title.length > 70 && (
              <button
                type="button"
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                className="text-[10.5px] text-white/70 hover:text-white font-semibold mt-0.5"
              >
                {isCaptionExpanded ? "less" : "more"}
              </button>
            )}
          </div>
        )}

        {/* Audio Track Pill */}
        <div className="flex items-center gap-2 mb-2 pr-14">
          <div className="w-3.5 h-3.5 text-white/80 flex items-center justify-center">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className="text-[10.5px] text-white/80 font-medium truncate">
            Original Audio • @{instagramHandle}
          </span>
        </div>

        {/* Progress Scrubber Bar */}
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-banner to-brand transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Active index lookup
  const initialIndex = useMemo(() => {
    if (!activeReel || !reels || reels.length === 0) return 0;
    const idx = reels.findIndex(
      (r) =>
        (r.id && activeReel.id && r.id === activeReel.id) ||
        (r._id && activeReel._id && r._id === activeReel._id) ||
        (r.videoUrl && activeReel.videoUrl && r.videoUrl === activeReel.videoUrl) ||
        (r.title && activeReel.title && r.title === activeReel.title)
    );
    return idx >= 0 ? idx : 0;
  }, [activeReel, reels]);

  // Initial scroll to target reel on open
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex);
      // Allow DOM to render then scroll
      const timer = setTimeout(() => {
        if (containerRef.current) {
          const targetTop = initialIndex * containerRef.current.clientHeight;
          containerRef.current.scrollTo({ top: targetTop, behavior: "instant" });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialIndex]);

  // Handle vertical scroll with IntersectionObserver
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const slides = container.querySelectorAll<HTMLElement>("[data-reel-index]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const idx = Number(entry.target.getAttribute("data-reel-index"));
            if (!isNaN(idx) && idx !== activeIndex) {
              setActiveIndex(idx);
              if (reels[idx]) {
                onSelectReel(reels[idx]);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: [0.55],
      }
    );

    slides.forEach((slide) => observer.observe(slide));

    return () => {
      observer.disconnect();
    };
  }, [isOpen, reels, onSelectReel, activeIndex]);

  // Navigation helpers
  const scrollToIndex = useCallback(
    (index: number) => {
      if (!containerRef.current || index < 0 || index >= reels.length) return;
      const targetTop = index * containerRef.current.clientHeight;
      containerRef.current.scrollTo({ top: targetTop, behavior: "smooth" });
      setActiveIndex(index);
      if (reels[index]) {
        onSelectReel(reels[index]);
      }
    },
    [reels, onSelectReel]
  );

  const handleNext = useCallback(() => {
    if (activeIndex < reels.length - 1) {
      scrollToIndex(activeIndex + 1);
    }
  }, [activeIndex, reels.length, scrollToIndex]);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1);
    }
  }, [activeIndex, scrollToIndex]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown" || e.key === "j" || e.key === "PageDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "k" || e.key === "PageUp") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "m" || e.key === "M") {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || !reels || reels.length === 0) return null;

  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < reels.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Floating Desktop Up Button (Previous Reel) */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md absolute top-10 left-1/2 -translate-x-1/2 transition-transform hover:scale-110 z-50 border border-white/20 shadow-2xl cursor-pointer"
          aria-label="Previous Reel (Scroll Up)"
          title="Previous Reel (Arrow Up)"
        >
          <ChevronUpIcon className="w-7 h-7" />
        </button>
      )}

      {/* Floating Desktop Down Button (Next Reel) */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md absolute bottom-10 left-1/2 -translate-x-1/2 transition-transform hover:scale-110 z-50 border border-white/20 shadow-2xl cursor-pointer"
          aria-label="Next Reel (Scroll Down)"
          title="Next Reel (Arrow Down)"
        >
          <ChevronDownIcon className="w-7 h-7" />
        </button>
      )}

      {/* Vertical Snap-Scroll Reel Frame (9:16 Smartphone Ratio) */}
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[430px] h-full sm:h-[92vh] sm:max-h-[820px] bg-black sm:rounded-2xl overflow-y-scroll snap-y snap-mandatory scroll-smooth sm:border sm:border-white/15 shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {reels.map((reel, idx) => (
          <ReelSlide
            key={reel.id || reel._id || reel.videoUrl || `reel-slide-${idx}`}
            reel={reel}
            index={idx}
            isActive={idx === activeIndex}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            instagramHandle={instagramHandle}
            instagramProfileUrl={instagramProfileUrl}
            profileAvatarUrl={profileAvatarUrl}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
};
