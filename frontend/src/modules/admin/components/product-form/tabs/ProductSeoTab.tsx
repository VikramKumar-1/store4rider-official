"use client";

import React from "react";
import { Search } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useProductFormContext } from "../ProductFormContext";

export function ProductSeoTab() {
  const {
    shortDescription,
    setShortDescription,
    description,
    setDescription,
    sizeChart,
    setSizeChart,
    metaTitle,
    setMetaTitle,
    metaDescription,
    setMetaDescription,
    metaKeywords,
    setMetaKeywords,
    slug,
    name,
  } = useProductFormContext();

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Search className="text-brand" size={18} />
          Rich Text Description &amp; Manual SEO Metadata
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Full WYSIWYG editor with image upload, YouTube embeds, tables, and live Google search preview.
        </p>
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Short Description (Summary beside Buy button)
        </label>
        <textarea
          rows={2}
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Brief 2-3 line overview of key selling points..."
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        />
      </div>

      {/* INDUSTRY STANDARD RICH TEXT EDITOR */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-slate-800">
            Full Product Description (Rich Text WYSIWYG &amp; HTML)
          </label>
          <span className="text-xs text-slate-400">Embed images, YouTube videos, bullet points, and tables</span>
        </div>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Write detailed specifications, helmet shell features, lining, ventilation, certification details..."
          minHeight="320px"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Size Chart (Image URL or Link)</label>
        <input
          type="text"
          value={sizeChart}
          onChange={(e) => setSizeChart(e.target.value)}
          placeholder="e.g. https://.../axor-size-chart.webp"
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        />
      </div>

      {/* SEO SECTION (100% MANUAL) */}
      <div className="border-t border-slate-100 pt-6 space-y-4">
        <h4 className="text-sm font-semibold text-slate-800">
          Manual SEO Metadata (Search Engine Optimization)
        </h4>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">Meta Title</label>
            <span className={`text-xs ${metaTitle.length > 60 ? "text-amber-600 font-bold" : "text-slate-400"}`}>
              {metaTitle.length}/60 recommended
            </span>
          </div>
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Custom Google title tag (e.g. Buy Axor Apex Helmet Online in India | Store4Riders)"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">Meta Description</label>
            <span
              className={`text-xs ${metaDescription.length > 160 ? "text-amber-600 font-bold" : "text-slate-400"}`}
            >
              {metaDescription.length}/160 recommended
            </span>
          </div>
          <textarea
            rows={2}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Custom snippet shown beneath the link in Google search results..."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Meta Keywords</label>
          <input
            type="text"
            value={metaKeywords}
            onChange={(e) => setMetaKeywords(e.target.value)}
            placeholder="e.g. chain lube, motul c2, 400ml, motorcycle maintenance"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>

        {/* Live Google Preview Box */}
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Google Search Result Live Preview
          </span>
          <p className="text-xs text-slate-500 font-mono">https://store4riders.com/{slug || "sample-product"}</p>
          <h5 className="text-base text-blue-700 font-medium hover:underline cursor-pointer line-clamp-1">
            {metaTitle || name || "Product Name | Store4Riders"}
          </h5>
          <p className="text-xs text-slate-600 line-clamp-2">
            {metaDescription ||
              shortDescription ||
              "No meta description set yet. Search engines will generate a snippet from your description."}
          </p>
        </div>
      </div>
    </div>
  );
}
