"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { StarIcon, XMarkIcon, CheckBadgeIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAddReview } from "@/core/hooks/useProducts";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

const RATING_FEEDBACK: Record<number, { title: string; subtitle: string; color: string; bg: string }> = {
  5: { title: "5.0 — Excellent", subtitle: "Highly recommended for other riders", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200/80" },
  4: { title: "4.0 — Very Good", subtitle: "Great gear with minor notes", color: "text-amber-800", bg: "bg-amber-50 border-amber-200/80" },
  3: { title: "3.0 — Average", subtitle: "Meets basic expectations", color: "text-neutral-700", bg: "bg-neutral-100 border-neutral-200" },
  2: { title: "2.0 — Fair", subtitle: "Has some noticeable drawbacks", color: "text-orange-800", bg: "bg-orange-50 border-orange-200/80" },
  1: { title: "1.0 — Poor", subtitle: "Did not meet expectations", color: "text-red-800", bg: "bg-red-50 border-red-200/80" },
};

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
}) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [website, setWebsite] = useState<string>(""); // Honeypot trap
  const [mounted, setMounted] = useState<boolean>(false);

  const addReviewMutation = useAddReview(productId);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      setUserName(fullName || user.name || "");
      if ((user as any).city) setCity((user as any).city);
      else if ((user as any).addresses?.[0]?.city) setCity((user as any).addresses[0].city);
    }
  }, [user]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (!comment.trim() || comment.trim().length < 3) {
      toast.error("Please enter your review (minimum 3 characters).");
      return;
    }

    if (!isAuthenticated && !userName.trim()) {
      toast.error("Please provide your name.");
      return;
    }

    if (!city.trim() || city.trim().length < 2) {
      toast.error("Please provide your City (e.g. Pune, Mumbai).");
      return;
    }

    try {
      await addReviewMutation.mutateAsync({
        productId,
        rating,
        comment: comment.trim(),
        userName: userName.trim() || undefined,
        city: city.trim(),
        website: website.trim() || undefined,
      });

      toast.success("Thank you! Your review has been submitted successfully.");
      setComment("");
      onClose();
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.message || "Failed to submit review";
      toast.error(errMsg);
    }
  };

  const activeStarRating = hoverRating || rating;
  const ratingInfo = RATING_FEEDBACK[activeStarRating] || RATING_FEEDBACK[5];

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-neutral-950/70 backdrop-blur-md transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Dialog Card */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modern Clean Header */}
        <div className="relative px-6 pt-5 pb-4 border-b border-neutral-100 bg-white">
          <div className="pr-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF5429] border border-orange-200/80 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              <span>★</span>
              <span>Rate & Review</span>
            </div>
            <h3 className="text-lg font-black text-neutral-900 tracking-tight leading-snug">
              Share Your Riding Experience
            </h3>
            <p className="text-xs text-neutral-500 font-medium truncate mt-0.5" title={productName}>
              {productName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 overflow-y-auto space-y-4">
          
          {/* Interactive Rating Selector Card */}
          <div className="bg-gradient-to-b from-neutral-50/90 to-neutral-50/40 border border-neutral-200/80 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-2">
              Overall Rating
            </span>

            {/* Stars Row */}
            <div className="flex items-center justify-center gap-2 mb-2.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 cursor-pointer focus:outline-hidden hover:scale-120 active:scale-95 transition-transform duration-150"
                  aria-label={`${star} star`}
                >
                  {star <= activeStarRating ? (
                    <StarIcon className="w-8 h-8 text-[#FFB800] drop-shadow-[0_2px_6px_rgba(255,184,0,0.35)]" />
                  ) : (
                    <StarOutlineIcon className="w-8 h-8 text-neutral-300 hover:text-neutral-400 transition-colors" />
                  )}
                </button>
              ))}
            </div>

            {/* Rating Feedback Pill */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all duration-200 ${ratingInfo.bg} ${ratingInfo.color}`}>
              <span>{ratingInfo.title}</span>
              <span className="text-neutral-400 font-normal">·</span>
              <span className="font-normal text-[11px] opacity-90">{ratingInfo.subtitle}</span>
            </div>
          </div>

          {/* User Identity & City Location */}
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/60 border border-orange-200/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF5429] to-[#FF7A00] text-white flex items-center justify-center font-bold text-xs shrink-0 uppercase shadow-xs">
                    {(userName || user?.firstName || "R").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-neutral-900 truncate">
                        {userName || "Verified Customer"}
                      </span>
                      <CheckBadgeIcon className="w-4 h-4 text-[#FF5429] shrink-0" />
                    </div>
                    <span className="text-[10px] text-neutral-400 block truncate">
                      Verified Rider Account
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5429] bg-white px-2.5 py-0.5 rounded-full border border-orange-200 shrink-0">
                  Verified Rider
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  City <span className="text-brand">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune, Bengaluru, Mumbai"
                    maxLength={80}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-sm bg-neutral-50/80 focus:bg-white border border-neutral-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:border-[#FF5429] focus:ring-2 focus:ring-[#FF5429]/15 outline-hidden transition-all placeholder:text-neutral-400 font-medium"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Your Name <span className="text-brand">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  maxLength={100}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full text-sm bg-neutral-50/80 focus:bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:border-[#FF5429] focus:ring-2 focus:ring-[#FF5429]/15 outline-hidden transition-all placeholder:text-neutral-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  City <span className="text-brand">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Bengaluru"
                    maxLength={80}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-sm bg-neutral-50/80 focus:bg-white border border-neutral-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:border-[#FF5429] focus:ring-2 focus:ring-[#FF5429]/15 outline-hidden transition-all placeholder:text-neutral-400 font-medium"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hidden Honeypot trap to detect and block automated bots */}
          <div className="hidden opacity-0 pointer-events-none absolute -left-[9999px]" aria-hidden="true">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {/* Detailed Review Comment */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                Your Review <span className="text-brand">*</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-medium">
                {comment.length} / 1000
              </span>
            </div>
            <textarea
              required
              rows={3}
              maxLength={1000}
              placeholder="How does it feel on the ride? Share comfort, fit, and protection feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full text-sm bg-neutral-50/80 focus:bg-white border border-neutral-200 rounded-xl p-3.5 focus:border-[#FF5429] focus:ring-2 focus:ring-[#FF5429]/15 outline-hidden transition-all placeholder:text-neutral-400 font-medium resize-none"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={addReviewMutation.isPending}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addReviewMutation.isPending}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#FF5429] to-[#FF7A00] hover:from-[#E0441D] hover:to-[#FF5429] active:scale-[0.98] rounded-xl shadow-md shadow-[#FF5429]/25 hover:shadow-lg hover:shadow-[#FF5429]/35 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {addReviewMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
