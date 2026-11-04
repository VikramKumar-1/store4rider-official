"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { normalizeExternalImageUrl, resolveMagentoMediaUrls, S3_MEDIA_BASE } from "@/core/utils/mediaUrlHelper";

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeChart?: string;
  productName?: string;
}

/**
 * Sanitizes legacy and dynamic size chart HTML strings:
 * 1. Resolves Magento {{media url="..."}} to direct AWS S3 URLs.
 * 2. Rewrites legacy /media/ paths to the S3 bucket.
 * 3. Strips un-scoped <style> blocks that pollute global table styles.
 * 4. Removes hardcoded inline pixel widths/heights/floats that cause mobile overflow.
 * 5. Removes width="..." and height="..." HTML attributes from tables, cells, and images.
 * 6. Ensures links open safely in a new tab.
 */
export function cleanSizeChartHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  let clean = resolveMagentoMediaUrls(rawHtml)
    // 4. Remove unscoped <style> blocks
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    // 5. Sanitize style attributes by removing rigid dimensions and floats
    .replace(/style=(["'])([\s\S]*?)\1/gi, (_match, quote, styleContent) => {
      const sanitizedStyle = styleContent
        .replace(/(?:^|;)\s*width\s*:\s*[^;]+;?/gi, "")
        .replace(/(?:^|;)\s*min-width\s*:\s*[^;]+;?/gi, "")
        .replace(/(?:^|;)\s*height\s*:\s*[^;]+;?/gi, "")
        .replace(/(?:^|;)\s*float\s*:\s*[^;]+;?/gi, "")
        .trim();
      return sanitizedStyle ? `style=${quote}${sanitizedStyle}${quote}` : "";
    })
    // 6. Remove HTML width & height attributes from structural elements
    .replace(/(<(?:table|thead|tbody|tr|th|td|div|p)\b[^>]*?)\s+width=["'][^"']*["']/gi, "$1")
    .replace(/(<(?:table|thead|tbody|tr|th|td|div|p)\b[^>]*?)\s+height=["'][^"']*["']/gi, "$1")
    // 7. Remove fixed HTML width & height from images
    .replace(/(<img\b[^>]*?)\s+width=["'][^"']*["']/gi, "$1")
    .replace(/(<img\b[^>]*?)\s+height=["'][^"']*["']/gi, "$1")
    // 8. Ensure all links have rel="noopener noreferrer" and target="_blank"
    .replace(/<a\b([^>]*?)>/gi, (_match, attrs) => {
      let updated = attrs;
      if (!/target=["']_blank["']/i.test(updated)) {
        updated += ' target="_blank"';
      }
      if (!/rel=["'][^"']*["']/i.test(updated)) {
        updated += ' rel="noopener noreferrer"';
      }
      return `<a ${updated.trim()}>`;
    })
    .trim();

  return clean;
}

/**
 * Resolves direct image URL size charts (non-HTML strings).
 */
export function resolveSizeChartImageUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  let url = rawUrl.trim().replace(/^["']|["']$/g, "");

  if (url.includes("{{media") || url.startsWith("/media/") || url.startsWith("media/") || url.includes("wysiwyg") || url.includes("store4riders.com")) {
    const wrapped = `<img src="${url}" />`;
    const resolved = resolveMagentoMediaUrls(wrapped);
    const srcMatch = resolved.match(/src="([^"]+)"/i);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }
  }

  return normalizeExternalImageUrl(url);
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({
  isOpen,
  onClose,
  sizeChart,
  productName,
}) => {
  // Lock body scroll and register escape key while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const isHtml = useMemo(() => {
    if (!sizeChart) return false;
    return sizeChart.includes("<");
  }, [sizeChart]);

  const sanitizedHtml = useMemo(() => {
    if (!isHtml || !sizeChart) return "";
    return cleanSizeChartHtml(sizeChart);
  }, [isHtml, sizeChart]);

  const cleanImageUrl = useMemo(() => {
    if (isHtml || !sizeChart) return "";
    return resolveSizeChartImageUrl(sizeChart);
  }, [isHtml, sizeChart]);

  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    setImageLoadError(false);
  }, [cleanImageUrl]);

  if (!isOpen || !sizeChart || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 md:p-8 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-3xl max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden min-w-0 animate-in zoom-in-95 duration-200 border border-neutral-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-neutral-100 bg-neutral-50/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-brand"
              >
                <rect x="2" y="8" width="20" height="8" rx="1" />
                <line x1="6" y1="16" x2="6" y2="12" />
                <line x1="10" y1="16" x2="10" y2="12" />
                <line x1="14" y1="16" x2="14" y2="12" />
                <line x1="18" y1="16" x2="18" y2="12" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <h3
                id="size-guide-modal-title"
                className="font-heading font-semibold text-base sm:text-lg uppercase tracking-wide text-neutral-900 truncate"
              >
                Size Guide
              </h3>
              {productName && (
                <span className="text-[11px] text-neutral-500 truncate max-w-[220px] sm:max-w-md hidden xs:block">
                  {productName}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/70 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-auto min-h-0 w-full flex-1 min-w-0">
          {/* Subtle Mobile Horizontal Swipe Cue */}
          <div className="sm:hidden flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 bg-neutral-100/80 px-2.5 py-1.5 rounded-lg mb-3 w-fit select-none border border-neutral-200/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-neutral-400 shrink-0"
            >
              <path d="M18 8L22 12L18 16" />
              <path d="M6 8L2 12L6 16" />
              <path d="M2 12H22" />
            </svg>
            <span>Scroll horizontally if chart extends past screen</span>
          </div>

          {isHtml ? (
            <div
              className="w-full text-xs sm:text-sm text-neutral-800 overflow-x-auto min-w-0 [-webkit-overflow-scrolling:touch]
                [&_table]:w-full [&_table]:min-w-full [&_table]:border-collapse [&_table]:my-2
                [&_th]:font-heading [&_th]:font-semibold [&_th]:text-[11px] sm:[&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:border [&_th]:border-neutral-200 [&_th]:p-2 sm:[&_th]:p-2.5 [&_th]:bg-neutral-100/90 [&_th]:text-neutral-900 [&_th]:whitespace-normal [&_th]:break-words
                [&_td]:font-sans [&_td]:text-xs sm:[&_td]:text-sm [&_td]:border [&_td]:border-neutral-200 [&_td]:p-2 sm:[&_td]:p-2.5 [&_td]:text-center [&_td]:whitespace-normal sm:[&_td]:whitespace-nowrap
                [&_tbody_tr:nth-child(even)]:bg-neutral-50/70
                [&_img]:max-w-full [&_img]:w-auto [&_img]:h-auto [&_img]:max-h-[60vh] [&_img]:object-contain [&_img]:mx-auto [&_img]:rounded-lg [&_img]:my-2 [&_img]:!float-none
                [&_p]:my-2 [&_p]:leading-relaxed
                [&_a]:text-brand [&_a]:underline [&_a]:font-semibold hover:[&_a]:text-[#8a1107]
                [&_div]:max-w-full"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          ) : imageLoadError ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-neutral-800">Size Chart Image Unavailable</h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                The size chart image could not be loaded from the storage server. Please verify the URL or upload a fresh image in Admin.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full py-2">
              <img
                src={cleanImageUrl}
                alt="Size Guide"
                onError={() => setImageLoadError(true)}
                className="max-w-full max-h-[70vh] w-auto h-auto object-contain rounded-lg shadow-xs mx-auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
