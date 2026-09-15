"use client";

import React from "react";
import Link from "next/link";
import { TopBannerProps } from "../types/homepage.types";

/**
 * TopBanner Component
 * 
 * Presentational top announcement bar matching Figma design structure.
 * Standard vibrant orange background with crisp text alignment.
 * 
 * @param {TopBannerProps} props Component props containing banner message and highlight text.
 */
export const TopBanner: React.FC<TopBannerProps> = ({
  message,
  highlightText,
  bannerUrl,
}) => {
  const content = (
    <div className="bg-banner text-banner-text text-xs py-2 px-4 text-center font-medium tracking-wide shadow-sm flex items-center justify-center gap-1.5 transition-colors">
      <span>{message}</span>
      <span className="font-extrabold uppercase tracking-wider underline underline-offset-2">
        {highlightText}
      </span>
    </div>
  );

  if (bannerUrl) {
    return (
      <Link href={bannerUrl} className="block hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};

export default TopBanner;
