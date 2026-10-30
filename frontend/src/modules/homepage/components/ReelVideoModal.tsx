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
 * Individual Reel Slide in the Vertical Snap Feed
 */
interface ReelSlideProps {
  reel: IInstagramReel;
  index: number;
  isActive: boolean;
  isNearActive: boolean;
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
  isNearActive,
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
  const [videoError, setVideoError] = useState<boolean>(false);

  const isUploadedVideo =
    !videoError &&
    (reel.videoType === "upload" ||
      /\.(mp4|webm|mov)(\?.*)?$/i.test(reel.videoUrl) ||
      reel.videoUrl?.includes(".mp4") ||
      reel.videoUrl?.includes("fbcdn.net/o1/v/t2/f2"));

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

  // Single tap directly toggles Play / Pause instantly
  const handleVideoClick = (e: React.MouseEvent) => {
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
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden cursor-pointer" onClick={handleVideoClick}>
        {isUploadedVideo ? (
          <>
            {/* Poster Underlay - Ensures 0ms black-frame flicker while video is buffering */}
            {reel.thumbnailUrl && (
              <Image
                src={reel.thumbnailUrl}
                alt={reel.title || "Reel"}
                fill
                priority={isActive}
                className="object-cover -z-10"
                sizes="(max-width: 430px) 100vw, 430px"
                unoptimized={true}
              />
            )}

            <video
              ref={videoRef}
              src={isActive || isNearActive ? reel.videoUrl : undefined}
              preload={isActive ? "auto" : isNearActive ? "metadata" : "none"}
              poster={reel.thumbnailUrl}
              playsInline
              loop
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onError={() => setVideoError(true)}
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
        ) : (
          <div className="w-full h-full relative flex items-center justify-center bg-black">
            {reel.thumbnailUrl && (
              <Image
                src={reel.thumbnailUrl}
                alt={reel.title || "Reel"}
                fill
                priority={isActive}
                className="object-cover opacity-60 filter blur-[1px]"
                sizes="(max-width: 430px) 100vw, 430px"
                unoptimized={true}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/80 flex flex-col items-center justify-center p-6 text-center text-white z-10">
              <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center shadow-xl mb-3 border border-white/20">
                <PlayIcon className="w-7 h-7 text-white/80" />
              </div>

              <p className="text-sm font-bold leading-snug mb-1.5 max-w-[280px]">
                {reel.title || "Store4Riders Reel"}
              </p>

              <p className="text-[11px] text-neutral-300 mb-4 max-w-[240px] leading-relaxed">
                Video is buffering or temporarily unavailable.
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoError(false);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().catch(() => {});
                  }
                }}
                className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white font-medium text-xs flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              >
                <span>Retry Playback</span>
              </button>
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
              Store4Riders Reel
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

      {/* 3. Right Action Rail (Instagram Reels Style) - Shown for native video */}
      {isUploadedVideo && (
        <div
          className="absolute right-3.5 bottom-24 z-30 flex flex-col items-center gap-4.5 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
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
      )}

      {/* 4. Bottom Overlay (Caption, Audio Info & Scrubber Bar) - Shown for native video */}
      {isUploadedVideo && (
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

          {/* Interactive Progress Scrubber Bar */}
          <div
            className="w-full py-1 cursor-pointer group/scrub"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              if (videoRef.current && videoRef.current.duration) {
                videoRef.current.currentTime = clickPos * videoRef.current.duration;
                setProgress(clickPos * 100);
              }
            }}
            title="Click to seek"
          >
            <div className="w-full h-1 group-hover/scrub:h-1.5 bg-white/20 rounded-full overflow-hidden transition-all duration-150">
              <div
                className="h-full bg-gradient-to-r from-banner to-brand transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
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
      {/* Desktop Top-Right Floating Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="hidden sm:flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white/90 hover:text-white backdrop-blur-md absolute top-6 right-6 z-50 transition-all duration-200 hover:scale-110 border border-white/20 shadow-2xl cursor-pointer"
        aria-label="Close Reels Modal"
        title="Close (Escape)"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      {/* Desktop Side Controls (Previous / Next Reel) - Placed cleanly to the right of the phone frame */}
      <div className="hidden lg:flex flex-col gap-3 absolute left-[calc(50%+235px)] top-1/2 -translate-y-1/2 z-50">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          disabled={!hasPrev}
          className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 border shadow-2xl ${
            hasPrev
              ? "bg-white/15 hover:bg-white/30 text-white hover:scale-110 border-white/25 cursor-pointer"
              : "bg-white/5 text-white/20 border-white/10 cursor-not-allowed opacity-40"
          }`}
          aria-label="Previous Reel"
          title="Previous Reel (Arrow Up)"
        >
          <ChevronUpIcon className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          disabled={!hasNext}
          className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 border shadow-2xl ${
            hasNext
              ? "bg-white/15 hover:bg-white/30 text-white hover:scale-110 border-white/25 cursor-pointer"
              : "bg-white/5 text-white/20 border-white/10 cursor-not-allowed opacity-40"
          }`}
          aria-label="Next Reel"
          title="Next Reel (Arrow Down)"
        >
          <ChevronDownIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Fallback Floating Nav for tablet screens (md only) */}
      <div className="hidden md:flex lg:hidden flex-col gap-2.5 absolute right-4 top-1/2 -translate-y-1/2 z-50">
        {hasPrev && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md flex items-center justify-center transition-transform hover:scale-110 border border-white/20 shadow-xl cursor-pointer"
            aria-label="Previous Reel"
            title="Previous Reel"
          >
            <ChevronUpIcon className="w-5 h-5" />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md flex items-center justify-center transition-transform hover:scale-110 border border-white/20 shadow-xl cursor-pointer"
            aria-label="Next Reel"
            title="Next Reel"
          >
            <ChevronDownIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Vertical Snap-Scroll Reel Frame (9:16 Smartphone Ratio) */}
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[430px] h-full sm:h-[92vh] sm:max-h-[820px] bg-black sm:rounded-2xl overflow-y-scroll snap-y snap-mandatory scroll-smooth sm:border sm:border-white/15 shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-y overscroll-y-contain select-none"
      >
        {reels.map((reel, idx) => (
          <ReelSlide
            key={reel.id || reel._id || reel.videoUrl || `reel-slide-${idx}`}
            reel={reel}
            index={idx}
            isActive={idx === activeIndex}
            isNearActive={Math.abs(idx - activeIndex) <= 1}
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
