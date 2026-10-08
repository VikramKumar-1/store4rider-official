"use client";

import React, { useState, useRef, useMemo } from "react";
import { PlusSquare, MinusSquare } from "lucide-react";

export function CategoryDescriptionBlock({ description, pageTitle, disableToggle = false }: { description?: string, pageTitle: string, disableToggle?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanedDescription = useMemo(() => {
    if (!description) return "";
    let clean = description;
    
    // 1. Strip FAQs if they accidentally made it into the description
    const faqSplit = clean.split(/<h[23]>FAQs<\/h[23]>/i);
    if (faqSplit.length > 1) {
      clean = faqSplit[0];
    }

    // 2. Strip inline font-family and font-size to enforce our site's font
    clean = clean.replace(/style="([^"]*)"/gi, (match, styles) => {
      const cleanedStyles = styles
        .replace(/font-family:[^;]+;?/gi, '')
        .replace(/font-size:[^;]+;?/gi, '')
        .replace(/line-height:[^;]+;?/gi, '')
        .trim();
      return cleanedStyles ? `style="${cleanedStyles}"` : '';
    });

    // 3. Rewrite old Magento absolute URLs (store4riders.com/xxx.html) and .html relative URLs to standard Next.js paths
    clean = clean.replace(/href="https?:\/\/(?:www\.)?store4riders\.com\/([^"]+)"/gi, (match, path) => {
      return `href="/${path.replace(/\.html(\?.*)?$/i, '$1')}"`;
    });
    clean = clean.replace(/href="\/([^"]+)\.html(\?.*)?"/gi, 'href="/$1$2"');

    // 4. Force tables to shrink on mobile instead of scrolling
    clean = clean.replace(/<table/gi, '<table class="w-full max-w-full table-fixed text-[10px] sm:text-[12px] break-words"');
    clean = clean.replace(/<th/gi, '<th class="break-words px-1 py-1 sm:px-2 sm:py-2"');
    clean = clean.replace(/<td/gi, '<td class="break-words px-1 py-1 sm:px-2 sm:py-2"');

    return clean;
  }, [description]);

  if (!cleanedDescription) {
    return null;
  }

  const toggleExpand = () => {
    if (isExpanded && containerRef.current) {
      // If we are collapsing, scroll back to the top of this block smoothly
      const y = containerRef.current.getBoundingClientRect().top + window.scrollY - 150; // generous offset to show breadcrumbs/title
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <article ref={containerRef} className={`w-full relative ${disableToggle ? '' : 'mb-6'}`}>
      <div className="relative w-full">
        <div 
          className={`prose prose-sm max-w-none prose-neutral text-[12px] sm:text-[13px] leading-relaxed prose-headings:text-[14px] sm:prose-headings:text-[15px] prose-headings:font-bold prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-p:mt-0 prose-p:mb-2 prose-ul:mt-0 prose-ul:mb-2 prose-li:my-0 prose-strong:text-neutral-900 prose-a:text-brand prose-a:no-underline hover:prose-a:underline prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-neutral-200 prose-th:bg-neutral-50 prose-th:p-2 prose-td:border prose-td:border-neutral-200 prose-td:p-2 prose-img:rounded-md prose-img:shadow-sm transition-all duration-500 font-sans overflow-hidden ${disableToggle ? 'h-auto' : isExpanded ? 'max-h-[3000px]' : 'max-h-[110px]'}`}
          dangerouslySetInnerHTML={{ __html: cleanedDescription }} 
        />
        
        {(!disableToggle && !isExpanded) && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none" />
        )}
      </div>

      {!disableToggle && (
        <div className="w-full flex justify-center mt-4">
          <button 
            onClick={toggleExpand}
            className="flex items-center gap-1.5 sm:gap-2 bg-[#FF5429] hover:bg-[#E04018] text-white font-semibold text-xs sm:text-sm px-4 py-1.5 sm:px-6 sm:py-2 rounded-md uppercase tracking-wider transition-colors shadow-sm"
          >
            {isExpanded ? (
              <>
                <MinusSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                LESS VIEW
              </>
            ) : (
              <>
                <PlusSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                MORE VIEW
              </>
            )}
          </button>
        </div>
      )}
    </article>
  );
}
