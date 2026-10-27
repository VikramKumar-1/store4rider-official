"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Upload,
  Download,
  Search,
  Edit2,
  Trash2,
  Box,
  FlaskConical,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  X,
  Tag,
} from "lucide-react";
import { useCategoryTree, ICategoryTree } from "@/core/hooks/useCategories";
import { SearchableSelect, Option } from "@/components/ui/SearchableSelect";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  useAdminProducts,
  useBulkUpdateProducts,
  useDeleteProduct,
} from "@/core/hooks/useProducts";
import { useBrands } from "@/core/hooks/useBrands";
import { downloadBrandProductCsv } from "@/core/utils/exportCsv";
import { apiClient } from "@/core/api/client";
import { toast } from "sonner";
import Link from "next/link";

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

export function AdminProducts() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || searchParams.get("categoryId") || "";

  const { data: brands = [] } = useBrands();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportBrand, setExportBrand] = useState("all");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");

  // Category & Magento Filters
  const [filterCategory, setFilterCategory] = useState<string>(categoryParam);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterSku, setFilterSku] = useState("");
  const [filterAttributeSet, setFilterAttributeSet] = useState("All Attribute Sets");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPriceFrom, setFilterPriceFrom] = useState("");
  const [filterPriceTo, setFilterPriceTo] = useState("");

  // Categories Tree for hierarchical filtering
  const { data: categoryTree = [] } = useCategoryTree();

  const flatCategoryOptions: Option[] = useMemo(() => {
    const flatten = (nodes: ICategoryTree[], depth = 0): (ICategoryTree & { depth: number })[] => {
      let result: (ICategoryTree & { depth: number })[] = [];
      for (const node of nodes) {
        result.push({ ...node, depth });
        if (node.children && node.children.length > 0) {
          result = result.concat(flatten(node.children, depth + 1));
        }
      }
      return result;
    };

    const list = flatten(categoryTree);
    return [
      { label: "All Categories & Submenus", value: "", description: "Show products across all categories" },
      ...list.map((c) => ({
        label: `${c.depth > 0 ? "— ".repeat(c.depth) : ""}${c.name}`,
        value: c.slug || c._id,
        description: `/${c.slug}`,
        badge: c.depth === 0 ? "Root" : `L${c.depth}`,
      })),
    ];
  }, [categoryTree]);

  // Applied Filters
  const [appliedFilters, setAppliedFilters] = useState<{
    category?: string;
    sku?: string;
    attributeSet?: string;
    status?: string;
    productType?: string;
    priceFrom?: number;
    priceTo?: number;
  }>({
    category: categoryParam || undefined,
  });

  // Sync category param if URL changes
  useEffect(() => {
    if (categoryParam) {
      setFilterCategory(categoryParam);
      setAppliedFilters((prev) => ({ ...prev, category: categoryParam }));
      setPage(1);
    }
  }, [categoryParam]);

  const { data, isLoading, isFetching } = useAdminProducts({
    page,
    limit,
    search: search.trim() || undefined,
    category: appliedFilters.category,
    sku: appliedFilters.sku,
    attributeSet: appliedFilters.attributeSet !== "All Attribute Sets" ? appliedFilters.attributeSet : undefined,
    status: appliedFilters.status !== "all" ? appliedFilters.status : undefined,
    productType: appliedFilters.productType !== "all" ? appliedFilters.productType : undefined,
    priceFrom: appliedFilters.priceFrom,
    priceTo: appliedFilters.priceTo,
  });

  const deleteProduct = useDeleteProduct();

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const bulkUpdate = useBulkUpdateProducts();
  const [uploadReport, setUploadReport] = useState<{ successCount: number; errorRows: any[] } | null>(null);

  const [testProductExists, setTestProductExists] = useState(false);
  const [isTogglingTestProduct, setIsTogglingTestProduct] = useState(false);

  useEffect(() => {
    checkTestProduct();
  }, []);

  const checkTestProduct = async () => {
    try {
      const res = await apiClient.get("/admin/products/test-product");
      setTestProductExists(Boolean(res.data?.data?.exists));
    } catch (e) {}
  };

  const handleCreateTestProduct = async () => {
    setIsTogglingTestProduct(true);
    try {
      await apiClient.post("/admin/products/test-product");
      setTestProductExists(true);
      toast.success("₹1 Sandbox Test Product created with 999 stock!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create test product");
    } finally {
      setIsTogglingTestProduct(false);
    }
  };

  const handleDeleteTestProduct = async () => {
    setIsTogglingTestProduct(true);
    try {
      await apiClient.delete("/admin/products/test-product");
      setTestProductExists(false);
      toast.success("Test product removed from database!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove test product");
    } finally {
      setIsTogglingTestProduct(false);
    }
  };

  const handleCsvUpload = () => {
    if (!csvFile) return;
    bulkUpdate.mutate(csvFile, {
      onSuccess: (report) => {
        setUploadReport(report);
        toast.success(`Updated ${report.successCount} products successfully.`);
        setCsvFile(null);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || "CSV upload failed");
      },
    });
  };

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({
      category: filterCategory || undefined,
      sku: filterSku.trim() || undefined,
      attributeSet: filterAttributeSet !== "All Attribute Sets" ? filterAttributeSet : undefined,
      status: filterStatus !== "all" ? filterStatus : undefined,
      productType: filterType !== "all" ? filterType : undefined,
      priceFrom: filterPriceFrom ? parseFloat(filterPriceFrom) : undefined,
      priceTo: filterPriceTo ? parseFloat(filterPriceTo) : undefined,
    });
  };

  const handleResetFilters = () => {
    setFilterCategory("");
    setFilterSku("");
    setFilterAttributeSet("All Attribute Sets");
    setFilterStatus("all");
    setFilterType("all");
    setFilterPriceFrom("");
    setFilterPriceTo("");
    setAppliedFilters({});
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(appliedFilters.category) ||
    Boolean(appliedFilters.sku) ||
    Boolean(appliedFilters.attributeSet) ||
    Boolean(appliedFilters.status) ||
    Boolean(appliedFilters.productType) ||
    appliedFilters.priceFrom !== undefined ||
    appliedFilters.priceTo !== undefined;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Products</h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage your store catalog and product inventory
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {testProductExists ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg shadow-2xs">
              <Link
                href="/products/store4riders-test-product"
                target="_blank"
                className="text-xs font-bold text-amber-900 hover:text-brand flex items-center gap-1.5 transition-colors"
              >
                <span>🧪 Test Item (₹1)</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1 py-0.5 rounded font-mono">
                  999 Stock
                </span>
              </Link>
              <button
                type="button"
                onClick={handleDeleteTestProduct}
                disabled={isTogglingTestProduct}
                className="text-amber-700 hover:text-red-600 transition-colors cursor-pointer text-xs p-1"
                title="Remove Test Product"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCreateTestProduct}
              disabled={isTogglingTestProduct}
              className="text-xs font-semibold px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FlaskConical size={14} />
              <span>Create ₹1 Sandbox Item</span>
            </button>
          )}

          <Button
            variant="outline"
            className="flex items-center space-x-2 text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
            onClick={() => {
              setUploadReport(null);
              setIsCsvModalOpen(true);
            }}
          >
            <Upload size={18} />
            <span>Bulk CSV Update</span>
          </Button>

          <Button
            variant="outline"
            className="flex items-center space-x-2 text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
            onClick={() => setIsExportModalOpen(true)}
            title="Export products CSV by brand or full catalog"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </Button>

          <Link href="/admin/products/new">
            <Button className="flex items-center space-x-2 shadow-xs bg-brand hover:bg-brand/90 text-white cursor-pointer">
              <Plus size={18} />
              <span>Add Product</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Search & Filter Header Bar */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4 bg-white">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search product name, brand, SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer ${
                isFilterOpen || hasActiveFilters
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Filter size={14} />
              <span>Filters {hasActiveFilters ? "(Active)" : ""}</span>
            </button>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Collapsible Magento-style Filter Grid */}
        {isFilterOpen && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                  <FolderTree size={13} className="text-brand" />
                  Category / Submenu Filter
                </label>
                <SearchableSelect
                  options={flatCategoryOptions}
                  value={filterCategory}
                  onChange={(val) => setFilterCategory(val)}
                  placeholder="Select Category or Submenu..."
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">SKU</label>
                <input
                  type="text"
                  placeholder="e.g. MTSBSND"
                  value={filterSku}
                  onChange={(e) => setFilterSku(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Attribute Set</label>
                <select
                  value={filterAttributeSet}
                  onChange={(e) => setFilterAttributeSet(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                >
                  {ATTRIBUTE_SETS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                >
                  <option value="all">Any Status</option>
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                >
                  <option value="all">Any Type</option>
                  <option value="configurable">Configurable Product</option>
                  <option value="simple">Simple Product</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Price From (₹)</label>
                <input
                  type="number"
                  placeholder="Min price"
                  value={filterPriceFrom}
                  onChange={(e) => setFilterPriceFrom(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Price To (₹)</label>
                <input
                  type="number"
                  placeholder="Max price"
                  value={filterPriceTo}
                  onChange={(e) => setFilterPriceTo(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div className="sm:col-span-2 flex items-end justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#3E3835] hover:bg-slate-800 rounded shadow-2xs transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Record count notice */}
        <div className="px-5 py-2.5 bg-slate-50/50 border-b border-slate-200 text-xs text-slate-500 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2 font-medium flex-wrap">
            <span>{data?.totalCount?.toLocaleString() || 0} records found</span>
            {appliedFilters.category && (
              <span className="inline-flex items-center gap-1.5 bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                <FolderTree size={12} />
                <span>
                  Category: {flatCategoryOptions.find((o) => o.value === appliedFilters.category)?.label?.replace(/^[—s]+/, "") || appliedFilters.category}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory("");
                    setAppliedFilters((prev) => ({ ...prev, category: undefined }));
                    setPage(1);
                  }}
                  className="ml-1 text-slate-400 hover:text-red-600 font-bold cursor-pointer"
                  title="Remove category filter"
                >
                  ✕
                </button>
              </span>
            )}
            {isFetching && <RefreshCw size={13} className="animate-spin text-brand ml-2" />}
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center">
            <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mb-4" />
            Loading catalog products...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#3E3835] text-white select-none">
                <tr className="border-b border-[#4E4744]">
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] w-14">Thumbnail</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px]">Product</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Attribute Set</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">SKU</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Price</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Type</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data?.items?.map((product) => {
                  const thumbnail = product.images?.[0]?.url;
                  const isProductDisabled =
                    product.status === "draft" ||
                    product.status === "archived" ||
                    product.stockStatus === 0;

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="relative w-10 h-10 bg-slate-100 rounded border border-slate-200 flex-shrink-0 overflow-hidden">
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
                              <Box size={18} />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800 line-clamp-1">{product.name}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-[11px] text-slate-400">{product.brand || "Store4Riders"}</span>
                          {product.categorySlugs && product.categorySlugs.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                              <FolderTree size={9} className="text-slate-400" />
                              {product.categorySlugs[0]}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {product.attributeSetCode ||
                          (product as any).attributes?.attribute_set_code ||
                          "Default"}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-700 font-medium">
                        {product.sku}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800">
                        ₹{(product.specialPrice || product.basePrice || 0).toFixed(2)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            !isProductDisabled
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {!isProductDisabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600 capitalize">
                        {product.productType === "configurable" ? "Configurable" : "Simple"}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link
                            href={`/admin/products/${product.slug || product._id}/edit`}
                            className="p-1.5 text-slate-500 hover:text-brand transition-colors rounded-lg hover:bg-slate-100"
                            title="Edit Product"
                          >
                            <Edit2 size={15} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                                deleteProduct.mutate(product._id, {
                                  onSuccess: () => toast.success("Product deleted successfully"),
                                  onError: (err: any) =>
                                    toast.error(
                                      err.response?.data?.error || "Failed to delete product"
                                    ),
                                });
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-white text-xs text-slate-600">
            <span>
              Showing page {data.page} of {data.totalPages} ({data.totalCount} total)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 text-xs px-3"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 font-medium">
                <input
                  type="number"
                  min={1}
                  max={data.totalPages}
                  value={page}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= data.totalPages) setPage(val);
                  }}
                  className="w-10 px-1 py-1 text-center border border-slate-300 rounded text-xs font-semibold"
                />
                <span className="text-slate-400">/ {data.totalPages}</span>
              </div>
              <Button
                variant="outline"
                disabled={page === data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                className="h-8 text-xs px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Bulk Update Products (CSV)"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Upload a CSV file to bulk update stock and pricing. The CSV must have a header row with{" "}
            <code>sku</code>. Optional columns: <code>basePrice</code>, <code>specialPrice</code>,{" "}
            <code>stockStatus</code> (0 or 1).
          </p>

          {!uploadReport ? (
            <>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full p-2 border border-slate-300 rounded"
              />
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsCsvModalOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={!csvFile || bulkUpdate.isPending} onClick={handleCsvUpload}>
                  {bulkUpdate.isPending ? "Uploading..." : "Upload & Process"}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
                <h4 className="font-semibold">Update Complete</h4>
                <p>Successfully updated {uploadReport.successCount} products.</p>
              </div>

              {uploadReport.errorRows?.length > 0 && (
                <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 max-h-60 overflow-y-auto">
                  <h4 className="font-semibold mb-2">{uploadReport.errorRows.length} Errors Found</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {uploadReport.errorRows.map((err, i) => (
                      <li key={i}>
                        Row {err.row}: {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={() => setIsCsvModalOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Brand-Specific or Full Catalog CSV Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Products CSV"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-500">
            Download your product catalog in standard Magento CSV format. You can export all products or filter exclusively by a single brand for easy spreadsheet editing and inventory stock updates.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Brand to Export
            </label>
            <select
              value={exportBrand}
              onChange={(e) => setExportBrand(e.target.value)}
              className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-brand focus:ring-1 focus:ring-brand font-medium text-slate-800"
            >
              <option value="all">🌐 All Brands (Full Catalog Export)</option>
              {brands.map((b) => (
                <option key={b._id} value={b.name}>
                  🏷️ {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">
              {exportBrand === "all"
                ? "Full Catalog Export: Exports all products and child variants across all brands."
                : `Selective Brand Export: Exports only products and variants belonging to "${exportBrand}".`}
            </p>
            <p className="text-[11px] text-slate-400">
              Includes parent rows, child variants, pricing, stock levels, images, swatches, categories, and attributes.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                downloadBrandProductCsv(exportBrand);
                setIsExportModalOpen(false);
              }}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <Download size={16} />
              <span>
                {exportBrand === "all" ? "Download All Products CSV" : `Download ${exportBrand} CSV`}
              </span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
