"use client";

import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from "@/core/hooks/useCoupons";
import { useBrands } from "@/core/hooks/useBrands";
import { useCategoryTree } from "@/core/hooks/useCategories";
import { ICoupon, CouponScope } from "@store4riders/shared-types";
import { toast } from "sonner";

export function AdminCoupons() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [scope, setScope] = useState("all_scopes");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCoupons({ search, status, scope, page, limit: 15 });
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const { data: brands = [] } = useBrands();
  const { data: categoryTree = [] } = useCategoryTree();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<ICoupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    description: string;
    discountType: "percent" | "fixed";
    discountValue: number;
    maxDiscountCap: string;
    minPurchase: number;
    startDate: string;
    expiryDate: string;
    isActive: boolean;
    scope: CouponScope;
    applicableBrands: string[];
    applicableCategories: string[];
    excludeSaleItems: boolean;
    firstOrderOnly: boolean;
    usageLimitPerUser: number;
    totalUsageLimit: string;
  }>({
    code: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    maxDiscountCap: "",
    minPurchase: 0,
    startDate: "",
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
    scope: "all",
    applicableBrands: [],
    applicableCategories: [],
    excludeSaleItems: false,
    firstOrderOnly: false,
    usageLimitPerUser: 1,
    totalUsageLimit: "",
  });

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      description: "",
      discountType: "percent",
      discountValue: 10,
      maxDiscountCap: "1000",
      minPurchase: 999,
      startDate: new Date().toISOString().slice(0, 16),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      isActive: true,
      scope: "all",
      applicableBrands: [],
      applicableCategories: [],
      excludeSaleItems: false,
      firstOrderOnly: false,
      usageLimitPerUser: 1,
      totalUsageLimit: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: ICoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountCap: coupon.maxDiscountCap ? String(coupon.maxDiscountCap) : "",
      minPurchase: coupon.minPurchase || 0,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : "",
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 16) : "",
      isActive: coupon.isActive,
      scope: coupon.scope || "all",
      applicableBrands: coupon.applicableBrands || [],
      applicableCategories: coupon.applicableCategories || [],
      excludeSaleItems: coupon.excludeSaleItems || false,
      firstOrderOnly: coupon.firstOrderOnly || false,
      usageLimitPerUser: coupon.usageLimitPerUser || 1,
      totalUsageLimit: coupon.totalUsageLimit ? String(coupon.totalUsageLimit) : "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    if (formData.discountValue <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }
    if (!formData.expiryDate) {
      toast.error("Expiry date is required");
      return;
    }

    const payload: Partial<ICoupon> = {
      code: formData.code.toUpperCase().trim(),
      description: formData.description.trim() || undefined,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      maxDiscountCap: formData.maxDiscountCap ? Number(formData.maxDiscountCap) : undefined,
      minPurchase: Number(formData.minPurchase) || 0,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      expiryDate: new Date(formData.expiryDate).toISOString(),
      isActive: formData.isActive,
      scope: formData.scope,
      applicableBrands: formData.scope === "brand" ? formData.applicableBrands : undefined,
      applicableCategories: formData.scope === "category" ? formData.applicableCategories : undefined,
      excludeSaleItems: formData.excludeSaleItems,
      firstOrderOnly: formData.firstOrderOnly,
      usageLimitPerUser: Number(formData.usageLimitPerUser) || 1,
      totalUsageLimit: formData.totalUsageLimit ? Number(formData.totalUsageLimit) : undefined,
    };

    if (editingCoupon) {
      const id = String(editingCoupon._id || (editingCoupon as any).id);
      updateCoupon.mutate(
        { id, data: payload },
        {
          onSuccess: () => setIsModalOpen(false),
        }
      );
    } else {
      createCoupon.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleToggleStatus = (coupon: ICoupon) => {
    const id = String(coupon._id || (coupon as any).id);
    updateCoupon.mutate({
      id,
      data: { isActive: !coupon.isActive },
    });
  };

  const handleDelete = (coupon: ICoupon) => {
    const id = String(coupon._id || (coupon as any).id);
    if (confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
      deleteCoupon.mutate(id);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (expiry: Date | string) => new Date(expiry) < new Date();
  const isUpcoming = (start?: Date | string) => (start ? new Date(start) > new Date() : false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand" />
            Promo Coupons & Discounts
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Create brand-wise, category-wise, first-order promotions with zero-margin-loss guardrails.
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2 bg-brand hover:bg-brand/90 text-white">
          <Plus size={18} />
          <span>Create Coupon</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search coupon code or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>

          {/* Scope Filter */}
          <select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all_scopes">All Scopes</option>
            <option value="all">Storewide</option>
            <option value="brand">Brand Specific</option>
            <option value="category">Category Specific</option>
            <option value="product">Product Specific</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Scope & Targeting</th>
                <th className="py-3.5 px-4">Guardrails & Limits</th>
                <th className="py-3.5 px-4">Redemptions</th>
                <th className="py-3.5 px-4">Validity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Loading coupons...</div>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Tag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No coupons found</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Create Coupon" to launch a new discount campaign.</p>
                  </td>
                </tr>
              ) : (
                data.items.map((coupon) => {
                  const expired = isExpired(coupon.expiryDate);
                  const upcoming = isUpcoming(coupon.startDate);

                  return (
                    <tr key={String(coupon._id || (coupon as any).id)} className="hover:bg-slate-50/60 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200 tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="Copy code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-slate-500 mt-1 max-w-xs truncate">{coupon.description}</p>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {coupon.discountType === "percent" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT`}
                        </div>
                        {coupon.discountType === "percent" && coupon.maxDiscountCap && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            Up to ₹{coupon.maxDiscountCap.toLocaleString("en-IN")}
                          </div>
                        )}
                      </td>

                      {/* Scope */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            coupon.scope === "all"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : coupon.scope === "brand"
                              ? "bg-purple-50 text-purple-700 border border-purple-100"
                              : coupon.scope === "category"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {coupon.scope === "all"
                            ? "Storewide"
                            : coupon.scope === "brand"
                            ? `Brand: ${(coupon.applicableBrands || []).slice(0, 2).join(", ")}${
                                (coupon.applicableBrands || []).length > 2 ? ` +${coupon.applicableBrands!.length - 2}` : ""
                              }`
                            : coupon.scope === "category"
                            ? "Category Specific"
                            : "Product Specific"}
                        </span>
                      </td>

                      {/* Guardrails */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 text-[11px]">
                          {coupon.minPurchase > 0 && (
                            <span className="text-slate-600">
                              Min Spend: <strong className="font-medium text-slate-800">₹{coupon.minPurchase.toLocaleString("en-IN")}</strong>
                            </span>
                          )}
                          {coupon.excludeSaleItems && (
                            <span className="inline-flex items-center text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium w-fit">
                              No Sale Items
                            </span>
                          )}
                          {coupon.firstOrderOnly && (
                            <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium w-fit">
                              1st Order Only
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Redemptions */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {coupon.usageCount || 0}
                          {coupon.totalUsageLimit ? ` / ${coupon.totalUsageLimit}` : " used"}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Limit {coupon.usageLimitPerUser || 1} per customer
                        </div>
                      </td>

                      {/* Validity */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          {expired ? (
                            <span className="inline-flex items-center gap-1 text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded text-[11px]">
                              <XCircle className="w-3 h-3" /> Expired
                            </span>
                          ) : upcoming ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                              <Clock className="w-3 h-3" /> Starts Soon
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          )}
                          <div className="text-[11px] text-slate-500 mt-1">
                            Expires: {new Date(coupon.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            coupon.isActive ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              coupon.isActive ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="Edit Coupon"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(coupon)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page {data.page} of {data.totalPages} ({data.totalCount} total coupons)
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={data.page >= data.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Promo Coupon"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ALPINE10, RIDER500"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold tracking-wider text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Description / Campaign Name
              </label>
              <input
                type="text"
                placeholder="e.g. 10% Off on Helmets"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>

          {/* Section 2: Discount Value & Caps */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand" />
              Discount Settings & Guardrails
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as "percent" | "fixed" })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Discount Value {formData.discountType === "percent" ? "(%)" : "(₹)"}
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              {formData.discountType === "percent" ? (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1500 (No cap if empty)"
                    value={formData.maxDiscountCap}
                    onChange={(e) => setFormData({ ...formData, maxDiscountCap: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Min Spend (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1999"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              )}
            </div>

            {formData.discountType === "percent" && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Minimum Qualifying Order Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 1999"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            )}

            {/* Exclude Sale Items Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.excludeSaleItems}
                  onChange={(e) => setFormData({ ...formData, excludeSaleItems: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded text-brand focus:ring-brand border-slate-300"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Exclude Already Discounted / Special Price Products
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Protect profit margins: Prevents this coupon from double-discounting products that already have a product-level sale price set in Admin.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Scope & Targeting */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase">
              Targeting Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, scope: "all" })}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  formData.scope === "all"
                    ? "border-brand bg-brand/5 text-brand font-bold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Storewide (All Items)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, scope: "brand" })}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  formData.scope === "brand"
                    ? "border-brand bg-brand/5 text-brand font-bold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                By Brand
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, scope: "category" })}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  formData.scope === "category"
                    ? "border-brand bg-brand/5 text-brand font-bold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                By Category
              </button>
            </div>

            {/* Brand Multi-Select / Checkbox */}
            {formData.scope === "brand" && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="text-xs font-medium text-slate-700">Select Applicable Brands:</span>
                <div className="max-h-36 overflow-y-auto grid grid-cols-2 gap-1.5 p-1 bg-white border border-slate-200 rounded">
                  {brands.map((b) => (
                    <label key={b._id || b.name} className="flex items-center gap-2 text-xs text-slate-700 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.applicableBrands.includes(b.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              applicableBrands: [...formData.applicableBrands, b.name],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              applicableBrands: formData.applicableBrands.filter((brand) => brand !== b.name),
                            });
                          }
                        }}
                        className="rounded text-brand focus:ring-brand border-slate-300"
                      />
                      <span className="truncate">{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Category Select */}
            {formData.scope === "category" && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="text-xs font-medium text-slate-700">Select Applicable Categories:</span>
                <div className="max-h-36 overflow-y-auto grid grid-cols-2 gap-1.5 p-1 bg-white border border-slate-200 rounded">
                  {categoryTree.map((cat) => (
                    <label key={cat._id || cat.name} className="flex items-center gap-2 text-xs text-slate-700 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.applicableCategories.includes(cat.slug || cat.name)}
                        onChange={(e) => {
                          const val = cat.slug || cat.name;
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              applicableCategories: [...formData.applicableCategories, val],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              applicableCategories: formData.applicableCategories.filter((c) => c !== val),
                            });
                          }
                        }}
                        className="rounded text-brand focus:ring-brand border-slate-300"
                      />
                      <span className="truncate">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Customer & Usage Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Usage Limit Per Customer
              </label>
              <input
                type="number"
                min="1"
                value={formData.usageLimitPerUser}
                onChange={(e) => setFormData({ ...formData, usageLimitPerUser: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Total Redemptions Limit (Overall)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Unlimited if left empty"
                value={formData.totalUsageLimit}
                onChange={(e) => setFormData({ ...formData, totalUsageLimit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {/* First Order Only Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.firstOrderOnly}
                onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
                className="w-4 h-4 rounded text-brand focus:ring-brand border-slate-300"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800">First-Time Customers Only</span>
                <span className="text-[11px] text-slate-500 block">
                  Valid only on the customer's first completed purchase.
                </span>
              </div>
            </label>
          </div>

          {/* Section 5: Date Range & Active Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Expiry Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-brand focus:ring-brand border-slate-300"
              />
              <span className="text-xs font-bold text-slate-700">Coupon is Active</span>
            </label>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCoupon.isPending || updateCoupon.isPending}
                className="bg-brand hover:bg-brand/90 text-white"
              >
                {createCoupon.isPending || updateCoupon.isPending
                  ? "Saving..."
                  : editingCoupon
                  ? "Update Coupon"
                  : "Create Coupon"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
