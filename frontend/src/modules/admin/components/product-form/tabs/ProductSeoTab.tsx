"use client";

import React from "react";
import { Search, Plus, Trash2, Sliders, Table as TableIcon, List, Eye } from "lucide-react";
import { cleanRichContent } from "@/core/utils/cleanRichContent";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import Button from "@/components/ui/Button";
import { useProductFormContext } from "../ProductFormContext";

export function ProductSeoTab() {
  const [faqRichModes, setFaqRichModes] = React.useState<Record<number, boolean>>({});
  const [faqPreviews, setFaqPreviews] = React.useState<Record<number, boolean>>({});
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
              Rendered on the Product Detail Page and formatted with rich tables, bullet points & sizing tips.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFaqs((prev) => [...prev, { question: "", answer: "" }])}
            className="text-xs flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add FAQ</span>
          </Button>
        </div>

        {faqs.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No FAQs added.</p>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isRich = !!faqRichModes[idx] || Boolean(faq.answer && (faq.answer.includes("<table") || faq.answer.includes("<ul") || faq.answer.includes("<p>") || faq.answer.includes("<strong")));
              const isPreview = !!faqPreviews[idx];

              return (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 relative">
                  <button
                    type="button"
                    onClick={() => {
                      setFaqs((prev) => prev.filter((_, i) => i !== idx));
                      setFaqRichModes((prev) => {
                        const copy = { ...prev };
                        delete copy[idx];
                        return copy;
                      });
                      setFaqPreviews((prev) => {
                        const copy = { ...prev };
                        delete copy[idx];
                        return copy;
                      });
                    }}
                    className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors"
                    title="Delete FAQ"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="w-[90%] space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">FAQ Question #{idx + 1}</label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFaqs((prev) => prev.map((item, i) => (i === idx ? { ...item, question: val } : item)));
                      }}
                      placeholder={`Question #${idx + 1} (e.g. Does this helmet come with a pre-installed Pinlock visor?)`}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  {/* Formatting & Mode Controls Toolbar */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/60">
                    <span className="text-[11px] font-bold text-slate-600">Answer Content</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Toggle Visual / Rich Editor */}
                      <button
                        type="button"
                        onClick={() => setFaqRichModes((prev) => ({ ...prev, [idx]: !isRich }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                          isRich
                            ? "bg-brand text-white border-brand"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <Sliders size={10} />
                        <span>{isRich ? "Visual Mode Active" : "Visual & Table Editor"}</span>
                      </button>

                      {/* Quick Insert Table */}
                      <button
                        type="button"
                        onClick={() => {
                          const sampleTable = `<table class="w-full my-2 border-collapse border border-slate-300 text-xs">
  <thead>
    <tr class="bg-slate-100 font-bold">
      <th class="border border-slate-300 p-1.5 text-left">Feature / Part</th>
      <th class="border border-slate-300 p-1.5 text-left">Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-slate-300 p-1.5 font-medium">Included in Box</td>
      <td class="border border-slate-300 p-1.5">Clear Visor, Helmet Bag, Manual</td>
    </tr>
    <tr>
      <td class="border border-slate-300 p-1.5 font-medium">Warranty</td>
      <td class="border border-slate-300 p-1.5">5 Years Official Brand Warranty</td>
    </tr>
  </tbody>
</table><p><br></p>`;
                          setFaqs((prev) => prev.map((item, i) => i === idx ? { ...item, answer: item.answer ? `${item.answer}\n${sampleTable}` : sampleTable } : item));
                          setFaqRichModes((prev) => ({ ...prev, [idx]: true }));
                          toast.success("Table template inserted into FAQ answer!");
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 rounded text-[10px] font-semibold border border-slate-300 flex items-center gap-1 cursor-pointer"
                        title="Insert comparison table template"
                      >
                        <TableIcon size={10} className="text-brand" />
                        <span>+ Table</span>
                      </button>

                      {/* Quick Insert Bullets */}
                      <button
                        type="button"
                        onClick={() => {
                          const sampleBullets = `<ul class="list-disc pl-5 my-2 space-y-1">
  <li>Anti-fog Pinlock 70 MaxVision included.</li>
  <li>Emergency quick-release cheek pads.</li>
  <li>Double D-Ring titanium closure.</li>
</ul><p><br></p>`;
                          setFaqs((prev) => prev.map((item, i) => i === idx ? { ...item, answer: item.answer ? `${item.answer}\n${sampleBullets}` : sampleBullets } : item));
                          setFaqRichModes((prev) => ({ ...prev, [idx]: true }));
                          toast.success("Bullet points inserted!");
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 rounded text-[10px] font-semibold border border-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        <List size={10} />
                        <span>+ Bullets</span>
                      </button>

                      {/* Live Preview Toggle */}
                      <button
                        type="button"
                        onClick={() => setFaqPreviews((prev) => ({ ...prev, [idx]: !isPreview }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                          isPreview
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <Eye size={10} />
                        <span>{isPreview ? "Hide Preview" : "Preview"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Rich Editor OR Standard Input */}
                  {isRich ? (
                    <RichTextEditor
                      value={faq.answer}
                      onChange={(val) => {
                        setFaqs((prev) => prev.map((item, i) => (i === idx ? { ...item, answer: val } : item)));
                      }}
                      placeholder="Write detailed FAQ answer with tables, bold text, links, or lists..."
                      minHeight="140px"
                    />
                  ) : (
                    <textarea
                      rows={3}
                      value={faq.answer}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFaqs((prev) => prev.map((item, i) => (i === idx ? { ...item, answer: val } : item)));
                      }}
                      placeholder="Answer with rider recommendations, warranty details, or HTML tables..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand font-sans"
                    />
                  )}

                  {/* Live Preview Box */}
                  {isPreview && (
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Storefront Live Preview
                      </div>
                      <div
                        className="text-xs text-neutral-800 leading-relaxed prose prose-sm prose-neutral prose-table:w-full prose-table:table-fixed prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:p-1.5 prose-td:border prose-td:border-slate-300 prose-td:p-1.5 max-w-none"
                        dangerouslySetInnerHTML={{ __html: cleanRichContent(faq.answer || "<em>No content entered yet</em>") }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
