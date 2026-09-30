"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopBannerProps } from "../types/homepage.types";

const CLAIMS = [
  "100% genuine riding gear. No fakes, no doubts.",
  "Helmets, jackets, gloves: 100% genuine, EMI and COD available.",
  "Order today, pay when it arrives. Cash on Delivery available.",
  "Ride safe. Buy genuine. Pay easy."
];

/**
 * TopBanner Component
 * 
 * Rotating top announcement bar with specific claims.
 */
export const TopBanner: React.FC<TopBannerProps> = ({
  message,
  highlightText,
  bannerUrl,
}) => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % CLAIMS.length);
        setFade(true);
      }, 300); // Wait for fade out
    }, 4500); // 4.5 seconds interval

    return () => clearInterval(interval);
  }, []);

  const content = (
    <div className="bg-banner text-banner-text text-[10px] sm:text-xs py-2 px-2 sm:px-4 text-center font-bold tracking-wide shadow-sm flex items-center justify-center min-h-[36px] sm:min-h-[40px] overflow-hidden">
      <span 
        className={`transition-opacity duration-300 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}
      >
        {CLAIMS[index]}
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
