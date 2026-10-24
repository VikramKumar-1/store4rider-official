"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { formatPrice } from "@store4riders/shared-utils";
import { 
  MagnifyingGlassIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ShoppingBagIcon, 
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  TruckIcon,
  TagIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon,
  UserIcon,
  InboxStackIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  CreditCardIcon,
  BanknotesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAdminContactIssues, useAdminContactStats } from "@/core/hooks/useContactIssues";
import { useAdminOrders, useAdminOrderSuggest } from "@/core/hooks/useAdminOrders";
import { IContactIssue } from "@store4riders/shared-types";
import { CustomerCareOrderModal } from "./CustomerCareOrderModal";
import { ContactIssueDetailModal } from "./ContactIssueDetailModal";
import { OrderItemGalleryModal } from "@/modules/admin-orders/components/OrderItemGalleryModal";
import { AdminOrderDetailModule } from "@/modules/admin-orders/components/AdminOrderDetailModule";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import { apiClient } from "@/core/api/client";

export function AdminCustomerCareDashboard() {
  const { user } = useAuthStore();

  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");

  // Primary Tab Switcher: "inquiries" (Contact Us issues) vs "orders" (Live order search & details)
  const [mainTab, setMainTab] = useState<"inquiries" | "orders">(
    tabParam === "orders" ? "orders" : "inquiries"
  );

  useEffect(() => {
    if (tabParam === "orders") {
      setMainTab("orders");
    } else if (tabParam === "inquiries" || !tabParam) {
      setMainTab("inquiries");
    }
  }, [tabParam]);

  const handleTabChange = (newTab: "inquiries" | "orders") => {
    setMainTab(newTab);
    router.replace(`/admin?tab=${newTab}`, { scroll: false });
  };

  // Contact Us Issues State
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketStatus, setTicketStatus] = useState<string>("all");
  const [ticketCategory, setTicketCategory] = useState<string>("all");
  const [ticketSearch, setTicketSearch] = useState<string>("");
  const [selectedIssue, setSelectedIssue] = useState<IContactIssue | null>(null);

  // Advanced Order Search & Lookup State
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [showSuggestDropdown, setShowSuggestDropdown] = useState<boolean>(false);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>("all");
  const [orderPage, setOrderPage] = useState<number>(1);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<any | null>(null);
  const [fullFileOrderId, setFullFileOrderId] = useState<string | null>(null);
  const [isSearchingOrder, setIsSearchingOrder] = useState<boolean>(false);

  // Debounce orderSearchQuery for table search so DB isn't overloaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(orderSearchQuery.trim());
      setOrderPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [orderSearchQuery]);

  // Click outside to close auto-suggest dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Queries
  const { data: stats, isLoading: statsLoading } = useAdminContactStats();
  const { data: issuesData, isLoading: issuesLoading, refetch: refetchIssues } = useAdminContactIssues({
    page: ticketPage,
    limit: 15,
    status: ticketStatus !== "all" ? ticketStatus : undefined,
    category: ticketCategory !== "all" ? ticketCategory : undefined,
    search: ticketSearch.trim() || undefined,
  });

  // Fast Auto-Suggest query (cached, minimal payload, limit 6)
  const { data: suggestions = [], isLoading: suggestLoading } = useAdminOrderSuggest(orderSearchQuery);

  // Paginated Table Orders query (debounced)
  const { data: searchOrdersData, isLoading: ordersLoading, refetch: refetchOrders } = useAdminOrders({
    page: orderPage,
    limit: 12,
    search: debouncedSearch || undefined,
    status: orderStatusFilter !== "all" ? orderStatusFilter : undefined,
    paymentMethod: orderPaymentFilter !== "all" ? orderPaymentFilter : undefined,
  });

  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleInspectOrderByNumber = async (orderNumber: string) => {
    try {
      setIsSearchingOrder(true);
      const clean = orderNumber.replace(/^#/, "").trim();
      const res = await apiClient.get("/orders/admin", {
        params: { search: clean, limit: 1 },
      });
      const items = res.data?.data?.items || [];
      if (items.length > 0) {
        setSelectedOrder(items[0]);
      } else {
        toast.error(`Order #${clean} could not be found`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error looking up order");
    } finally {
      setIsSearchingOrder(false);
    }
  };

  const handleApplyPreset = (status: string, payment: string = "all") => {
    setOrderStatusFilter(status);
    setOrderPaymentFilter(payment);
    setOrderPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions && suggestions.length > 0) {
        setShowSuggestDropdown(true);
        setActiveSuggestIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions && suggestions.length > 0) {
        setShowSuggestDropdown(true);
        setActiveSuggestIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestDropdown && activeSuggestIndex >= 0 && suggestions[activeSuggestIndex]) {
        setSelectedOrder(suggestions[activeSuggestIndex]);
        setShowSuggestDropdown(false);
      } else {
        setDebouncedSearch(orderSearchQuery.trim());
        setOrderPage(1);
        setShowSuggestDropdown(false);
      }
    } else if (e.key === "Escape") {
      setShowSuggestDropdown(false);
    }
  };

  const handleOpenWhatsApp = (e: React.MouseEvent, order: any) => {
    e.stopPropagation();
    const phone = order.shippingAddress?.phone || order.customer?.phone || "";
    if (!phone) {
      toast.error("Phone number not provided");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const name = order.shippingAddress?.fullName || order.customer?.fullName || "Customer";
    const orderNum = order.orderNumber || order.id || order._id;
    const msg = `Hello ${name}, this is Store4Riders Customer Care regarding your Order #${orderNum}. How can we assist you today?`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "order_issue":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Order Issue</span>;
      case "payment_issue":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Payment Issue</span>;
      case "return_exchange":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Return &amp; Exchange</span>;
      case "product_sizing":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Sizing / Fitment</span>;
      case "shipping_delay":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Shipping Delay</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">General</span>;
    }
  };

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Open</span>;
      case "in_progress":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">In Progress</span>;
      case "resolved":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Resolved</span>;
      case "closed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Closed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getOrderStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "shipped": return "bg-blue-100 text-blue-800 border-blue-200";
      case "packed": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "processing": case "confirmed": return "bg-amber-100 text-amber-800 border-amber-200";
      case "cancelled": case "failed": return "bg-rose-100 text-rose-800 border-rose-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header — Professional Enterprise Console */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Customer Support
            </span>
            <span className="text-xs text-slate-400">
              Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Customer Care &amp; Inquiries
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Resolve incoming Contact Us inquiries, inspect customer orders, and track carrier fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => {
              refetchIssues();
              refetchOrders();
              toast.success("Workspace updated with live data");
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors"
          >
            <ArrowPathIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh Workspace</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex items-center gap-6" aria-label="Tabs">
          <button
            onClick={() => handleTabChange("inquiries")}
            className={`flex items-center gap-2.5 pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all relative ${
              mainTab === "inquiries"
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>Contact Inquiries</span>
            {stats?.open !== undefined && stats.open > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                mainTab === "inquiries" 
                  ? "bg-brand/10 text-brand" 
                  : "bg-amber-100 text-amber-800"
              }`}>
                {stats.open} Open
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("orders")}
            className={`flex items-center gap-2.5 pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all relative ${
              mainTab === "orders"
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            <span>Order Search &amp; Tracking</span>
            {searchOrdersData?.totalCount !== undefined && searchOrdersData.totalCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                mainTab === "orders" 
                  ? "bg-brand/10 text-brand" 
                  : "bg-slate-100 text-slate-600"
              }`}>
                {searchOrdersData.totalCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* TAB 1: CONTACT US ISSUES */}
      {mainTab === "inquiries" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Inquiries</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {statsLoading ? "..." : (stats?.total || 0)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Open Tickets</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black text-amber-900">
                  {statsLoading ? "..." : (stats?.open || 0)}
                </span>
                {(stats?.open || 0) > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Needs Action
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">In Progress</span>
              <span className="text-2xl font-black text-blue-900 mt-1 block">
                {statsLoading ? "..." : (stats?.inProgress || 0)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Resolved</span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">
                {statsLoading ? "..." : (stats?.resolved || 0)}
              </span>
            </div>
          </div>

          {/* Ticket Filters & Search */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user name, email, phone, subject, or order #..."
                  value={ticketSearch}
                  onChange={(e) => {
                    setTicketSearch(e.target.value);
                    setTicketPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={ticketStatus}
                  onChange={(e) => {
                    setTicketStatus(e.target.value);
                    setTicketPage(1);
                  }}
                  className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={ticketCategory}
                  onChange={(e) => {
                    setTicketCategory(e.target.value);
                    setTicketPage(1);
                  }}
                  className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand font-medium"
                >
                  <option value="all">All Categories</option>
                  <option value="order_issue">Order Issue</option>
                  <option value="payment_issue">Payment Issue</option>
                  <option value="return_exchange">Return &amp; Exchange</option>
                  <option value="product_sizing">Sizing / Fitment</option>
                  <option value="shipping_delay">Shipping Delay</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ticket Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              {issuesLoading ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Loading user tickets...</span>
                </div>
              ) : issuesData?.items?.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  <InboxStackIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No Contact Us inquiries found</p>
                  <p className="text-slate-400 mt-1">There are no user inquiries matching the selected filters.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Subject &amp; Message</th>
                      <th className="px-5 py-3">Related Order</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {issuesData?.items?.map((issue) => (
                      <tr 
                        key={issue.id || (issue as any)._id}
                        onClick={() => setSelectedIssue(issue)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block">{issue.name}</span>
                          <span className="text-[11px] text-slate-500 block">{issue.phone}</span>
                          <span className="text-[10px] text-slate-400 block">{issue.email}</span>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {getCategoryBadge(issue.category)}
                        </td>

                        <td className="px-5 py-3.5 max-w-xs sm:max-w-md">
                          <span className="font-bold text-slate-900 block line-clamp-1">{issue.subject}</span>
                          <p className="text-slate-500 line-clamp-2 mt-0.5 text-[11px] leading-relaxed">
                            {issue.message}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {issue.createdAt ? format(new Date(issue.createdAt), "dd MMM yyyy, hh:mm a") : ""}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {issue.orderNumber ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInspectOrderByNumber(issue.orderNumber!);
                              }}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                            >
                              <span>#{issue.orderNumber}</span>
                              <EyeIcon className="w-3 h-3 text-brand" />
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {getTicketStatusBadge(issue.status)}
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIssue(issue);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
                          >
                            Inspect Ticket
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Tickets Pagination */}
            {issuesData && issuesData.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Showing page <strong>{issuesData.page}</strong> of <strong>{issuesData.totalPages}</strong> ({issuesData.totalCount} total inquiries)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={ticketPage <= 1}
                    onClick={() => setTicketPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 font-bold"
                  >
                    Previous
                  </button>
                  <button
                    disabled={ticketPage >= issuesData.totalPages}
                    onClick={() => setTicketPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 font-bold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ADVANCED ORDER SEARCH & CUSTOMER LOOKUP */}
      {mainTab === "orders" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Header & Search Controls */}
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingBagIcon className="w-5 h-5 text-brand" />
                    <span>Customer Order Search &amp; Verification</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Look up orders by customer phone, email, order ID, AWB tracking, or product SKU.
                  </p>
                </div>

                {/* Filter Dropdowns for fine-grained control */}
                <div className="flex items-center gap-2">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => {
                      setOrderStatusFilter(e.target.value);
                      setOrderPage(1);
                    }}
                    className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand font-medium text-slate-700 shadow-2xs"
                  >
                    <option value="all">All Order Statuses</option>
                    <option value="all_orders">Active / Placed Orders</option>
                    <option value="shipped">Shipped &amp; In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed / Dropped Checkouts</option>
                    <option value="exchanges">Returns &amp; Exchanges</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <select
                    value={orderPaymentFilter}
                    onChange={(e) => {
                      setOrderPaymentFilter(e.target.value);
                      setOrderPage(1);
                    }}
                    className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand font-medium text-slate-700 shadow-2xs"
                  >
                    <option value="all">All Payments</option>
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="prepaid">Prepaid (Paid Online)</option>
                  </select>
                </div>
              </div>

              {/* Omnisearch Input Bar with Fast Auto-Suggest */}
              <div className="relative" ref={searchContainerRef}>
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Omnisearch: Order # (e.g. 10023, OD-S4R), Phone, Customer Name, Email, AWB, or SKU..."
                  value={orderSearchQuery}
                  onFocus={() => {
                    if (orderSearchQuery.trim().length >= 2) setShowSuggestDropdown(true);
                  }}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => {
                    setOrderSearchQuery(e.target.value);
                    if (e.target.value.trim().length >= 2) {
                      setShowSuggestDropdown(true);
                      setActiveSuggestIndex(-1);
                    } else {
                      setShowSuggestDropdown(false);
                    }
                  }}
                  className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand shadow-2xs placeholder:text-slate-400 font-medium"
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => {
                      setOrderSearchQuery("");
                      setDebouncedSearch("");
                      setShowSuggestDropdown(false);
                      setOrderPage(1);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100"
                  >
                    Clear
                  </button>
                )}

                {/* Fast Auto-Suggest Dropdown */}
                {showSuggestDropdown && orderSearchQuery.trim().length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-150">
                    <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Live Auto-Suggestions</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {suggestLoading ? "Searching..." : `${suggestions.length} found • Press Enter for full list`}
                      </span>
                    </div>

                    {suggestLoading ? (
                      <div className="p-5 text-center text-xs text-slate-400 flex items-center justify-center gap-2 font-medium">
                        <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        <span>Searching matching orders...</span>
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        <p className="font-semibold text-slate-700">No instant match for &quot;{orderSearchQuery}&quot;</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Press Enter to run comprehensive database scan</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {suggestions.map((sug: any, sIdx: number) => {
                          const sugNum = sug.orderNumber || sug.id || sug._id;
                          const sugCustomer = sug.shippingAddress?.fullName || sug.guestEmail || "Customer";
                          const sugPhone = sug.shippingAddress?.phone || "";
                          const sugCity = sug.shippingAddress?.city || "";
                          const sugTotal = sug.pricing?.total ?? sug.totalAmount ?? 0;
                          const isCod = String(sug.paymentMethod || "").toLowerCase() === "cod";
                          const isHighlighted = sIdx === activeSuggestIndex;

                          return (
                            <button
                              key={sug._id || sIdx}
                              type="button"
                              onClick={() => {
                                setSelectedOrder(sug);
                                setShowSuggestDropdown(false);
                              }}
                              className={`w-full text-left p-3 flex items-center justify-between gap-3 transition-colors ${
                                isHighlighted ? "bg-slate-100" : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                                  <ShoppingBagIcon className="w-4 h-4 text-slate-500" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-900 text-xs">
                                      #{sugNum}
                                    </span>
                                    <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase border ${getOrderStatusBadge(sug.status)}`}>
                                      {sug.status?.replace(/_/g, " ")}
                                    </span>
                                    {isCod ? (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                        COD
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Paid
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                    <span className="font-medium text-slate-700">{sugCustomer}</span>
                                    {sugPhone && <span> • {sugPhone}</span>}
                                    {sugCity && <span> ({sugCity})</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-black text-slate-900 text-xs block">
                                  {formatPrice(sugTotal)}
                                </span>
                                <span className="text-[10px] text-brand font-semibold hover:underline">
                                  Quick Inspect →
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setDebouncedSearch(orderSearchQuery.trim());
                          setOrderPage(1);
                          setShowSuggestDropdown(false);
                        }}
                        className="text-xs font-bold text-brand hover:underline"
                      >
                        Press Enter or click here to filter full table ({searchOrdersData?.totalCount || 0} results) →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Preset Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Quick Filters:</span>
                {[
                  { label: "All Orders", status: "all", payment: "all" },
                  { label: "Failed Checkouts", status: "failed", payment: "all", dot: "bg-rose-500" },
                  { label: "COD Orders", status: "all", payment: "cod", dot: "bg-amber-500" },
                  { label: "Paid Online", status: "all_orders", payment: "prepaid", dot: "bg-emerald-500" },
                  { label: "Shipped & In Transit", status: "shipped", payment: "all", dot: "bg-blue-500" },
                  { label: "Delivered", status: "delivered", payment: "all", dot: "bg-teal-500" },
                  { label: "Exchanges", status: "exchanges", payment: "all", dot: "bg-purple-500" },
                  { label: "Cancelled", status: "cancelled", payment: "all", dot: "bg-slate-400" },
                ].map((chip) => {
                  const isSelected = orderStatusFilter === chip.status && orderPaymentFilter === chip.payment;
                  return (
                    <button
                      key={chip.label}
                      onClick={() => handleApplyPreset(chip.status, chip.payment)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {chip.dot && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : chip.dot}`} />
                      )}
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order Results List */}
            <div className="overflow-x-auto">
              {ordersLoading ? (
                <div className="p-12 text-center text-xs text-slate-400 font-medium">
                  <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <span>Searching and verifying orders across system...</span>
                </div>
              ) : searchOrdersData?.items?.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  <ShoppingBagIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">
                    {orderSearchQuery ? `No orders found matching "${orderSearchQuery}"` : "No orders found in this filter view"}
                  </p>
                  <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                    Check if the customer provided the correct phone number (with or without 91), order ID (e.g. #10025), or email.
                  </p>
                  {(orderSearchQuery || orderStatusFilter !== "all" || orderPaymentFilter !== "all") && (
                    <button
                      onClick={() => {
                        setOrderSearchQuery("");
                        setDebouncedSearch("");
                        setShowSuggestDropdown(false);
                        setOrderStatusFilter("all");
                        setOrderPaymentFilter("all");
                        setOrderPage(1);
                      }}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Order # &amp; Date</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Items</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Payment &amp; Settlement</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {searchOrdersData?.items?.map((order: any) => {
                      const orderNum = order.orderNumber || order.id || order._id;
                      const customerName = order.shippingAddress?.fullName || order.customer?.fullName || [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" ") || order.customer?.name || "Guest Customer";
                      const phone = order.shippingAddress?.phone || order.customer?.phone || "";
                      const email = order.customerEmail || order.guestEmail || order.customer?.email || "";
                      const total = order.pricing?.total ?? order.totalAmount ?? order.total ?? 0;
                      const isCod = String(order.paymentMethod || "").toLowerCase() === "cod";
                      const isFailed = order.status === "failed";
                      const isPending = order.status === "pending_payment";
                      const isDelivered = order.status === "delivered";

                      let paymentPill = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Paid Online ({order.paymentMethod || "Prepaid"})
                        </span>
                      );

                      if (isCod) {
                        if (isDelivered) {
                          paymentPill = (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              COD Collected
                            </span>
                          );
                        } else {
                          paymentPill = (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              COD Due: {formatPrice(total)}
                            </span>
                          );
                        }
                      } else if (isFailed || isPending) {
                        paymentPill = (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Payment Incomplete / Dropped
                          </span>
                        );
                      }

                      return (
                        <tr 
                          key={order.id || order._id} 
                          onClick={() => setSelectedOrder(order)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          {/* Order # and Date */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <span>#{orderNum}</span>
                              <button
                                onClick={(e) => handleCopy(e, orderNum, "Order #")}
                                className="text-slate-400 hover:text-slate-600"
                                title="Copy Order #"
                              >
                                <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a") : ""}
                            </span>
                          </td>

                          {/* Customer Info & 1-click Contact */}
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-900 block">{customerName}</span>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                              {phone && (
                                <span className="font-mono">{phone}</span>
                              )}
                              {email && <span className="text-slate-400">• {email}</span>}
                            </div>
                          </td>

                          {/* Ordered Products Preview (Images + Names + Quantities) */}
                          <td className="px-5 py-3.5 max-w-xs">
                            {order.items && order.items.length > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-2 overflow-hidden shrink-0">
                                  {order.items.slice(0, 3).map((it: any, iIdx: number) => {
                                    const itImg = it.image || it.imageUrl || it.thumbnail;
                                    return (
                                      <button 
                                        key={iIdx}
                                        type="button"
                                        onClick={() => setSelectedGalleryItem(it)}
                                        className="relative w-8 h-8 rounded-lg bg-slate-100 border border-white shadow-2xs overflow-hidden shrink-0 hover:z-10 hover:scale-110 transition-transform cursor-pointer"
                                        title={`Click to view ${it.name || "Product"} photos & specs`}
                                      >
                                        {itImg ? (
                                          <Image src={itImg} alt={it.name || "Item"} fill unoptimized className="object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                            {it.quantity}
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedGalleryItem(order.items[0])}
                                    className="font-bold text-slate-800 hover:text-brand transition-colors line-clamp-1 text-[11px] text-left cursor-pointer"
                                    title="Click to view product details & description"
                                  >
                                    {order.items[0]?.name || "Product"}
                                  </button>
                                  <span className="text-[10px] text-slate-400 block">
                                    {order.items.length} item{order.items.length > 1 ? "s" : ""} (Total qty: {order.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0)})
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">No items listed</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getOrderStatusBadge(order.status)}`}>
                              {order.status.replace(/_/g, " ")}
                            </span>
                          </td>

                          {/* Financials & Paisa Status */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-black text-slate-900 text-sm block">
                              {formatPrice(total)}
                            </span>
                            <div className="mt-1">{paymentPill}</div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {phone && (
                                <button
                                  onClick={(e) => handleOpenWhatsApp(e, order)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                  title="WhatsApp Customer"
                                >
                                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                              >
                                <EyeIcon className="w-3.5 h-3.5" />
                                <span>Assist</span>
                              </button>
                              <button
                                onClick={() => setFullFileOrderId(order._id || order.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                                title="Open Full Administrative Order File in modal"
                              >
                                <ClipboardDocumentIcon className="w-3.5 h-3.5 text-slate-500" />
                                <span className="hidden xl:inline">Full File</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Orders Pagination */}
            {searchOrdersData && searchOrdersData.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Showing page <strong>{searchOrdersData.page}</strong> of <strong>{searchOrdersData.totalPages}</strong> ({searchOrdersData.totalCount} orders found)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={orderPage <= 1}
                    onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 font-bold transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={orderPage >= searchOrdersData.totalPages}
                    onClick={() => setOrderPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 font-bold transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Care Order Details Modal */}
      {selectedOrder && (
        <CustomerCareOrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Contact Issue Detail Modal */}
      {selectedIssue && (
        <ContactIssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onOpenOrder={(orderNum) => {
            setSelectedIssue(null);
            handleInspectOrderByNumber(orderNum);
          }}
        />
      )}

      {/* Product Description, Images & Specs Inspection Modal */}
      {selectedGalleryItem && (
        <OrderItemGalleryModal
          item={selectedGalleryItem}
          onClose={() => setSelectedGalleryItem(null)}
        />
      )}

      {/* Direct Full Order File Dossier Modal */}
      {fullFileOrderId && (
        <AdminOrderDetailModule
          orderId={fullFileOrderId}
          isModal={true}
          onClose={() => setFullFileOrderId(null)}
        />
      )}
    </div>
  );
}
