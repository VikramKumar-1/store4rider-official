"use client";

import React, { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

export interface AccordionItem {
  id: string;
  title: string;
  content: string | React.ReactNode;
}

interface CategorySEOAccordionProps {
  categoryName?: string;
  items?: AccordionItem[];
}

const DEFAULT_GLOVES_ACCORDIONS: AccordionItem[] = [
  {
    id: "panel-1",
    title: "How to Choose the Right Motorcycle Riding Gloves? (Dummy)",
    content:
      "When selecting riding gloves, evaluate palm abrasion resistance, knuckle protection (carbon fiber, TPU, or D3O), cuff length (full gauntlet for track/highway, short cuff for city commuting), and CE Level certification (EN 13594:2015 KP Level 1 or Level 2). Ensure a snug fit across the palm without pinching finger tips when gripping handlebars.",
  },
  {
    id: "panel-2",
    title: "Difference Between Full Gauntlet, Semi Gauntlet & Short Gloves (Dummy)",
    content:
      "Full Gauntlet gloves extend over your jacket wrist to prevent skin exposure in high-speed track or touring slides. Semi Gauntlet offers extended wrist coverage with lighter everyday flexibility. Short cuff gloves provide maximum ventilation and quick wearability for daily city traffic.",
  },
];

/**
 * CategorySEOAccordion
 * 
 * 100% Googlebot & SEO Crawl Optimized:
 * 1. Content is ALWAYS rendered in the initial HTML DOM (zero {isOpen && ...} unmounting).
 * 2. Uses CSS max-height transition so bots crawl every single keyword in initial SSR.
 * 3. Injects Schema.org JSON-LD FAQPage structured data for Google Search Rich Snippets.
 */
export const CategorySEOAccordion: React.FC<CategorySEOAccordionProps> = ({
  categoryName = "Riding Gloves",
  items = DEFAULT_GLOVES_ACCORDIONS,
}) => {
  // Store open state per panel; default first panel closed or open
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    [items[0]?.id || "panel-1"]: false,
  });

  const togglePanel = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Structured Data (JSON-LD FAQPage for Google Search bot indexing)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: typeof item.content === "string" ? item.content : item.title,
      },
    })),
  };

  return (
    <section className="w-full my-3" aria-label={`${categoryName} Information`}>
      {/* 1. Googlebot JSON-LD Structured Data Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* 2. SEO-Friendly Accordion Panels */}
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isOpen = !!openIds[item.id];
          return (
            <div
              key={item.id}
              className="border border-neutral-200/90 rounded-lg overflow-hidden bg-white shadow-xs transition-colors duration-200"
            >
              {/* Accordion Header Button */}
              <button
                type="button"
                onClick={() => togglePanel(item.id)}
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${item.id}`}
                className="w-full py-2.5 px-3 sm:py-3 sm:px-4 flex items-center justify-between text-left gap-3 bg-neutral-50/70 hover:bg-neutral-100/70 transition-colors cursor-pointer select-none"
              >
                <h3 className="text-[11px] sm:text-[13px] font-bold text-neutral-900 tracking-tight">
                  {item.title}
                </h3>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-700 shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {/* 
                CRITICAL SEO RULE:
                Content is ALWAYS present in the DOM for search bot indexing!
                Never unmount with {isOpen && ...}.
                We toggle via CSS max-height & opacity.
              */}
              <div
                id={`accordion-content-${item.id}`}
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isOpen
                    ? "max-h-[500px] opacity-100 py-2.5 px-3 sm:py-3 sm:px-4"
                    : "max-h-0 opacity-0 py-0 px-3 sm:px-4"
                }`}
              >
                <div className="text-[10px] sm:text-xs text-neutral-600 leading-relaxed font-sans border-t border-neutral-100 pt-2">
                  {item.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CategorySEOAccordion;
