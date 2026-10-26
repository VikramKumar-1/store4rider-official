"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatPrice } from "@store4riders/shared-utils";
import Link from "next/link";
import Image from "next/image";
import { 
  Package, 
  Truck, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  ExternalLink
} from "lucide-react";

type FilterTab = "all" | "active" | "delivered" | "cancelled_failed";

export function OrderHistory() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await apiClient.get("/orders/me");
      return res.data;
    }
  });

  const orders: any[] = useMemo(() => data?.data || [], [data]);

  // Status mapping helper
  const getStatusDisplay = (status: string = "") => {
    switch (status.toLowerCase()) {
      case "pending_payment":
        return { 
          text: "Awaiting Payment", 
          color: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <Clock className="w-3 h-3 text-amber-600 shrink-0" />,
          dot: "bg-amber-500",
          category: "active"
        };
      case "processing":
      case "packed":
        return { 
          text: "Processing", 
          color: "bg-blue-50 text-blue-800 border-blue-200",
          icon: <Package className="w-3 h-3 text-blue-600 shrink-0" />,
          dot: "bg-blue-500",
          category: "active"
        };
      case "shipped":
        return { 
          text: "In Transit / Shipped", 
          color: "bg-indigo-50 text-indigo-800 border-indigo-200",
          icon: <Truck className="w-3 h-3 text-indigo-600 shrink-0" />,
          dot: "bg-indigo-500",
          category: "active"
        };
      case "delivered":
        return { 
          text: "Delivered", 
          color: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />,
          dot: "bg-emerald-500",
          category: "delivered"
        };
      case "failed":
        return { 
          text: "Payment Failed", 
          color: "bg-red-50 text-red-800 border-red-200",
          icon: <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />,
          dot: "bg-red-500",
          category: "cancelled_failed"
        };
      case "cancelled":
        return { 
          text: "Cancelled", 
          color: "bg-neutral-100 text-neutral-700 border-neutral-300",
          icon: <XCircle className="w-3 h-3 text-neutral-500 shrink-0" />,
          dot: "bg-neutral-400",
          category: "cancelled_failed"
        };
      case "refunded":
        return { 
          text: "Refunded", 
          color: "bg-purple-50 text-purple-800 border-purple-200",
          icon: <RefreshCw className="w-3 h-3 text-purple-600 shrink-0" />,
          dot: "bg-purple-500",
          category: "cancelled_failed"
        };
      default:
        return { 
          text: status ? status.replace(/_/g, " ").toUpperCase() : "CONFIRMED", 
          color: "bg-neutral-100 text-neutral-800 border-neutral-200",
          icon: <Package className="w-3 h-3 text-neutral-500 shrink-0" />,
          dot: "bg-neutral-400",
          category: "active"
        };
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    if (activeTab === "active") {
      return orders.filter(o => ["pending_payment", "confirmed", "processing", "packed", "shipped"].includes((o.status || "").toLowerCase()));
    }
    if (activeTab === "delivered") {
      return orders.filter(o => (o.status || "").toLowerCase() === "delivered");
    }
    if (activeTab === "cancelled_failed") {
      return orders.filter(o => ["cancelled", "failed", "refunded"].includes((o.status || "").toLowerCase()));
    }
    return orders;
  }, [orders, activeTab]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter(o => ["pending_payment", "confirmed", "processing", "packed", "shipped"].includes((o.status || "").toLowerCase())).length,
      delivered: orders.filter(o => (o.status || "").toLowerCase() === "delivered").length,
      cancelled_failed: orders.filter(o => ["cancelled", "failed", "refunded"].includes((o.status || "").toLowerCase())).length,
    };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 w-full animate-pulse">
        <div className="h-9 w-48 bg-neutral-200 rounded-lg mb-2" />
        <div className="h-10 w-full bg-neutral-100 rounded-lg mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-44 bg-white border border-neutral-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="h-5 w-32 bg-neutral-200 rounded" />
            <div className="h-16 w-full bg-neutral-100 rounded" />
            <div className="h-8 w-24 bg-neutral-200 rounded mt-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center bg-white border border-red-100 rounded-2xl p-6">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-neutral-900 text-base mb-1">Failed to load orders</h3>
        <p className="text-xs text-neutral-500 mb-4">Please check your network connection and try again.</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-brand text-white font-bold text-xs uppercase px-5 py-2.5 rounded-lg hover:bg-red-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full font-sans">
      
      {/* Page Title & Count */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="font-sans font-black text-xl sm:text-2xl lg:text-3xl text-neutral-900 tracking-tight uppercase">
            Order History
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">
            Track, view invoice, and manage your recent orders
          </p>
        </div>
        <span className="text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full border border-neutral-200 shrink-0">
          {orders.length} {orders.length === 1 ? "Order" : "Orders"}
        </span>
      </div>

      {/* Horizontal Filter Tabs (Scrollable on Mobile) */}
      {orders.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-4 -mx-1 px-1">
          {[
            { id: "all", label: "All Orders", count: tabCounts.all },
            { id: "active", label: "In Transit / Active", count: tabCounts.active },
            { id: "delivered", label: "Delivered", count: tabCounts.delivered },
            { id: "cancelled_failed", label: "Cancelled / Failed", count: tabCounts.cancelled_failed },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Zero Orders Global Empty State */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-50 rounded-full flex items-center justify-center shadow-xs mb-4 text-neutral-300 border border-neutral-100">
            <ShoppingBag size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight uppercase mb-1.5">
            No Orders Placed Yet
          </h2>
          <p className="text-neutral-500 max-w-sm mx-auto mb-6 text-xs sm:text-sm leading-relaxed">
            You haven't placed any orders yet. Discover our premium motorcycle helmets, jackets, boots and gear!
          </p>
          <Link href="/">
            <button className="bg-brand hover:bg-red-800 text-white font-bold px-7 py-3 text-xs tracking-wider uppercase transition-all rounded-lg shadow-sm">
              Start Shopping
            </button>
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Tab Filter Empty State */
        <div className="py-12 text-center bg-white border border-neutral-200 rounded-xl p-6">
          <p className="text-neutral-500 text-xs sm:text-sm font-medium mb-3">
            No orders found under "{activeTab.replace("_", " & ").toUpperCase()}"
          </p>
          <button
            onClick={() => setActiveTab("all")}
            className="text-xs font-bold text-brand hover:underline uppercase tracking-wider"
          >
            View All {orders.length} Orders
          </button>
        </div>
      ) : (
        /* Orders List */
        <div className="flex flex-col gap-3.5 sm:gap-4">
          {filteredOrders.map((order) => {
            const statusConfig = getStatusDisplay(order.status);
            const firstItem = order.items?.[0];
            const productImg = firstItem?.image || firstItem?.product?.images?.[0]?.url || firstItem?.product?.image || "/no-image.svg";
            const itemSlug = firstItem?.slug || firstItem?.product?.slug || "";
            const itemName = firstItem?.name || firstItem?.product?.name || "Motorcycle Riding Gear";
            const itemCount = order.items?.length || 1;
            const additionalItemsCount = Math.max(0, itemCount - 1);
            const orderIdStr = order._id || order.id;
            const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            });
            const isOrderPendingOrFailed = ["pending_payment", "failed"].includes((order.status || "").toLowerCase());
            const isShippedOrProcessing = ["shipped", "processing", "packed", "delivered"].includes((order.status || "").toLowerCase());

            return (
              <div 
                key={orderIdStr} 
                className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl overflow-hidden transition-all shadow-2xs hover:shadow-sm flex flex-col"
              >
                
                {/* 1. Card Top Bar: Order Number, Date & Status */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 bg-neutral-50/70 border-b border-neutral-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-neutral-900 tracking-tight">
                      #{order.orderNumber || orderIdStr.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-neutral-400 hidden sm:inline">•</span>
                    <span className="text-[11px] text-neutral-500 font-medium hidden sm:inline">
                      Placed on {formattedDate}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-md border ${statusConfig.color}`}>
                    {statusConfig.icon}
                    <span>{statusConfig.text}</span>
                  </div>
                </div>

                {/* Mobile-Only Date Line */}
                <div className="sm:hidden px-3.5 pt-2 text-[11px] text-neutral-500 font-medium">
                  Placed on {formattedDate}
                </div>

                {/* 2. Card Body: Product Thumbnail & Details */}
                <div className="p-3.5 sm:p-4 flex gap-3 sm:gap-4 items-center">
                  
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-neutral-50 border border-neutral-100 rounded-lg shrink-0 flex items-center justify-center p-1.5 overflow-hidden">
                    <Image 
                      src={productImg} 
                      alt={itemName} 
                      fill 
                      className="object-contain p-1 mix-blend-multiply" 
                      sizes="(max-width: 640px) 64px, 80px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-2 leading-snug mb-1">
                      {itemName}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 flex-wrap">
                      {firstItem?.variantId && (
                        <span>Variant: <strong className="text-neutral-700">{firstItem.variantId}</strong></span>
                      )}
                      <span>Qty: <strong className="text-neutral-700">{firstItem?.quantity || 1}</strong></span>
                      {firstItem?.unitPrice && (
                        <span>• {formatPrice(firstItem.unitPrice)}</span>
                      )}
                    </div>

                    {additionalItemsCount > 0 && (
                      <p className="text-[11px] font-bold text-brand mt-1">
                        + {additionalItemsCount} more {additionalItemsCount === 1 ? "item" : "items"}
                      </p>
                    )}
                  </div>

                  {/* Desktop Right Chevron */}
                  <Link 
                    href={`/account/orders/${orderIdStr}`}
                    className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors shrink-0"
                    aria-label="View order details"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>

                {/* 3. Card Bottom Bar: Total & Mobile-Friendly Action Buttons */}
                <div className="p-3.5 sm:p-4 bg-neutral-50/50 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Total & Payment Mode */}
                  <div className="flex items-baseline justify-between sm:justify-start sm:gap-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">Total:</span>
                      <span className="text-base sm:text-lg font-black text-neutral-900">
                        {formatPrice(order.pricing?.total || order.totalAmount || 0)}
                      </span>
                    </div>

                    {order.paymentMethod && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-200/60 px-2 py-0.5 rounded">
                        {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Actions Group (44px min tap targets on mobile) */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    
                    {/* If failed/pending, show primary Check Status / Retry button */}
                    {isOrderPendingOrFailed ? (
                      <Link href={`/account/orders/${orderIdStr}`} className="flex-1 sm:flex-initial">
                        <button 
                          type="button"
                          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Resolve Payment</span>
                        </button>
                      </Link>
                    ) : isShippedOrProcessing && (
                      <Link href={`/account/orders/${orderIdStr}`} className="flex-1 sm:flex-initial">
                        <button 
                          type="button"
                          className="w-full sm:w-auto border border-neutral-300 hover:border-neutral-900 bg-white text-neutral-800 font-bold text-xs px-3.5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Truck className="w-3.5 h-3.5 text-neutral-600" />
                          <span>Track Order</span>
                        </button>
                      </Link>
                    )}

                    {/* View Details Button */}
                    <Link href={`/account/orders/${orderIdStr}`} className="flex-1 sm:flex-initial">
                      <button 
                        type="button"
                        className="w-full sm:w-auto bg-neutral-900 hover:bg-black text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:hidden" />
                      </button>
                    </Link>

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
