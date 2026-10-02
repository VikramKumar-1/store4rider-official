import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDownIcon, CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { COUNTRIES } from "@/core/utils/countries";

interface DialCodeSelectProps {
  value: string; // ISO Country Code (e.g., 'US', 'IN')
  onChange: (countryCode: string) => void;
}

export const DialCodeSelect: React.FC<DialCodeSelectProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the country matching the selected ISO code
  const selectedCountry = COUNTRIES.find((c) => c.code === value) || COUNTRIES.find(c => c.code === "IN") || COUNTRIES[0];

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
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredCountries = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return COUNTRIES.filter(
      (c) => 
        c.name.toLowerCase().includes(query) || 
        c.dialCode.toLowerCase().includes(query) ||
        c.aliases?.some(alias => alias.includes(query))
    );
  }, [searchQuery]);

  return (
    <div className="relative shrink-0 w-[125px]" ref={dropdownRef}>
      <div
        className="w-full h-full border border-neutral-300 hover:border-[#78350F] focus-within:border-[#78350F] rounded-none px-3 py-3 text-base md:text-sm text-neutral-900 bg-white cursor-pointer flex items-center justify-between transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <img 
            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`} 
            alt={`${selectedCountry.name} flag`}
            className="w-[22px] h-auto shadow-[0_0_2px_rgba(0,0,0,0.2)] rounded-[2px] shrink-0"
          />
          <span className="font-medium text-neutral-900 truncate">({selectedCountry.dialCode})</span>
        </div>
        <ChevronDownIcon className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-[260px] mt-2 bg-white/70 bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-black/[0.03] rounded-2xl z-50 overflow-hidden transform opacity-100 scale-100 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col">
          <div className="p-2 border-b border-neutral-200/50 bg-white/40">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/60 border border-neutral-200/80 rounded-xl pl-9 pr-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#78350F]/50 focus:ring-2 focus:ring-[#78350F]/20 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <div
                  key={`${country.code}-${country.dialCode}`}
                  onClick={() => {
                    onChange(country.code);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl mx-0.5 my-0.5 transition-all duration-200 ${
                    value === country.code
                      ? "bg-amber-500/10 text-[#78350F] shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]"
                      : "hover:bg-neutral-900/[0.04] text-neutral-700 hover:text-neutral-950"
                  }`}
                >
                  <img 
                    src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`} 
                    alt={`${country.name} flag`}
                    className="w-6 h-auto shadow-[0_0_2px_rgba(0,0,0,0.2)] rounded-[2px]"
                  />
                  <span className={`flex-1 truncate text-xs ${value === country.code ? 'font-bold' : 'font-medium'}`}>{country.name}</span>
                  <span className={`text-xs font-semibold ${value === country.code ? 'text-[#78350F]' : 'text-neutral-500'}`}>
                    {country.dialCode}
                  </span>
                  {value === country.code && (
                    <CheckIcon className="w-4 h-4 text-[#78350F]" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm font-medium text-neutral-500">
                Not found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
