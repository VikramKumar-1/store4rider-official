"use client";

import React from "react";
import Image from "next/image";
import { IGuideAuthor } from "@store4riders/shared-types";
import { Instagram, Facebook, Youtube, ExternalLink, ShieldCheck } from "lucide-react";

interface GuideAuthorCardProps {
  author: IGuideAuthor;
  publishedDate?: string;
  readingTimeMinutes?: number;
}

export const GuideAuthorCard: React.FC<GuideAuthorCardProps> = ({
  author,
  publishedDate,
  readingTimeMinutes,
}) => {
  const formattedDate = publishedDate
    ? new Date(publishedDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="bg-neutral-50 rounded-2xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Author Avatar / Badge */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand to-banner flex items-center justify-center text-white shadow-lg shadow-brand/20 shrink-0">
          <span className="font-sans font-black text-2xl tracking-wider">
            {author.name
              .split(" ")
              .map((n) => n[0]?.toUpperCase())
              .join("") || "VM"}
          </span>
          <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow">
            <ShieldCheck className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Author Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand bg-brand/10 px-2.5 py-0.5 rounded-full">
              Verified Expert Author
            </span>
            {readingTimeMinutes && (
              <span className="text-xs text-neutral-500 font-medium">
                • {readingTimeMinutes} min read
              </span>
            )}
            {formattedDate && (
              <span className="text-xs text-neutral-500 font-medium">
                • Published {formattedDate}
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-neutral-900 tracking-tight">
            {author.name}
          </h3>
          <p className="text-xs font-semibold text-neutral-600 mb-2">
            {author.jobTitle || "Founder & Motorcycle Gear Specialist"}
          </p>

          <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
            {author.bio ||
              "Vishwas is the founder of Store4Riders with over 15 years of motorcycling expertise across India. He is passionate about rider safety, helmet certifications, and helping every rider choose the best gear."}
          </p>

          {/* Social Profiles */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-200/60">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Follow & Connect:
            </span>

            {author.sameAs.map((url, idx) => {
              const isInsta = url.includes("instagram");
              const isFb = url.includes("facebook");
              const isYt = url.includes("youtube");

              return (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white border border-neutral-200 hover:border-brand hover:bg-brand hover:text-white text-neutral-700 flex items-center justify-center transition-all duration-200 shadow-sm hover:scale-105"
                  title={isInsta ? "Instagram" : isFb ? "Facebook" : isYt ? "YouTube" : "Profile"}
                >
                  {isInsta && <Instagram className="w-4 h-4" />}
                  {isFb && <Facebook className="w-4 h-4" />}
                  {isYt && <Youtube className="w-4 h-4" />}
                  {!isInsta && !isFb && !isYt && <ExternalLink className="w-3.5 h-3.5" />}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
