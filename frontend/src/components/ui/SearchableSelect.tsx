"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

interface Option {
  label: string;
  value: string;
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

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
          error ? "border-red-500" : isOpen ? "border-brand ring-1 ring-brand" : "border-slate-300 hover:border-slate-400"
        } rounded-lg px-3 py-2 text-sm text-left transition-all focus:outline-none focus:ring-1 focus:ring-brand`}
      >
        <span className={`truncate ${!selectedOption ? "text-slate-400" : "text-slate-900 font-medium"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <Search size={14} className="text-slate-400 ml-1" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleCustomSubmit}
              placeholder={allowCustom ? "Search or type custom & press Enter..." : "Search options..."}
              className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 py-1"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {filteredOptions.length === 0 ? (
              allowCustom && search.trim() !== "" ? (
                <button
                  type="button"
                  onClick={() => handleSelect(search.trim())}
                  className="w-full text-left px-3 py-2 text-sm text-brand font-medium hover:bg-brand/5 rounded-md flex items-center gap-2"
                >
                  <span className="bg-brand/10 text-brand px-1.5 py-0.5 rounded text-[10px] uppercase">Add</span>
                  "{search.trim()}"
                </button>
              ) : (
                <div className="px-3 py-3 text-sm text-slate-500 text-center italic">
                  No matches found
                </div>
              )
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between rounded-md transition-colors ${
                    value === opt.value ? "bg-brand/10 text-brand font-semibold" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check size={14} className="text-brand" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
