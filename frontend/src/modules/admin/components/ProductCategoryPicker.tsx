"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiClient } from "@/core/api/client";
import { useCategoryTree, useCreateCategory } from "@/core/hooks/useCategories";
import { getStoreNavbarCategoryTree, IStoreCategoryNode } from "@/core/utils/navCategories";
import {
  Search,
  FolderTree,
  Box,
  Link as LinkIcon,
  X,
  Loader2,
  ArrowRight,
  ChevronRight,
  Check,
  Filter,
  Plus,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export interface SelectedItemData {
  type: "product" | "category" | "custom";
  linkUrl: string;
  title: string;
  sku?: string;
  priceFormatted?: string;
  imageUrl?: string;
  categoryName?: string;
}

interface ProductCategoryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: SelectedItemData) => void;
  title?: string;
  mode?: "category-only" | "product-only" | "all";
}

export function ProductCategoryPicker({
  isOpen,
  onClose,
  onSelect,
  title,
  mode = "all",
}: ProductCategoryPickerProps) {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "custom">(
    mode === "category-only" ? "categories" : "products"
  );

  useEffect(() => {
    if (mode === "category-only") {
      setActiveTab("categories");
    } else if (mode === "product-only") {
      setActiveTab("products");
    }
  }, [mode, isOpen]);

  // Raw DB categories from database (to merge newly created categories)
  const { data: dbCategories = [] } = useCategoryTree();
  const createCategoryMutation = useCreateCategory();

  // Authoritative Category Tree from Storefront Navbar + Merged New DB Categories
  const rootCategories = useMemo(() => {
    return getStoreNavbarCategoryTree(dbCategories);
  }, [dbCategories]);

  // Product Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filterParentSlug, setFilterParentSlug] = useState<string>("");
  const [filterSubSlug, setFilterSubSlug] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Store Categories Browser State (Hierarchical drill-down)
  const [selectedParentCategory, setSelectedParentCategory] = useState<IStoreCategoryNode | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<IStoreCategoryNode | null>(null);

  // Quick Add Category State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParentId, setNewCatParentId] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");

  // Custom Link State
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  // Subcategories of selected parent in Product Filter
  const subCategoriesForProductFilter = useMemo(() => {
    if (!filterParentSlug) return [];
    const parent = rootCategories.find((c) => c.slug === filterParentSlug);
    return parent?.children || [];
  }, [rootCategories, filterParentSlug]);

  // Subcategories of selected parent in Category Browser Tab
  const subCategoriesForBrowser = useMemo(() => {
    if (!selectedParentCategory) return [];
    return selectedParentCategory.children || [];
  }, [selectedParentCategory]);

  // Debounce product search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Set default selected parent category when tree loads
  useEffect(() => {
    if (rootCategories.length > 0 && !selectedParentCategory) {
      setSelectedParentCategory(rootCategories[0]);
    }
  }, [rootCategories, selectedParentCategory]);

  // Auto-slugify new category name
  const handleNewNameChange = (val: string) => {
    setNewCatName(val);
    setNewCatSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  // Submit quick category creation
  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const created = await createCategoryMutation.mutateAsync({
        name: newCatName.trim(),
        slug: newCatSlug.trim() || undefined,
        parentId: newCatParentId || undefined,
        includeInMenu: true,
        menuGroup: "admin-custom",
      });

      toast.success(`Category "${newCatName}" created successfully!`);
      setNewCatName("");
      setNewCatSlug("");
      setShowQuickAdd(false);

      // Auto select the new category
      onSelect({
        type: "category",
        linkUrl: `/${created.slug}`,
        title: created.name,
        categoryName: created.name,
      });
      onClose();
    } catch {
      // Error handled by mutation onError
    }
  };

  // Fetch products when query or category filter changes
  useEffect(() => {
    if (!isOpen || activeTab !== "products") return;

    let isCurrent = true;
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const queryParams = new URLSearchParams();
        if (debouncedQuery.trim()) {
          queryParams.append("search", debouncedQuery.trim());
        }

        const activeCategory = filterSubSlug || filterParentSlug;
        if (activeCategory) {
          queryParams.append("category", activeCategory);
        }

        queryParams.append("limit", "20");

        const res = await apiClient.get<{ data: { items: any[] } }>(
          `/products?${queryParams.toString()}`
        );
        if (isCurrent) {
          setProducts(res.data.data.items || []);
        }
      } catch (err) {
        console.error("Failed to fetch products for picker:", err);
      } finally {
        if (isCurrent) setLoadingProducts(false);
      }
    };

    fetchProducts();
    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery, filterParentSlug, filterSubSlug, isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSelectProduct = (prod: any) => {
    const effectivePrice = prod.specialPrice && prod.specialPrice > 0 ? prod.specialPrice : prod.basePrice;
    const priceFormatted = effectivePrice ? `₹ ${effectivePrice.toLocaleString("en-IN")}` : "";
    const primaryImage = prod.images && prod.images.length > 0 ? prod.images[0].url : "";

    onSelect({
      type: "product",
      linkUrl: `/products/${prod.slug}`,
      title: prod.name,
      sku: prod.sku,
      priceFormatted,
      imageUrl: primaryImage,
      categoryName: prod.magentoCategories?.split("/")?.pop() || "Riding Gear",
    });
    onClose();
  };

  const handleSelectCategory = (cat: IStoreCategoryNode, parentName?: string) => {
    onSelect({
      type: "category",
      linkUrl: cat.linkUrl || `/${cat.slug}`,
      title: cat.name,
      categoryName: parentName ? `${parentName} › ${cat.name}` : cat.name,
      imageUrl: cat.image || "",
    });
    onClose();
  };

  const handleSelectCustom = () => {
    if (!customUrl.trim()) return;
    onSelect({
      type: "custom",
      linkUrl: customUrl.trim(),
      title: customTitle.trim() || customUrl.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Compact Header */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
              {mode === "category-only" ? (
                <FolderTree className="w-4 h-4 text-brand shrink-0" />
              ) : (
                <Box className="w-4 h-4 text-brand shrink-0" />
              )}
              <span>
                {title ||
                  (mode === "category-only"
                    ? "Select Store Category"
                    : mode === "product-only"
                    ? "Select Product from Catalog"
                    : "Select Product, Category, or Destination Link")}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 truncate">
              {mode === "category-only"
                ? "Select an official store category or subcategory (e.g. Helmets, Gloves, Jackets) for this banner."
                : "Pick from navbar categories, search products by SKU/title, or quick-add new categories."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={15} />
          </button>
        </div>

        {/* Compact Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4">
          <div className="flex gap-1">
            {mode !== "category-only" && (
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "products"
                    ? "border-brand text-brand bg-white rounded-t-md shadow-2xs"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Box size={13} />
                <span>Products & Catalog</span>
              </button>
            )}

            {mode !== "product-only" && (
              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "categories"
                    ? "border-brand text-brand bg-white rounded-t-md shadow-2xs"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <FolderTree size={13} />
                <span>Category Hierarchy</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "custom"
                  ? "border-brand text-brand bg-white rounded-t-md shadow-2xs"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <LinkIcon size={13} />
              <span>Custom URL</span>
            </button>
          </div>

          {/* Quick Add Category Action */}
          <button
            type="button"
            onClick={() => setShowQuickAdd((prev) => !prev)}
            className="text-[11px] font-bold text-brand hover:text-brand/80 flex items-center gap-1 px-2 py-1 rounded bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
          >
            <Plus size={12} />
            <span>{showQuickAdd ? "Close Add Form" : "+ Create Category"}</span>
          </button>
        </div>

        {/* Quick Add Category Inline Panel */}
        {showQuickAdd && (
          <form
            onSubmit={handleQuickCreateCategory}
            className="p-3 bg-amber-50/60 border-b border-amber-200 space-y-2 text-xs animate-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                <FolderTree size={13} className="text-amber-700" />
                Quick Create New Category or Subcategory
              </span>
              <Link
                href="/admin/categories"
                target="_blank"
                className="text-[10px] text-slate-500 hover:text-brand flex items-center gap-0.5 underline"
              >
                Full Category Manager <ExternalLink size={10} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => handleNewNameChange(e.target.value)}
                  placeholder="e.g. Airbag Vests"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-brand shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  Parent Category (Optional)
                </label>
                <select
                  value={newCatParentId}
                  onChange={(e) => setNewCatParentId(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-2 py-1.5 rounded focus:outline-none focus:border-brand shadow-2xs cursor-pointer"
                >
                  <option value="">-- Create as Root Parent Category --</option>
                  {rootCategories.map((p) => (
                    <option key={p.id} value={p.id}>
                      Subcategory under {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  placeholder="e.g. airbag-vests"
                  className="w-full bg-white border border-slate-300 text-slate-700 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-brand font-mono shadow-2xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="px-2.5 py-1 rounded text-slate-600 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCategoryMutation.isPending}
                className="px-3 py-1 bg-brand hover:bg-brand/90 text-white rounded text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1"
              >
                {createCategoryMutation.isPending && (
                  <Loader2 size={11} className="animate-spin" />
                )}
                <span>Save & Select</span>
              </button>
            </div>
          </form>
        )}

        {/* Content Area */}
        <div className="p-3.5 flex-1 overflow-y-auto">
          {/* TAB 1: PRODUCTS WITH HIERARCHICAL CATEGORY DRILL-DOWN */}
          {activeTab === "products" && (
            <div className="space-y-3">
              {/* Stepped Hierarchical Filter Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 uppercase">
                  <Filter size={12} className="text-brand" />
                  <span>Category Drill-Down Filter:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      1. Parent Category:
                    </label>
                    <select
                      value={filterParentSlug}
                      onChange={(e) => {
                        setFilterParentSlug(e.target.value);
                        setFilterSubSlug("");
                      }}
                      className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-brand font-medium shadow-2xs cursor-pointer"
                    >
                      <option value="">-- All Categories (Entire Catalog) --</option>
                      {rootCategories.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name} {p.children && p.children.length > 0 ? `(${p.children.length} types)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-brand uppercase mb-0.5 flex items-center gap-1">
                      <ChevronRight size={10} />
                      2. Subcategory:
                    </label>
                    <select
                      value={filterSubSlug}
                      onChange={(e) => setFilterSubSlug(e.target.value)}
                      disabled={!filterParentSlug || subCategoriesForProductFilter.length === 0}
                      className="w-full bg-white border border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-800 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-brand font-medium shadow-2xs cursor-pointer"
                    >
                      <option value="">
                        {!filterParentSlug
                          ? "Select a parent category first..."
                          : subCategoriesForProductFilter.length === 0
                          ? "No subcategories found"
                          : "-- All Subcategories under this Parent --"}
                      </option>
                      {subCategoriesForProductFilter.map((sub) => (
                        <option key={sub.slug} value={sub.slug}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active filter badge */}
                {(filterParentSlug || filterSubSlug) && (
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                    <span className="text-slate-600">
                      Filtering:{" "}
                      <strong className="text-slate-900">
                        {filterSubSlug
                          ? `${rootCategories.find((c) => c.slug === filterParentSlug)?.name} › ${subCategoriesForProductFilter.find((s) => s.slug === filterSubSlug)?.name}`
                          : rootCategories.find((c) => c.slug === filterParentSlug)?.name}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterParentSlug("");
                        setFilterSubSlug("");
                      }}
                      className="text-brand hover:underline font-bold cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>

              {/* Keyword / SKU Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by SKU, Product Title, or Model (e.g. Apex, Axor, Helmet, Glove)..."
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs pl-8 pr-10 py-2 rounded-lg focus:outline-none focus:border-brand shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Product Results */}
              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-brand mb-1.5" />
                  <p className="text-xs font-semibold">Fetching products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No products found for this category and search criteria.
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>Showing {products.length} Products</span>
                  </div>

                  <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-1">
                    {products.map((prod) => {
                      const displayPrice =
                        prod.specialPrice && prod.specialPrice > 0 ? prod.specialPrice : prod.basePrice;
                      const thumb = prod.images?.[0]?.url || "/no-image.svg";

                      return (
                        <div
                          key={prod._id || prod.sku}
                          onClick={() => handleSelectProduct(prod)}
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-white hover:bg-red-50/20 hover:border-brand/40 cursor-pointer transition-all shadow-2xs group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-9 h-9 bg-slate-100 rounded overflow-hidden shrink-0 border border-slate-200">
                              <Image
                                src={thumb}
                                alt={prod.name}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="min-w-0 flex flex-col">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-brand transition-colors truncate">
                                {prod.name}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="bg-slate-100 text-slate-700 px-1 py-0.2 rounded text-[9px] font-mono border border-slate-200">
                                  SKU: {prod.sku}
                                </span>
                                {prod.brand && (
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {prod.brand}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs font-bold text-emerald-700">
                              ₹ {displayPrice?.toLocaleString("en-IN") || "0"}
                            </span>
                            <button
                              type="button"
                              className="px-2 py-1 bg-brand text-white rounded text-[11px] font-bold flex items-center gap-1 group-hover:bg-brand/90 shadow-2xs cursor-pointer"
                            >
                              <span>Select</span>
                              <ArrowRight size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HIERARCHICAL STEPPED CATEGORY BROWSER */}
          {activeTab === "categories" && (
            <div className="space-y-2.5">
              <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Hierarchical Order: </span>
                  Choose a Parent Category on the left, then select its exact Subcategory on the right.
                </div>
                <Link
                  href="/admin/categories"
                  target="_blank"
                  className="text-[10px] text-brand hover:underline flex items-center gap-0.5 shrink-0 ml-2 font-bold"
                >
                  Manage Categories <ExternalLink size={10} />
                </Link>
              </div>

              {/* Compact 2-Column Drill-Down Browser */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-[320px]">
                {/* Column 1: Parent Categories */}
                <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col bg-white shadow-2xs">
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                    <span>1. Store Categories</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {rootCategories.length} Categories
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                    {rootCategories.map((parent) => {
                      const isSelected = selectedParentCategory?._id === parent._id;
                      return (
                        <div
                          key={parent.slug}
                          onClick={() => {
                            setSelectedParentCategory(parent);
                            setSelectedSubCategory(null);
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                            isSelected
                              ? "bg-brand text-white shadow-xs font-bold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FolderTree size={13} className={isSelected ? "text-white" : "text-brand"} />
                            <span className="truncate">{parent.name}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {parent.children && parent.children.length > 0 && (
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {parent.children.length}
                              </span>
                            )}
                            <ChevronRight size={12} className={isSelected ? "text-white" : "text-slate-400"} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Subcategories under selected parent */}
                <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col bg-white shadow-2xs">
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                    <span className="truncate">
                      2. Subcategories under{" "}
                      <strong className="text-brand">
                        {selectedParentCategory?.name || "Parent"}
                      </strong>
                    </span>
                    {selectedParentCategory && (
                      <button
                        type="button"
                        onClick={() => handleSelectCategory(selectedParentCategory)}
                        className="text-[10px] font-bold text-brand hover:underline cursor-pointer shrink-0 ml-1"
                      >
                        Select Parent Itself
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                    {subCategoriesForBrowser.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        {selectedParentCategory
                          ? `No subcategories under "${selectedParentCategory.name}". You can select this parent category directly.`
                          : "Choose a parent category from the left column."}
                      </div>
                    ) : (
                      subCategoriesForBrowser.map((sub) => (
                        <div
                          key={sub.slug}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-brand/40 bg-white hover:bg-slate-50/70 transition-all shadow-2xs group"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-brand transition-colors truncate">
                              {sub.name}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono truncate">
                              /{sub.slug}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectCategory(sub, selectedParentCategory?.name)}
                            className="px-2 py-1 bg-brand text-white rounded text-[10px] font-bold flex items-center gap-0.5 group-hover:bg-brand/90 shadow-2xs cursor-pointer shrink-0"
                          >
                            <span>Select</span>
                            <ArrowRight size={10} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM URL */}
          {activeTab === "custom" && (
            <div className="space-y-3">
              <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Custom Destination Link URL *
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="e.g. /products?sale=true or /motorcycle-helmets"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-brand font-mono shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Label / Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Clearance Sale"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-brand shadow-2xs"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSelectCustom}
                    disabled={!customUrl.trim()}
                    className="px-3 py-1.5 bg-brand hover:bg-brand/90 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    Apply Custom Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
