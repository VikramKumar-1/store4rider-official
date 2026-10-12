"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check, Folder, FolderTree, X } from "lucide-react";
import { DEFAULT_NAV_ITEMS } from "@/modules/homepage/components/navbar/nav.constants";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  group: string;
}

interface ModernCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  dbCategories?: any[];
}

export function ModernCategorySelect({
  value,
  onChange,
  dbCategories = [],
}: ModernCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Consolidate all categories from Megamenu + Database
  const allCategories = useMemo(() => {
    const list: CategoryOption[] = [];
    const seenSlugs = new Set<string>();

    // 1. From Megamenu Constants
    DEFAULT_NAV_ITEMS.forEach((nav) => {
      if (nav.megaMenuItems) {
        nav.megaMenuItems.forEach((section) => {
          section.items.forEach((item) => {
            const rawSlug = item.href.split("/").filter(Boolean).pop() || "";
            if (rawSlug && !rawSlug.includes("?") && !seenSlugs.has(rawSlug)) {
              seenSlugs.add(rawSlug);
              list.push({
                id: rawSlug,
                slug: rawSlug,
                name: item.label,
                group: `${nav.label} > ${section.group || ""}`,
              });
            }
          });
        });
      }
    });

    // 2. From DB Category Tree (nested)
    const traverseDb = (nodes: any[], parentName = "") => {
      nodes.forEach((n) => {
        const fullGroup = parentName ? `${parentName} > ${n.name}` : n.name;
        const slug = n.slug || String(n._id);
        if (!seenSlugs.has(slug)) {
          seenSlugs.add(slug);
          list.push({
            id: String(n._id || slug),
            slug: slug,
            name: n.name,
            group: parentName || "Custom Categories",
          });
        }
        if (n.children && n.children.length > 0) {
          traverseDb(n.children, fullGroup);
        }
      });
    };
    traverseDb(dbCategories);

    return list;
  }, [dbCategories]);

  // Filter categories by search input
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return allCategories;
    const q = search.toLowerCase();
    return allCategories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [allCategories, search]);

  // Group filtered items by group name
  const groupedCategories = useMemo(() => {
    const groups: Record<string, CategoryOption[]> = {};
    filteredCategories.forEach((c) => {
      if (!groups[c.group]) groups[c.group] = [];
      groups[c.group].push(c);
    });
    return groups;
  }, [filteredCategories]);

  const selectedCategory = allCategories.find((c) => c.id === value || c.slug === value);

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 truncate">
          <FolderTree size={16} className={selectedCategory ? "text-brand" : "text-slate-400"} />
          {selectedCategory ? (
            <div className="truncate">
              <span className="font-semibold text-slate-900">{selectedCategory.name}</span>
              <span className="text-[11px] text-slate-500 ml-2 font-normal">({selectedCategory.group})</span>
            </div>
          ) : (
            <span className="text-slate-400">Select Category...</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Modern Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search bar inside dropdown */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search size={15} className="text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all categories (e.g. Visor, Jacket, Boots, Chain Care)..."
              className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Categories List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
            {Object.keys(groupedCategories).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No matching categories found for &quot;{search}&quot;.
              </div>
            ) : (
              Object.entries(groupedCategories).map(([groupName, items]) => (
                <div key={groupName} className="py-1">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {groupName}
                  </div>
                  {items.map((cat) => {
                    const isSelected = value === cat.id || value === cat.slug;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onChange(cat.slug || cat.id);
                          setIsOpen(false);
                          setSearch("");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                          isSelected
                            ? "bg-brand/10 text-brand font-bold"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {isSelected && <Check size={14} className="text-brand shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
