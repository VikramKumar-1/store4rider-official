"use client";

import React, { useState, useId } from "react";
import Image from "next/image";
import { X, Filter, ChevronLeft, ChevronRight, Box, Check, RefreshCw } from "lucide-react";
import { useAdminProducts, IBackendProduct } from "@/core/hooks/useProducts";

export type RelationType = "related" | "upsell" | "crosssell";

interface AddRelatedProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationType: RelationType;
  alreadyLinkedSkus: string[];
  currentProductSku?: string;
  onAddSelected: (products: IBackendProduct[]) => void;
}

const ATTRIBUTE_SETS = [
  "All Attribute Sets",
  "Helmets",
  "Helmet Accessories",
  "Jackets",
  "Gloves",
  "Boots",
  "Pants",
  "Luggage",
  "Armor & Protection",
  "Eyewear",
  "Accessories",
  "Default",
];

export function AddRelatedProductsModal({
  isOpen,
  onClose,
  relationType,
  alreadyLinkedSkus,
  currentProductSku,
  onAddSelected,
}: AddRelatedProductsModalProps) {
  // Title mapping according to Magento
  const modalTitle =
    relationType === "crosssell"
      ? "Add Cross-Sell Products"
      : relationType === "upsell"
      ? "Add Up-Sell Products"
      : "Add Related Products";

  // Filter States
  const [filterIdFrom, setFilterIdFrom] = useState("");
  const [filterIdTo, setFilterIdTo] = useState("");
  const [filterPriceFrom, setFilterPriceFrom] = useState("");
  const [filterPriceTo, setFilterPriceTo] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterAttributeSet, setFilterAttributeSet] = useState("All Attribute Sets");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterSku, setFilterSku] = useState("");

  // Applied Query States (only updated when "Apply Filters" is clicked)
  const [appliedFilters, setAppliedFilters] = useState<{
    id?: string;
    priceFrom?: number;
    priceTo?: number;
    name?: string;
    attributeSet?: string;
    status?: string;
    productType?: string;
    sku?: string;
  }>({});

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);

  // Selected Products state: maps SKU -> IBackendProduct
  const [selectedMap, setSelectedMap] = useState<Map<string, IBackendProduct>>(new Map());

  // Data fetching hook using our admin query endpoint
  const { data, isLoading, isFetching, refetch } = useAdminProducts({
    page,
    limit,
    name: appliedFilters.name,
    sku: appliedFilters.sku,
    id: appliedFilters.id,
    priceFrom: appliedFilters.priceFrom,
    priceTo: appliedFilters.priceTo,
    attributeSet: appliedFilters.attributeSet !== "All Attribute Sets" ? appliedFilters.attributeSet : undefined,
    status: appliedFilters.status !== "all" ? appliedFilters.status : undefined,
    productType: appliedFilters.productType !== "all" ? appliedFilters.productType : undefined,
  });

  const products = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || Math.ceil(totalCount / limit) || 1;

  if (!isOpen) return null;

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({
      id: filterIdFrom || filterIdTo ? filterIdFrom || filterIdTo : undefined,
      priceFrom: filterPriceFrom ? parseFloat(filterPriceFrom) : undefined,
      priceTo: filterPriceTo ? parseFloat(filterPriceTo) : undefined,
      name: filterName.trim() || undefined,
      attributeSet: filterAttributeSet !== "All Attribute Sets" ? filterAttributeSet : undefined,
      status: filterStatus !== "all" ? filterStatus : undefined,
      productType: filterType !== "all" ? filterType : undefined,
      sku: filterSku.trim() || undefined,
    });
  };

  const handleResetFilters = () => {
    setFilterIdFrom("");
    setFilterIdTo("");
    setFilterPriceFrom("");
    setFilterPriceTo("");
    setFilterName("");
    setFilterAttributeSet("All Attribute Sets");
    setFilterStatus("all");
    setFilterType("all");
    setFilterSku("");
    setAppliedFilters({});
    setPage(1);
  };

  const toggleSelect = (product: IBackendProduct) => {
    const next = new Map(selectedMap);
    if (next.has(product.sku)) {
      next.delete(product.sku);
    } else {
      next.set(product.sku, product);
    }
    setSelectedMap(next);
  };

  const isAllPageSelected =
    products.length > 0 &&
    products.every((p) => selectedMap.has(p.sku) || alreadyLinkedSkus.includes(p.sku));

  const toggleSelectAllPage = () => {
    const next = new Map(selectedMap);
    if (isAllPageSelected) {
      products.forEach((p) => {
        if (!alreadyLinkedSkus.includes(p.sku)) {
          next.delete(p.sku);
        }
      });
    } else {
      products.forEach((p) => {
        if (p.sku !== currentProductSku && !alreadyLinkedSkus.includes(p.sku)) {
          next.set(p.sku, p);
        }
      });
    }
    setSelectedMap(next);
  };

  const handleAddSelected = () => {
    const selectedList = Array.from(selectedMap.values());
    onAddSelected(selectedList);
    setSelectedMap(new Map());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-800">{modalTitle}</h2>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddSelected}
              disabled={selectedMap.size === 0}
              className={`px-5 py-2 text-sm font-semibold rounded-lg text-white shadow-xs transition-all flex items-center gap-1.5 ${
                selectedMap.size > 0
                  ? "bg-[#FF5429] hover:bg-[#e0451d] cursor-pointer"
                  : "bg-slate-300 cursor-not-allowed opacity-70"
              }`}
            >
              <Check size={16} />
              <span>Add Selected Products {selectedMap.size > 0 ? `(${selectedMap.size})` : ""}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors ml-2"
              title="Close Modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Search & Filters
            </span>
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md shadow-2xs hover:bg-slate-100 transition-colors"
            >
              <Filter size={13} className="text-slate-500" />
              <span>{isFilterPanelOpen ? "Hide Filters" : "Filters"}</span>
            </button>
          </div>

          {isFilterPanelOpen && (
            <div className="space-y-4 pt-1 animate-in slide-in-from-top-2 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* ID from / to */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ID</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="from"
                      value={filterIdFrom}
                      onChange={(e) => setFilterIdFrom(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:border-brand"
                    />
                    <input
                      type="text"
                      placeholder="to"
                      value={filterIdTo}
                      onChange={(e) => setFilterIdTo(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:border-brand"
                    />
                  </div>
                </div>

                {/* Price from / to */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Price (₹)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="from"
                      value={filterPriceFrom}
                      onChange={(e) => setFilterPriceFrom(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:border-brand"
                    />
                    <input
                      type="number"
                      placeholder="to"
                      value={filterPriceTo}
                      onChange={(e) => setFilterPriceTo(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:border-brand"
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="Product name..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:border-brand"
                  />
                </div>

                {/* Attribute Set */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Attribute Set</label>
                  <select
                    value={filterAttributeSet}
                    onChange={(e) => setFilterAttributeSet(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:border-brand"
                  >
                    {ATTRIBUTE_SETS.map((set) => (
                      <option key={set} value={set}>
                        {set}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:border-brand"
                  >
                    <option value="all">Any Status</option>
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:border-brand"
                  >
                    <option value="all">Any Type</option>
                    <option value="configurable">Configurable Product</option>
                    <option value="simple">Simple Product</option>
                  </select>
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. MTSBSND"
                    value={filterSku}
                    onChange={(e) => setFilterSku(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-brand focus:border-brand"
                  />
                </div>

                {/* Filter Action Buttons */}
                <div className="flex items-end justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#3E3835] hover:bg-slate-800 rounded shadow-xs transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Counter and Pagination Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium">
            <span>{totalCount.toLocaleString()} records found</span>
            {isFetching && <RefreshCw size={13} className="animate-spin text-brand ml-2" />}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 font-medium">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded border border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= totalPages) setPage(val);
                  }}
                  className="w-10 px-1 py-0.5 text-center border border-slate-300 rounded text-xs font-semibold"
                />
                <span className="text-slate-400">of {totalPages}</span>
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded border border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid Table matching Magento UI */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium">Loading catalog records...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
              <Box size={40} className="text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No products found</p>
              <p className="text-xs text-slate-400 mt-1">Try loosening your filter parameters.</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-3 py-1.5 text-xs font-medium text-brand border border-brand/30 rounded-lg hover:bg-brand/5"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-[#3E3835] text-white select-none">
                <tr className="border-b border-[#4E4744]">
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectAllPage}
                      className="rounded border-slate-400 text-brand focus:ring-brand cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3 font-semibold uppercase tracking-wider text-[11px] w-16">ID</th>
                  <th className="px-3 py-3 font-semibold uppercase tracking-wider text-[11px] w-14">Thumbnail</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Name</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Attribute Set</th>
                  <th className="px-3 py-3 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Type</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">SKU</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {products.map((product, index) => {
                  const isCurrent = product.sku === currentProductSku;
                  const isAlreadyLinked = alreadyLinkedSkus.includes(product.sku);
                  const isSelected = selectedMap.has(product.sku) || isAlreadyLinked;
                  const thumbnail = product.images?.[0]?.url;
                  const displayId =
                    (product as any).attributes?.entity_id ||
                    (product as any).attributes?.id ||
                    product._id.slice(-6);

                  const isProductDisabled =
                    product.status === "draft" ||
                    product.status === "archived" ||
                    product.stockStatus === 0;

                  return (
                    <tr
                      key={product._id}
                      onClick={() => {
                        if (!isCurrent && !isAlreadyLinked) toggleSelect(product);
                      }}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-amber-50/60 hover:bg-amber-50"
                          : isCurrent
                          ? "bg-slate-100/70 opacity-60 cursor-not-allowed"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isCurrent || isAlreadyLinked}
                          onChange={() => toggleSelect(product)}
                          className="rounded border-slate-300 text-brand focus:ring-brand cursor-pointer disabled:opacity-40"
                        />
                      </td>

                      <td className="px-3 py-2.5 font-mono text-slate-500">{displayId}</td>

                      <td className="px-3 py-2.5">
                        <div className="relative w-10 h-10 bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                          {thumbnail ? (
                            <Image
                              src={thumbnail}
                              alt={product.name}
                              fill
                              sizes="40px"
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Box size={16} />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-slate-800 line-clamp-1">{product.name}</p>
                        {isAlreadyLinked && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            Already Added
                          </span>
                        )}
                        {isCurrent && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">
                            Current Item
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-2.5 text-slate-600">
                        {product.attributeSetCode ||
                          (product as any).attributes?.attribute_set_code ||
                          "Helmet Accessories"}
                      </td>

                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            !isProductDisabled
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {!isProductDisabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>

                      <td className="px-4 py-2.5 text-slate-600 capitalize">
                        {product.productType === "configurable"
                          ? "Configurable Product"
                          : "Simple Product"}
                      </td>

                      <td className="px-4 py-2.5 font-mono text-slate-800 font-medium">
                        {product.sku}
                      </td>

                      <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                        ₹{(product.specialPrice || product.basePrice || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            {selectedMap.size > 0 ? (
              <strong className="text-brand font-semibold">{selectedMap.size} product(s) selected</strong>
            ) : (
              "Select products above to link"
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddSelected}
              disabled={selectedMap.size === 0}
              className={`px-4 py-1.5 text-xs font-semibold rounded text-white transition-all ${
                selectedMap.size > 0
                  ? "bg-[#FF5429] hover:bg-[#e0451d] cursor-pointer"
                  : "bg-slate-300 cursor-not-allowed opacity-70"
              }`}
            >
              Add Selected Products {selectedMap.size > 0 ? `(${selectedMap.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
