"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/core/api/client";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import {
  Search,
  Plus,
  X,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Info,
} from "lucide-react";

export function AdminSearchSettings() {
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/settings");
      if (res.data?.data?.popularSearches && Array.isArray(res.data.data.popularSearches)) {
        setTags(res.data.data.popularSearches);
      } else {
        setTags([]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load search settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;

    // Check duplicate
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      toast.info(`"${trimmed}" is already in the popular searches list`);
      return;
    }

    setTags([...tags, trimmed]);
    setNewTagInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleResetToAuto = () => {
    setTags([]);
    toast.info("Cleared custom tags. Backend will auto-aggregate popular searches from active catalog categories and brands.");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.put("/admin/settings", {
        popularSearches: tags,
      });
      toast.success("Search discovery settings saved successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save search settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl border border-neutral-200 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-neutral-500 font-medium text-sm">Loading search configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-brand/10 text-brand rounded-lg">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Search & Discovery Intelligence</h2>
            <p className="text-sm text-neutral-500">
              Manage popular search terms and discovery chips shown in the search bar across mobile & desktop.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Industry Standard Dynamic Intelligence:</strong> If you leave the tags empty, Store4Riders automatically analyzes your live MongoDB catalog to dynamically aggregate top active categories and high-demand gear brands. Any custom tags you enter below will override the auto-aggregation and be highlighted for shoppers.
          </div>
        </div>
      </div>

      {/* Tag Manager Form */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand" />
              <span>Popular Search Tags ({tags.length})</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Customers will see these quick-search pill buttons when clicking into the search bar.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetToAuto}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-brand px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-brand/40 bg-neutral-50 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Auto-Catalog</span>
          </button>
        </div>

        {/* Input to add new tag */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Type keyword e.g. 'Axor Apex', 'Rynox Air GT', 'Riding Gloves' and press Enter..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand font-medium"
            />
          </div>
          <Button
            type="button"
            onClick={handleAddTag}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tag</span>
          </Button>
        </div>

        {/* Active Tags Container */}
        <div>
          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5">
            Active Chips {tags.length === 0 && <span className="text-amber-600 font-semibold normal-case">(Currently in dynamic catalog auto-discovery mode)</span>}
          </label>

          {tags.length === 0 ? (
            <div className="p-6 border-2 border-dashed border-neutral-200 rounded-xl text-center bg-neutral-50/50">
              <TrendingUp className="w-6 h-6 text-brand mx-auto mb-2" />
              <p className="text-xs font-semibold text-neutral-700">Catalog Auto-Aggregation Active</p>
              <p className="text-[11px] text-neutral-500 max-w-md mx-auto mt-1">
                Store4Riders is serving live top categories (e.g. Helmets, Jackets, Boots) and top in-stock brands (e.g. Rynox, Axor, SMK). Add tags above to customize.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200 min-h-[50px] items-center">
              {tags.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs group"
                >
                  <Search className="w-3 h-3 text-slate-400 group-hover:text-brand transition-colors" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    aria-label={`Remove ${tag}`}
                    className="p-0.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors ml-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Live Customer Preview */}
        {tags.length > 0 && (
          <div className="p-4 bg-slate-900 rounded-xl text-white space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-mono text-slate-400 uppercase tracking-wider text-[11px]">
                Live Storefront Customer Preview
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                Mobile & Desktop Search Bar
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700"
                  >
                    <Search className="w-3 h-3 text-slate-500" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="pt-4 border-t border-neutral-100 flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm uppercase px-6 py-2.5 rounded-lg shadow-sm"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Search Settings</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
export default AdminSearchSettings;
