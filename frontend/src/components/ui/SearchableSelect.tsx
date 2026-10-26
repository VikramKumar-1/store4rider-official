"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface Option {
  label: string;
  value: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
  error?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  allowCustom = false,
  className = "",
  error = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropUp, setDropUp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto detect dropup vs dropdown to prevent viewport overflow
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 280 && rect.top > 280) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => {
    const q = search.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.description && opt.description.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  });

  const selectedOption = options.find((opt) => opt.value === value) || (value ? { label: value, value: value } : null);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch("");
  };

  const handleCustomSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && allowCustom && search.trim() !== "") {
      e.preventDefault();
      handleSelect(search.trim());
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white border ${
          error ? "border-red-500 ring-1 ring-red-500" : isOpen ? "border-brand ring-1 ring-brand" : "border-slate-300 hover:border-slate-400"
        } rounded-lg px-3 py-2 text-sm text-left transition-all focus:outline-none focus:ring-1 focus:ring-brand shadow-2xs cursor-pointer`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className={`truncate ${!selectedOption ? "text-slate-400" : "text-slate-900 font-medium"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${selectedOption.badgeColor || "bg-slate-100 text-slate-600"}`}>
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown size={15} className={`text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-full ${
            dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col`}
          style={{ maxHeight: "320px" }}
        >
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/70 shrink-0">
            <Search size={14} className="text-slate-400 ml-1 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleCustomSubmit}
              placeholder={allowCustom ? "Search or type custom & press Enter..." : "Search..."}
              className="w-full bg-transparent border-none focus:outline-none text-xs text-slate-700 py-1"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer shrink-0"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Scrollable Items */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-60 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {filteredOptions.length === 0 ? (
              allowCustom && search.trim() !== "" ? (
                <button
                  type="button"
                  onClick={() => handleSelect(search.trim())}
                  className="w-full text-left px-3 py-2 text-xs text-brand font-medium hover:bg-brand/5 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span className="bg-brand/10 text-brand px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">Add</span>
                  &quot;{search.trim()}&quot;
                </button>
              ) : (
                <div className="px-3 py-4 text-xs text-slate-400 text-center italic">
                  No matching options found
                </div>
              )
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-brand/10 text-brand font-semibold"
                        : "text-slate-700 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="min-w-0">
                        <span className="truncate block font-medium leading-snug">{opt.label}</span>
                        {opt.description && (
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      {opt.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${opt.badgeColor || "bg-slate-100 text-slate-600"}`}>
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check size={14} className="text-brand shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
