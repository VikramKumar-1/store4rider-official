"use client";

import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

interface AccordionSectionProps {
  title: string;
  isOpen?: boolean;
  isActive?: boolean;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, isOpen = false, isActive = false, children }) => {
  const [open, setOpen] = useState(isOpen);

  return (
    <div className="border-b border-neutral-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
          isActive ? "bg-banner text-white" : "bg-white text-neutral-800 hover:bg-neutral-50"
        }`}
      >
        <span>{title}</span>
        {open ? (
          <ChevronUpIcon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-500"}`} />
        ) : (
          <ChevronRightIcon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-500"}`} />
        )}
      </button>
      {open && (
        <div className="bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

export const CatalogSidebar: React.FC = () => {
  const [womanOpen, setWomanOpen] = useState(true);

  return (
    <div className="w-full border border-neutral-200 rounded-sm overflow-hidden shadow-sm">
      
      {/* Category Section (Active) */}
      <AccordionSection title="CATEGORY" isActive isOpen>
        
        {/* Nested: Woman */}
        <div className="border-b border-neutral-100 last:border-0">
          <button 
            onClick={() => setWomanOpen(!womanOpen)}
            className="w-full flex items-center justify-between px-6 py-3 text-xs font-semibold text-neutral-700 hover:text-banner"
          >
            <span>Woman</span>
            {womanOpen ? (
              <ChevronDownIcon className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </button>
          
          {womanOpen && (
            <div className="px-8 pb-3 flex flex-col gap-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-3.5 h-3.5 border-neutral-300 rounded-sm text-banner focus:ring-banner" />
                  <span className="text-xs text-neutral-500 group-hover:text-neutral-800 transition-colors">Dress</span>
                </div>
                <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-sm">59+</span>
              </label>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-3.5 h-3.5 border-neutral-300 rounded-sm text-banner focus:ring-banner" />
                  <span className="text-xs text-neutral-500 group-hover:text-neutral-800 transition-colors">Shirt</span>
                </div>
                <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-sm">27</span>
              </label>
            </div>
          )}
        </div>

        {/* Nested: Man */}
        <div className="border-b border-neutral-100 last:border-0">
          <button className="w-full flex items-center justify-between px-6 py-3 text-xs font-semibold text-neutral-700 hover:text-banner">
            <span>Man</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>

        {/* Nested: Unisex */}
        <div className="border-b border-neutral-100 last:border-0">
          <button className="w-full flex items-center justify-between px-6 py-3 text-xs font-semibold text-neutral-700 hover:text-banner">
            <span>Unisex</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>
      </AccordionSection>

      {/* Price Section */}
      <AccordionSection title="PRICE">
        <div className="px-6 py-4 text-xs text-neutral-500">Price filters coming soon...</div>
      </AccordionSection>

      {/* Size Section */}
      <AccordionSection title="SIZE">
        <div className="px-6 py-4 text-xs text-neutral-500">Size filters coming soon...</div>
      </AccordionSection>

      {/* Color Section */}
      <AccordionSection title="COLOR">
        <div className="px-6 py-4 text-xs text-neutral-500">Color filters coming soon...</div>
      </AccordionSection>

    </div>
  );
};
