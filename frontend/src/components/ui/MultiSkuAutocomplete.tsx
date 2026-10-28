"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, Check, Loader2 } from "lucide-react";

interface ProductOption {
  sku: string;
  name: string;
  imageUrl?: string;
}

interface MultiSkuAutocompleteProps {
  value: string; // comma separated SKUs
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MultiSkuAutocomplete({ value, onChange, placeholder }: MultiSkuAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedSkus = value.split(",").map(s => s.trim()).filter(Boolean);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (search.length < 2) {
      setOptions([]);
      return;
    }
    
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/products?search=${encodeURIComponent(search)}&limit=10&parentOnly=true`);
        const json = await res.json();
        if (json.success && json.data?.items) {
          setOptions(json.data.items.map((p: any) => ({
            sku: p.sku,
            name: p.name,
            imageUrl: p.images?.[0]?.url
          })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchOptions, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const toggleSku = (sku: string) => {
    let newSkus;
    if (selectedSkus.includes(sku)) {
      newSkus = selectedSkus.filter(s => s !== sku);
    } else {
      newSkus = [...selectedSkus, sku];
    }
    onChange(newSkus.join(", "));
    setSearch("");
  };

  const removeSku = (sku: string) => {
    onChange(selectedSkus.filter(s => s !== sku).join(", "));
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className={`w-full min-h-[42px] border rounded-lg bg-white p-1.5 flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-brand focus-within:border-brand ${isOpen ? 'border-brand' : 'border-slate-300'}`}
        onClick={() => setIsOpen(true)}
      >
        {selectedSkus.map(sku => (
          <div key={sku} className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium px-2 py-1 rounded-md">
            {sku}
            <button type="button" onClick={(e) => { e.stopPropagation(); removeSku(sku); }} className="text-slate-400 hover:text-red-500">
              <X size={12} />
            </button>
          </div>
        ))}
        <div className="flex-1 min-w-[120px] flex items-center gap-1.5 px-2">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={selectedSkus.length === 0 ? placeholder : "Search more..."}
            className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 py-1"
          />
        </div>
      </div>

      {isOpen && search.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center text-slate-400 text-sm gap-2">
              <Loader2 size={16} className="animate-spin" /> Searching...
            </div>
          ) : options.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm italic">
              No products found for "{search}"
            </div>
          ) : (
            options.map(opt => {
              const isSelected = selectedSkus.includes(opt.sku);
              return (
                <button
                  key={opt.sku}
                  type="button"
                  onClick={() => toggleSku(opt.sku)}
                  className={`w-full text-left p-2 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${isSelected ? 'bg-brand/5' : ''}`}
                >
                  <div className="w-8 h-8 rounded bg-slate-100 flex-shrink-0 overflow-hidden relative">
                    {opt.imageUrl && <img src={opt.imageUrl} alt={opt.name || opt.sku} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{opt.sku}</p>
                    <p className="text-[10px] text-slate-500 truncate">{opt.name}</p>
                  </div>
                  {isSelected && <Check size={16} className="text-brand flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
