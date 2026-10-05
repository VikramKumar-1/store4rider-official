"use client";

import React, { useState, useRef } from "react";
import { PlusSquare, MinusSquare } from "lucide-react";

export function CategoryDescriptionBlock({ description, pageTitle }: { description?: string, pageTitle: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!description) {
    return null;
  }

  const toggleExpand = () => {
    if (isExpanded && containerRef.current) {
      // If we are collapsing, scroll back to the top of this block
      // so the user doesn't lose their place or end up looking at empty space
      const y = containerRef.current.getBoundingClientRect().top + window.scrollY - 120; // 120px offset for sticky header
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div ref={containerRef} className="w-full relative mb-6">
      
      <div className="relative w-full">
        <div 
          className={`prose prose-sm sm:prose-base max-w-none prose-neutral prose-a:text-brand prose-a:no-underline hover:prose-a:underline prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-neutral-200 prose-th:bg-neutral-50 prose-th:p-2 prose-td:border prose-td:border-neutral-200 prose-td:p-2 prose-img:rounded-md prose-img:shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? '' : 'max-h-[120px]'}`}
          dangerouslySetInnerHTML={{ __html: description }} 
        />
        
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        )}
      </div>

      <div className="w-full flex justify-center mt-4">
        <button 
          onClick={toggleExpand}
          className="flex items-center gap-2 bg-[#FF5429] hover:bg-[#E04018] text-white font-semibold text-sm px-6 py-2 rounded-md uppercase tracking-wider transition-colors shadow-sm"
        >
          {isExpanded ? (
            <>
              <MinusSquare className="w-4 h-4" />
              LESS VIEW
            </>
          ) : (
            <>
              <PlusSquare className="w-4 h-4" />
              MORE VIEW
            </>
          )}
        </button>
      </div>
    </div>
  );
}
