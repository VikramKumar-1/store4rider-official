"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FolderTree, ChevronRight, Check, X, Box, Loader2, Tag } from "lucide-react";
import { getStoreNavbarCategoryTree, IStoreCategoryNode } from "@/core/utils/navCategories";
import { useCategoryTree } from "@/core/hooks/useCategories";
import { apiClient } from "@/core/api/client";
import Link from "next/link";

export interface SelectedCategoryMeta {
  id: string;
  name: string;
  slug: string;
  fullPath: string;
  isProduct?: boolean;
  linkUrl?: string;
  imageUrl?: string;
  sku?: string;
  priceFormatted?: string;
}

interface HierarchicalCategorySelectProps {
  tree?: any[];
  value?: string;
  onSelect: (cat: SelectedCategoryMeta) => void;
  label?: string;
  hint?: string;
}

export function HierarchicalCategorySelect({
  tree,
  value,
  onSelect,
  label = "Select Store Category or Product (Hierarchical)",
  hint = "Choose parent category (e.g. Helmets) › subcategory (e.g. Full Face Helmets) › optionally pick a specific product.",
}: HierarchicalCategorySelectProps) {
  // Selected category nodes at each level
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Product selection within chosen category
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductName, setSelectedProductName] = useState<string>("");

  // DB categories to dynamically merge newly created custom categories
  const { data: dbCategories = [] } = useCategoryTree();

  // Authoritative Root / Parent Categories from Storefront Navbar + Merged Custom DB Categories
  const rootCategories = useMemo(() => {
    return getStoreNavbarCategoryTree(dbCategories);
  }, [dbCategories]);

  // Find parent node
  const parentNode = useMemo(() => {
    return rootCategories.find((c) => String(c._id || c.slug) === selectedParentId || c.slug === selectedParentId);
  }, [rootCategories, selectedParentId]);

  // Level 2: Subcategories of selected parent
  const subCategories = useMemo(() => {
    if (!parentNode || !parentNode.children) return [];
    return parentNode.children;
  }, [parentNode]);

  // Find subcategory node
  const subNode = useMemo(() => {
    return subCategories.find((c) => String(c._id || c.slug) === selectedSubId || c.slug === selectedSubId);
  }, [subCategories, selectedSubId]);

  // Level 3: Deep children of selected subcategory (if any)
  const childCategories = useMemo(() => {
    if (!subNode || !subNode.children) return [];
    return subNode.children;
  }, [subNode]);

  // Find child node
  const childNode = useMemo(() => {
    return childCategories.find((c) => String(c._id || c.slug) === selectedChildId || c.slug === selectedChildId);
  }, [childCategories, selectedChildId]);

  // Active Category node for product queries
  const activeCategoryNode = useMemo(() => {
    return childNode || subNode || parentNode || null;
  }, [childNode, subNode, parentNode]);

  // Synchronize with external value if provided
  useEffect(() => {
    if (!value || rootCategories.length === 0) return;

    // Search deep in tree to find matching category node
    const findInTree = (
      nodes: IStoreCategoryNode[],
      target: string,
      chain: IStoreCategoryNode[] = []
    ): IStoreCategoryNode[] | null => {
      for (const n of nodes) {
        const idMatch = String(n._id || n.slug) === target;
        const slugMatch = n.slug === target || `/${n.slug}` === target;
        if (idMatch || slugMatch) {
          return [...chain, n];
        }
        if (n.children && n.children.length > 0) {
          const res = findInTree(n.children, target, [...chain, n]);
          if (res) return res;
        }
      }
      return null;
    };

    const foundChain = findInTree(rootCategories, value);
    if (foundChain && foundChain.length > 0) {
      if (foundChain[0]) setSelectedParentId(String(foundChain[0]._id || foundChain[0].slug));
      if (foundChain[1]) setSelectedSubId(String(foundChain[1]._id || foundChain[1].slug));
      if (foundChain[2]) setSelectedChildId(String(foundChain[2]._id || foundChain[2].slug));
    }
  }, [value, rootCategories]);

  // Fetch products belonging to the active category
  useEffect(() => {
    if (!activeCategoryNode?.slug) {
      setProducts([]);
      return;
    }

    let isCurrent = true;
    setLoadingProducts(true);

    apiClient
      .get<{ data: { items: any[] } }>(`/products?category=${activeCategoryNode.slug}&limit=50`)
      .then((res) => {
        if (isCurrent) {
          const items = res.data?.data?.items || [];
          setProducts(items);

          // If the external value is a product link (/products/[slug]), auto-select it
          if (value && value.startsWith("/products/")) {
            const productSlug = value.replace("/products/", "");
            const match = items.find((p) => p.slug === productSlug);
            if (match) {
              setSelectedProductId(String(match._id || match.id || match.sku));
              setSelectedProductName(match.name);
            }
          }
        }
      })
      .catch(() => {
        if (isCurrent) setProducts([]);
      })
      .finally(() => {
        if (isCurrent) setLoadingProducts(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeCategoryNode?.slug, value]);

  // Handler for Level 1 (Parent Category)
  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedParentId(pId);
    setSelectedSubId("");
    setSelectedChildId("");
    setSelectedProductId("");
    setSelectedProductName("");

    const p = rootCategories.find((c) => String(c._id || c.slug) === pId || c.slug === pId);
    if (p) {
      onSelect({
        id: String(p._id || p.slug),
        name: p.name,
        slug: p.slug,
        fullPath: p.name,
        isProduct: false,
        linkUrl: p.linkUrl || `/${p.slug}`,
      });
    }
  };

  // Handler for Level 2 (Subcategory)
  const handleSubChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSelectedSubId(sId);
    setSelectedChildId("");
    setSelectedProductId("");
    setSelectedProductName("");

    const s = subCategories.find((c) => String(c._id || c.slug) === sId || c.slug === sId);
    if (s && parentNode) {
      onSelect({
        id: String(s._id || s.slug),
        name: s.name,
        slug: s.slug,
        fullPath: `${parentNode.name} › ${s.name}`,
        isProduct: false,
        linkUrl: s.linkUrl || `/${s.slug}`,
      });
    }
  };

  // Handler for Level 3 (Child Type)
  const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cId = e.target.value;
    setSelectedChildId(cId);
    setSelectedProductId("");
    setSelectedProductName("");

    const c = childCategories.find((node) => String(node._id || node.slug) === cId || node.slug === cId);
    if (c && parentNode && subNode) {
      onSelect({
        id: String(c._id || c.slug),
        name: c.name,
        slug: c.slug,
        fullPath: `${parentNode.name} › ${subNode.name} › ${c.name}`,
        isProduct: false,
        linkUrl: c.linkUrl || `/${c.slug}`,
      });
    }
  };

  // Handler for Product Selection
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedProductId(pId);

    // If "Entire Category" selected
    if (!pId) {
      setSelectedProductName("");
      if (activeCategoryNode) {
        onSelect({
          id: String(activeCategoryNode._id || activeCategoryNode.slug),
          name: activeCategoryNode.name,
          slug: activeCategoryNode.slug,
          fullPath: categoryBreadcrumbs,
          isProduct: false,
          linkUrl: `/${activeCategoryNode.slug}`,
        });
      }
      return;
    }

    const prod = products.find((p) => String(p._id || p.id || p.sku) === pId);
    if (prod && activeCategoryNode) {
      setSelectedProductName(prod.name);
      const effectivePrice = prod.specialPrice && prod.specialPrice > 0 ? prod.specialPrice : prod.basePrice;
      const priceFormatted = effectivePrice ? `₹ ${effectivePrice.toLocaleString("en-IN")}` : "";
      const primaryImage = prod.images && prod.images.length > 0 ? prod.images[0].url : "";

      onSelect({
        id: String(prod._id || prod.id || prod.sku),
        name: prod.name,
        slug: prod.slug,
        fullPath: `${categoryBreadcrumbs} › ${prod.name}`,
        isProduct: true,
        linkUrl: `/products/${prod.slug}`,
        imageUrl: primaryImage,
        sku: prod.sku,
        priceFormatted,
      });
    }
  };

  const categoryBreadcrumbs = [parentNode?.name, subNode?.name, childNode?.name].filter(Boolean).join(" › ");
  const fullBreadcrumbs = selectedProductName
    ? `${categoryBreadcrumbs} › ${selectedProductName}`
    : categoryBreadcrumbs;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Cascading Stepped Selectors */}
      <div className="space-y-2 bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs">
        {/* Step 1: Parent Category */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">
              Step 1: Main Parent Category
            </label>
            <Link
              href="/admin/categories"
              target="_blank"
              className="text-[9px] text-brand hover:underline font-semibold"
            >
              + Create Category
            </Link>
          </div>
          <select
            value={selectedParentId}
            onChange={handleParentChange}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-brand focus:bg-white font-medium shadow-2xs cursor-pointer"
          >
            <option value="">-- Choose Parent (e.g. Helmets, Riding Gear) --</option>
            {rootCategories.map((cat) => (
              <option key={String(cat._id || cat.slug)} value={String(cat._id || cat.slug)}>
                {cat.name} {cat.children && cat.children.length > 0 ? `(${cat.children.length} types)` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Subcategory (Appears when parent has children) */}
        {parentNode && subCategories.length > 0 && (
          <div className="animate-in fade-in duration-150 pt-1 border-t border-slate-100">
            <label className="block text-[10px] font-bold text-brand uppercase mb-0.5 flex items-center gap-1">
              <ChevronRight size={10} />
              Step 2: Subcategory under {parentNode.name}
            </label>
            <select
              value={selectedSubId}
              onChange={handleSubChange}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-brand focus:bg-white font-medium shadow-2xs cursor-pointer"
            >
              <option value="">-- Choose Subcategory (e.g. Full Face, Off Road) --</option>
              {subCategories.map((sub) => (
                <option key={String(sub._id || sub.slug)} value={String(sub._id || sub.slug)}>
                  {sub.name} {sub.children && sub.children.length > 0 ? `(${sub.children.length} types)` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 3: Deeper Child Subcategory (if any) */}
        {subNode && childCategories.length > 0 && (
          <div className="animate-in fade-in duration-150 pt-1 border-t border-slate-100">
            <label className="block text-[10px] font-bold text-brand uppercase mb-0.5 flex items-center gap-1">
              <ChevronRight size={10} />
              Step 3: Specific Type under {subNode.name}
            </label>
            <select
              value={selectedChildId}
              onChange={handleChildChange}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-brand focus:bg-white font-medium shadow-2xs cursor-pointer"
            >
              <option value="">-- Choose Specific Type --</option>
              {childCategories.map((child) => (
                <option key={String(child._id || child.slug)} value={String(child._id || child.slug)}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 4 / Product Selector: Pick a specific product from chosen category */}
        {activeCategoryNode && (
          <div className="animate-in fade-in duration-150 pt-1.5 border-t border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                <Box size={11} className="text-brand" />
                <span>Link a Specific Product (Optional)</span>
              </label>
              <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1">
                {loadingProducts ? (
                  <>
                    <Loader2 size={9} className="animate-spin text-brand" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>{products.length} products</span>
                )}
              </span>
            </div>

            <select
              value={selectedProductId}
              onChange={handleProductChange}
              disabled={loadingProducts}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-brand focus:bg-white font-medium shadow-2xs cursor-pointer disabled:opacity-60"
            >
              <option value="">
                -- Entire Category: /{activeCategoryNode.slug} (Default) --
              </option>
              {products.map((prod) => {
                const effectivePrice = prod.specialPrice && prod.specialPrice > 0 ? prod.specialPrice : prod.basePrice;
                const priceFormatted = effectivePrice ? ` ₹${effectivePrice.toLocaleString("en-IN")}` : "";
                return (
                  <option
                    key={String(prod._id || prod.id || prod.sku)}
                    value={String(prod._id || prod.id || prod.sku)}
                  >
                    {prod.name} {prod.sku ? `(SKU: ${prod.sku})` : ""}{priceFormatted}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Breadcrumb Confirmation Badge */}
        {fullBreadcrumbs && (
          <div className="pt-1.5 flex items-center justify-between text-[11px] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-emerald-900 mt-1">
            <div className="flex items-center gap-1 min-w-0">
              <Check size={12} className="text-emerald-600 shrink-0" />
              <span className="font-bold text-emerald-800 shrink-0">Selected:</span>
              <span className="truncate font-semibold">{fullBreadcrumbs}</span>
              {selectedProductName && (
                <span className="text-[9px] font-bold bg-brand text-white px-1 py-0.2 rounded shrink-0 ml-1">
                  Product
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedParentId("");
                setSelectedSubId("");
                setSelectedChildId("");
                setSelectedProductId("");
                setSelectedProductName("");
              }}
              className="text-emerald-700 hover:text-emerald-950 text-[10px] font-bold ml-1.5 shrink-0 cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}
