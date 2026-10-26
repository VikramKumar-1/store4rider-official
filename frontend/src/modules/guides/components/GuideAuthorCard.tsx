"use client";

import React from "react";
import Image from "next/image";
import { IGuideAuthor } from "@store4riders/shared-types";
import { Instagram, Facebook, Youtube, ExternalLink, PenTool, Award, Shield } from "lucide-react";

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

  // Compute initials dynamically (max 2 characters, e.g. "VM", "RK", "ST")
  const initials =
    author?.name
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join("") || "SR";

  const isTeam =
    !author?.name ||
    author.name.toLowerCase().includes("team") ||
    author.name.toLowerCase().includes("store4riders");

  const bioText =
    author?.bio ||
    (isTeam
      ? "The Store4Riders Editorial Team brings together veteran motorcyclists, gear technicians, and long-distance touring specialists dedicated to verified rider safety, unbiased gear reviews, and authentic riding advice across India."
      : `${author?.name || "This contributor"} is a dedicated motorcycle gear specialist and rider for Store4Riders, providing hands-on insights on protective equipment, track standards, and maintenance.`);

  const jobTitle = author?.jobTitle || (isTeam ? "Editorial & Technical Gear Desk" : "Motorcycle Gear Specialist");
  const socialLinks = Array.isArray(author?.sameAs) ? author.sameAs.filter(Boolean) : [];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs">
      <div className="flex flex-col sm:flex-row items-start gap-5">
        {/* Author Avatar / Editorial Monogram */}
        <div className="relative shrink-0">
          {(author as any)?.avatar ? (
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
              <Image
                src={(author as any).avatar}
                alt={author.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center font-sans font-bold shadow-sm border border-slate-800">
              <span className="text-xl sm:text-2xl tracking-wider">{initials}</span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-medium">Writer</span>
            </div>
          )}
        </div>

        {/* Author Details */}
        <div className="flex-1 min-w-0">
          {/* Editorial Badge & Metadata */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full">
              <Award size={12} className="text-brand" />
              <span>{isTeam ? "Editorial Team" : "Verified Gear Expert"}</span>
            </span>

            {readingTimeMinutes && (
              <span className="text-xs text-slate-500 font-medium">
                • {readingTimeMinutes} min read
              </span>
            )}
            {formattedDate && (
              <span className="text-xs text-slate-500 font-medium">
                • Published {formattedDate}
              </span>
            )}
          </div>

          {/* Author Name */}
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {author?.name || "Store4Riders Editorial Team"}
          </h3>

          {/* Author Job Title */}
          <p className="text-xs font-semibold text-brand mb-2">
            {jobTitle}
          </p>

          {/* Author Bio */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            {bioText}
          </p>

          {/* Dynamic Social Profiles — Only rendered if author actually has profiles */}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2.5 mt-4 pt-3.5 border-t border-slate-100 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Follow &amp; Connect:
              </span>

              {socialLinks.map((url, idx) => {
                const isInsta = url.includes("instagram");
                const isFb = url.includes("facebook");
                const isYt = url.includes("youtube");

                return (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 flex items-center gap-1.5 text-xs font-medium transition-all"
                    title={isInsta ? "Instagram" : isFb ? "Facebook" : isYt ? "YouTube" : "Website"}
                  >
                    {isInsta && <Instagram className="w-3.5 h-3.5 text-pink-600" />}
                    {isFb && <Facebook className="w-3.5 h-3.5 text-blue-600" />}
                    {isYt && <Youtube className="w-3.5 h-3.5 text-red-600" />}
                    {!isInsta && !isFb && !isYt && <ExternalLink className="w-3 h-3 text-slate-500" />}
                    <span className="text-[11px] font-semibold">
                      {isInsta ? "Instagram" : isFb ? "Facebook" : isYt ? "YouTube" : "Profile"}
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
