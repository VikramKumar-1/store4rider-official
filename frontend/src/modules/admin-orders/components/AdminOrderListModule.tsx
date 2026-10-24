"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@store4riders/shared-utils";
import { useAdminOrders } from "@/core/hooks/useAdminOrders";
import { format } from "date-fns";
import { 
  MagnifyingGlassIcon, 
  ArrowTopRightOnSquareIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { OrdersNavTabs } from "./OrdersNavTabs";
import { OrderQuickViewModal } from "./OrderQuickViewModal";

export const AdminOrderListModule = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState(""); // "", "prepaid", "cod"
  const [selectedQuickViewOrder, setSelectedQuickViewOrder] = useState<any | null>(null);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, isFetching } = useAdminOrders({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    paymentMethod: paymentFilter || undefined,
  });

  const orders = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / 20);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "cancelled": case "failed": case "refunded": return "bg-red-100 text-red-800 border-red-200";
      case "shipped": return "bg-blue-100 text-blue-800 border-blue-200";
      case "packed": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "processing": return "bg-amber-100 text-amber-800 border-amber-200";
      case "return_requested": return "bg-orange-100 text-orange-800 border-orange-200";
      case "return_approved": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-neutral-100 text-neutral-800 border-neutral-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "return_requested": return "Exchange Requested";
      case "return_approved": return "Exchange Approved";
      case "return_picked": return "Exchange Picked Up";
      case "returned": return "Exchange Completed";
      default: return status.replace(/_/g, " ");
    }
  };

  const getPaymentStatusDisplay = (order: any) => {
    const status = String(order.status || "").toLowerCase();
    const method = String(order.paymentMethod || "").toLowerCase();
    const isCod = method === "cod";

    if (status === "failed") {
      return {
        label: "FAILED (UNCAPTURED)",
        className: "text-red-700 font-black",
      };
    }
    if (status === "pending_payment") {
      return {
        label: "PENDING / DROPPED",
        className: "text-amber-700 font-bold",
      };
    }
    if (status === "cancelled") {
      return {
        label: "CANCELLED",
        className: "text-neutral-500 font-medium",
      };
    }
    if (isCod) {
      if (status === "delivered") {
        return {
          label: "COLLECTED (COD)",
          className: "text-emerald-700 font-bold",
        };
      }
      const hasAdvance = (order.pricing?.codPartialPaymentAmount || 0) > 0;
      return {
        label: hasAdvance ? "PARTIAL ADVANCE PAID" : "DUE ON DELIVERY",
        className: "text-amber-800 font-bold",
      };
    }
    return {
      label: `PAID (${(order.paymentMethod || "ONLINE").toUpperCase()})`,
      className: "text-emerald-700 font-bold",
    };
  };

  const handleWhatsAppShare = (order: any) => {
    const rawPhone = order.shippingAddress?.phone || "";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const customerName = order.shippingAddress?.fullName || "Rider";
    const orderNum = order.orderNumber || order.id || order._id;
    const total = formatPrice(order.pricing?.total || 0);

    let msg = "";
    if (order.status === "failed" || order.status === "pending_payment") {
      msg = `*Store4Riders — Order Assistance*\n`;
      msg += `Hello *${customerName}*,\n`;
      msg += `We noticed you attempted to place order *#${orderNum}* for ${total}, but payment was not completed at the gateway.\n\n`;
      msg += `Would you like us to assist you with completing the payment? Let us know if you need any help!\n`;
      msg += `— Team Store4Riders`;
    } else {
      msg = `*Store4Riders — Order Update*\n`;
      msg += `Hello *${customerName}*,\n`;
      msg += `Your order *#${orderNum}* for ${total} is currently *${getStatusLabel(order.status).toUpperCase()}*.\n\n`;
      msg += `Thank you for shopping with Store4Riders! Let us know if you need any assistance.`;
    }

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 uppercase flex items-center gap-2">
            <span>Orders Management</span>
            <span className="text-xs bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full font-mono font-bold">
              {totalCount} Total
            </span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage placed customer orders (Prepaid via CCAvenue / PayU / Snapmint & Cash on Delivery)
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <OrdersNavTabs />

      {/* Filters & Search */}
      <div className="bg-white p-4 border border-neutral-200 rounded-lg flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search order #, customer, phone..."
            className="w-full pl-10 pr-8 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-brand"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Payment Mode Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { label: "All Payments", value: "" },
            { label: "Prepaid (Paid)", value: "prepaid" },
            { label: "Cash on Delivery (COD)", value: "cod" },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => {
                setPaymentFilter(pill.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                paymentFilter === pill.value
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
        
        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-auto px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-brand font-bold uppercase text-neutral-700 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing (New)</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm min-h-[580px] flex flex-col justify-between">
        <div className={`overflow-x-auto transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}>
          <table className="w-full text-left text-sm table-fixed">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="px-4 py-3.5 w-[18%]">Order ID</th>
                <th className="px-4 py-3.5 w-[12%]">Date</th>
                <th className="px-4 py-3.5 w-[25%]">Customer</th>
                <th className="px-4 py-3.5 w-[17%]">Payment</th>
                <th className="px-4 py-3.5 w-[10%]">Total</th>
                <th className="px-4 py-3.5 w-[10%]">Status</th>
                <th className="px-4 py-3.5 w-[8%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading && orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                      Loading Orders...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500 font-medium">
                    {debouncedSearch ? (
                      <div className="flex flex-col items-center gap-2">
                        <span>No orders found matching &ldquo;{debouncedSearch}&rdquo;.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setPage(1);
                          }}
                          className="text-xs font-bold text-brand hover:underline"
                        >
                          Clear search
                        </button>
                      </div>
                    ) : (
                      "No placed orders found matching your criteria."
                    )}
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => {
                  const customerPhone = order.shippingAddress?.phone || "";
                  const cleanPhone = customerPhone.replace(/[^0-9]/g, "");

                  return (
                    <tr key={order.id || order._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-neutral-900 truncate">
                        <div className="flex items-center gap-1.5">
                          <button 
                            type="button"
                            onClick={() => setSelectedQuickViewOrder(order)}
                            className="hover:text-brand transition-colors font-bold text-left truncate"
                            title="Click to Quick View Order"
                          >
                            <span className="truncate">#{order.orderNumber || order.id || order._id}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const num = order.orderNumber || order.id || order._id;
                              if (num) {
                                navigator.clipboard.writeText(String(num));
                                toast.success(`Order #${num} copied!`);
                              }
                            }}
                            className="text-neutral-400 hover:text-neutral-800 p-0.5 rounded transition-colors shrink-0"
                            title="Copy order number"
                          >
                            <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-neutral-600">
                        <div className="text-xs font-medium text-neutral-900">
                          {format(new Date(order.createdAt), "MMM dd, yyyy")}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {format(new Date(order.createdAt), "hh:mm a")}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-neutral-900 truncate">{order.shippingAddress?.fullName}</div>
                        {(order.shippingAddress?.addressLine1 || order.shippingAddress?.street) && (
                          <div 
                            className="text-xs text-neutral-700 truncate font-medium max-w-[200px]"
                            title={[order.shippingAddress?.addressLine1 || order.shippingAddress?.street, order.shippingAddress?.addressLine2, order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.pincode].filter(Boolean).join(", ")}
                          >
                            {[order.shippingAddress?.addressLine1 || order.shippingAddress?.street, order.shippingAddress?.addressLine2].filter(Boolean).join(", ")}
                          </div>
                        )}
                        <div 
                          className="text-xs text-neutral-500 truncate max-w-[200px]"
                          title={[order.shippingAddress?.addressLine1 || order.shippingAddress?.street, order.shippingAddress?.addressLine2, order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.pincode].filter(Boolean).join(", ")}
                        >
                          {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode ? `(${order.shippingAddress.pincode})` : ""}
                        </div>
                        {customerPhone && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-neutral-500 font-mono">{customerPhone}</span>
                            <button
                              type="button"
                              onClick={() => handleWhatsAppShare(order)}
                              title="Update customer via WhatsApp"
                              className="text-emerald-600 hover:text-emerald-700 p-0.5"
                            >
                              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`tel:${cleanPhone}`}
                              title="Call customer"
                              className="text-neutral-500 hover:text-neutral-800 p-0.5"
                            >
                              <PhoneIcon className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-900 uppercase text-xs">
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Prepaid'}
                          </span>
                          {(() => {
                            const paymentInfo = getPaymentStatusDisplay(order);
                            return (
                              <span className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 ${paymentInfo.className}`}>
                                {paymentInfo.label}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-neutral-900 font-mono">
                        {formatPrice(order.pricing?.total || 0)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase border whitespace-nowrap ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedQuickViewOrder(order)}
                          className="px-3.5 py-1.5 bg-neutral-900 text-white rounded text-xs font-bold uppercase hover:bg-brand transition-colors shadow-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200 flex justify-between items-center text-sm">
            <span className="text-neutral-500 text-xs">
              Page <span className="font-bold text-neutral-900">{page}</span> of <span className="font-bold text-neutral-900">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 border border-neutral-300 rounded text-xs font-bold uppercase disabled:opacity-50 hover:bg-neutral-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-neutral-300 rounded text-xs font-bold uppercase disabled:opacity-50 hover:bg-neutral-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {selectedQuickViewOrder && (
        <OrderQuickViewModal
          order={selectedQuickViewOrder}
          onClose={() => setSelectedQuickViewOrder(null)}
        />
      )}
    </div>
  );
};
