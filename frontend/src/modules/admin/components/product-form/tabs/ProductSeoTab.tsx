"use client";

import React from "react";
import { Search, Plus, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import Button from "@/components/ui/Button";
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
    faqs,
    setFaqs,
  } = useProductFormContext();

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Search className="text-brand" size={18} />
          Rich Text Description, Purely Manual SEO & Product FAQs
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

      {/* FAQS SECTION */}
      <div className="border-t border-slate-100 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Product FAQs ({faqs.length})</h4>
            <p className="text-xs text-slate-500">
              Frequently Asked Questions rendered directly on the Product Detail Page.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFaqs((prev) => [...prev, { question: "", answer: "" }])}
            className="text-xs flex items-center gap-1"
          >
            <Plus size={14} />
            <span>Add FAQ</span>
          </Button>
        </div>

        {faqs.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No FAQs added.</p>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                <button
                  type="button"
                  onClick={() => setFaqs((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFaqs((prev) => prev.map((item, i) => (i === idx ? { ...item, question: val } : item)));
                  }}
                  placeholder={`Question #${idx + 1}`}
                  className="w-[90%] px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <textarea
                  rows={2}
                  value={faq.answer}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFaqs((prev) => prev.map((item, i) => (i === idx ? { ...item, answer: val } : item)));
                  }}
                  placeholder="Answer..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
