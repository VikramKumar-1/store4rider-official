"use client";

import React, { useState, useMemo } from "react";
import {
  useSearchRedirects,
  useCreateSearchRedirect,
  useUpdateSearchRedirect,
  useDeleteSearchRedirect,
} from "@/core/hooks/useSearch";
import { useCategoryTree, ICategoryTree } from "@/core/hooks/useCategories";
import { ISearchRedirect, SearchRedirectMatchType, SearchRedirectTargetType } from "@store4riders/shared-types";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Tag,
  ArrowRight,
  FolderTree,
  AlertCircle,
  HelpCircle,
  X,
} from "lucide-react";
import { DEFAULT_NAV_ITEMS } from "@/modules/homepage/components/navbar/nav.constants";
import { isLegacyNonMenuCategory } from "@/core/utils/navCategories";

export function AdminSearchRedirectsManager() {
  const [page, setPage] = useState(1);
  const [searchTermFilter, setSearchTermFilter] = useState("");
  const limit = 25;

  const { data, isLoading, refetch } = useSearchRedirects(page, limit, searchTermFilter);
  const createMutation = useCreateSearchRedirect();
  const updateMutation = useUpdateSearchRedirect();
  const deleteMutation = useDeleteSearchRedirect();
  const { data: categoryTree } = useCategoryTree();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ISearchRedirect | null>(null);

  // Form Fields
  const [formSearchTerm, setFormSearchTerm] = useState("");
  const [formRedirectUrl, setFormRedirectUrl] = useState("");
  const [formTargetType, setFormTargetType] = useState<SearchRedirectTargetType>("category");
  const [formTargetTitle, setFormTargetTitle] = useState("");
  const [formMatchType, setFormMatchType] = useState<SearchRedirectMatchType>("exact");
  const [formSynonyms, setFormSynonyms] = useState<string[]>([]);
  const [synonymInput, setSynonymInput] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // 1. Storefront Navigation Menu & Submenus from canonical nav.constants
  const menuCategories = useMemo(() => {
    const list: { name: string; url: string; path: string }[] = [];
    for (const item of DEFAULT_NAV_ITEMS) {
      if (item.href && item.href !== "#" && !item.href.startsWith("http")) {
        list.push({
          name: item.label,
          url: item.href,
          path: item.label,
        });
      }
      if (item.megaMenuItems) {
        for (const mega of item.megaMenuItems) {
          const groupPrefix = mega.group ? `${item.label} → ${mega.group}` : item.label;
          if (mega.groupHref && !mega.groupHref.startsWith("http")) {
            list.push({
              name: mega.group,
              url: mega.groupHref,
              path: groupPrefix,
            });
          }
          if (mega.items) {
            for (const sub of mega.items) {
              if (sub.href && !sub.href.startsWith("http")) {
                list.push({
                  name: sub.label,
                  url: sub.href,
                  path: `${groupPrefix} → ${sub.label}`,
                });
              }
            }
          }
        }
      }
    }
    return list;
  }, []);

  // 2. Custom Categories created in Admin / Database (from useCategoryTree)
  const databaseCustomCategories = useMemo(() => {
    const menuUrls = new Set(menuCategories.map((m) => m.url.toLowerCase()));
    const list: { name: string; url: string; path: string }[] = [];

    const traverse = (nodes: ICategoryTree[], parentPath = "") => {
      for (const node of nodes) {
        if (isLegacyNonMenuCategory(node.slug) || node.includeInMenu === false) {
          continue;
        }

        const currentPath = parentPath ? `${parentPath} → ${node.name}` : node.name;
        const cleanUrl = `/${node.slug.replace(/^\//, "")}`;

        if (!menuUrls.has(cleanUrl.toLowerCase()) && !menuUrls.has(`/${node.slug}`.toLowerCase())) {
          list.push({
            name: node.name,
            url: cleanUrl,
            path: currentPath,
          });
        }

        if (node.children && node.children.length > 0) {
          traverse(node.children, currentPath);
        }
      }
    };

    if (categoryTree && Array.isArray(categoryTree)) {
      traverse(categoryTree);
    }
    return list;
  }, [categoryTree, menuCategories]);

  // Combined searchable list
  const allAvailableCategories = useMemo(() => {
    return [...menuCategories, ...databaseCustomCategories];
  }, [menuCategories, databaseCustomCategories]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormSearchTerm("");
    setFormRedirectUrl("");
    setFormTargetType("category");
    setFormTargetTitle("");
    setFormMatchType("exact");
    setFormSynonyms([]);
    setSynonymInput("");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ISearchRedirect) => {
    setEditingItem(item);
    setFormSearchTerm(item.searchTerm);
    setFormRedirectUrl(item.redirectUrl);
    setFormTargetType(item.targetType || "category");
    setFormTargetTitle(item.targetTitle || "");
    setFormMatchType(item.matchType || "exact");
    setFormSynonyms(item.synonyms || []);
    setSynonymInput("");
    setFormIsActive(item.isActive);
    setIsModalOpen(true);
  };

  const handleAddSynonym = () => {
    const trimmed = synonymInput.trim();
    if (!trimmed) return;
    if (formSynonyms.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.info(`"${trimmed}" is already added as a synonym`);
      return;
    }
    setFormSynonyms([...formSynonyms, trimmed]);
    setSynonymInput("");
  };

  const handleRemoveSynonym = (idx: number) => {
    setFormSynonyms(formSynonyms.filter((_, i) => i !== idx));
  };

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUrl = e.target.value;
    if (!selectedUrl) return;
    const cat = allAvailableCategories.find((c) => c.url === selectedUrl);
    setFormRedirectUrl(selectedUrl);
    if (cat) {
      setFormTargetTitle(cat.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSearchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    if (!formRedirectUrl.trim()) {
      toast.error("Please provide a redirect URL or choose a category");
      return;
    }

    try {
      const payload: Partial<ISearchRedirect> = {
        searchTerm: formSearchTerm.trim(),
        redirectUrl: formRedirectUrl.trim(),
        targetType: formTargetType,
        targetTitle: formTargetTitle.trim() || formSearchTerm.trim(),
        matchType: formMatchType,
        synonyms: formSynonyms,
        isActive: formIsActive,
      };

      if (editingItem && editingItem._id) {
        await updateMutation.mutateAsync({ id: editingItem._id, data: payload });
        toast.success("Search redirect rule updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Search redirect rule created successfully");
      }

      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save search redirect rule");
    }
  };

  const handleToggleStatus = async (item: ISearchRedirect) => {
    if (!item._id) return;
    try {
      await updateMutation.mutateAsync({
        id: item._id,
        data: { isActive: !item.isActive },
      });
      toast.success(`Rule "${item.searchTerm}" ${!item.isActive ? "activated" : "deactivated"}`);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (item: ISearchRedirect) => {
    if (!item._id) return;
    if (!confirm(`Are you sure you want to delete the redirect rule for "${item.searchTerm}"?`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(item._id);
      toast.success(`Search redirect for "${item.searchTerm}" deleted`);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete rule");
    }
  };

  const items = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalHits = useMemo(() => {
    return items.reduce((acc, curr) => acc + (curr.redirectCount || 0), 0);
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 flex items-center gap-4">
          <div className="p-3 bg-brand/10 text-brand rounded-xl">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Redirect Rules</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Active Rules</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {items.filter((i) => i.isActive).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Shopper Redirects Served</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalHits}</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search configured terms, URLs, or synonyms..."
            value={searchTermFilter}
            onChange={(e) => {
              setSearchTermFilter(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-brand focus:bg-white font-medium"
          />
        </div>

        <Button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Search Term Redirect</span>
        </Button>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Loading search redirects...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-400">
              <Search className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h4 className="text-sm font-bold text-neutral-800">No Search Term Redirects Configured</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              Configure search terms like &quot;axor apex&quot; or &quot;gloves&quot; so customers are automatically redirected to dedicated category landing pages instead of raw search lists.
            </p>
            <Button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Redirect Rule</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 text-neutral-600 border-b border-neutral-200 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Search Term & Synonyms</th>
                  <th className="py-3 px-4">Target Destination / Category</th>
                  <th className="py-3 px-4">Match Type</th>
                  <th className="py-3 px-4 text-center">Redirects</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Search Term & Synonyms */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{item.searchTerm}</div>
                      {item.synonyms && item.synonyms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.synonyms.map((syn, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-mono"
                            >
                              {syn}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Target Destination */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-800 flex items-center gap-1.5">
                        <FolderTree className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{item.targetTitle || item.redirectUrl}</span>
                      </div>
                      <a
                        href={item.redirectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline font-mono mt-0.5"
                      >
                        <span>{item.redirectUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                    {/* Match Type */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.matchType === "contains"
                            ? "bg-purple-100 text-purple-800"
                            : item.matchType === "fuzzy"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.matchType || "exact"}
                      </span>
                    </td>

                    {/* Hits */}
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {item.redirectCount || 0}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                          item.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                        }`}
                      >
                        {item.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-neutral-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title="Edit Rule"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          title="Delete Rule"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem ? "Edit Search Term Redirect" : "New Search Term Redirect"}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Route customer queries directly to specific category or custom landing pages.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Primary Search Term */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Primary Search Term <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. axor apex, gloves, rynox jacket"
                  value={formSearchTerm}
                  onChange={(e) => setFormSearchTerm(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-brand focus:bg-white font-medium"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  The primary search keyword entered by shoppers in the search bar.
                </p>
              </div>

              {/* Target Type & Fast Category Picker */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Select Target Category <span className="text-neutral-400 font-normal">(Menu & Submenu Selector)</span>
                </label>
                <select
                  value={formRedirectUrl}
                  onChange={handleCategorySelect}
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-brand focus:bg-white font-medium"
                >
                  <option value="" disabled>-- Select a Store Menu or Category --</option>
                  <optgroup label="🌟 Storefront Menu & Submenu Navigation">
                    {menuCategories.map((cat, idx) => (
                      <option key={`menu-${idx}`} value={cat.url}>
                        {cat.path}
                      </option>
                    ))}
                  </optgroup>
                  {databaseCustomCategories.length > 0 && (
                    <optgroup label="📁 Custom Categories Created in Admin">
                      {databaseCustomCategories.map((cat, idx) => (
                        <option key={`db-${idx}`} value={cat.url}>
                          {cat.path}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Redirect Target URL */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Redirect Target URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. /motorcycle-helmets/full-face-helmets/axor-apex"
                  value={formRedirectUrl}
                  onChange={(e) => setFormRedirectUrl(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-brand focus:bg-white font-mono text-xs"
                />
              </div>

              {/* Display Title / Label */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Friendly Label / Title <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Axor Apex Full Face Helmets"
                  value={formTargetTitle}
                  onChange={(e) => setFormTargetTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-brand focus:bg-white font-medium"
                />
              </div>

              {/* Match Type */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Match Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormMatchType("exact")}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      formMatchType === "exact"
                        ? "border-brand bg-brand/5 text-brand font-bold"
                        : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                    }`}
                  >
                    <div className="text-xs font-bold">Exact Match</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">Redirects on exact query match</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormMatchType("contains")}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      formMatchType === "contains"
                        ? "border-brand bg-brand/5 text-brand font-bold"
                        : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                    }`}
                  >
                    <div className="text-xs font-bold">Contains / Partial</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">Redirects if query contains term</div>
                  </button>
                </div>
              </div>

              {/* Common Misspellings / Synonyms */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Misspellings / Synonyms <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. axor apix, axor ap, axor helemt"
                    value={synonymInput}
                    onChange={(e) => setSynonymInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSynonym();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-brand font-medium"
                  />
                  <Button
                    type="button"
                    onClick={handleAddSynonym}
                    className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs px-3 py-2 rounded-lg"
                  >
                    Add
                  </Button>
                </div>

                {formSynonyms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formSynonyms.map((syn, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-800 border border-slate-200 font-mono"
                      >
                        <span>{syn}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSynonym(idx)}
                          className="hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-neutral-700">Enable this redirect immediately</span>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase px-5 py-2 rounded-lg shadow-sm"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Rule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSearchRedirectsManager;
