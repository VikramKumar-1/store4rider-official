"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@store4riders/shared-utils";
import { useAdminOrders, useAdminHandleReturn } from "@/core/hooks/useAdminOrders";
import { format } from "date-fns";
import { 
  MagnifyingGlassIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon,
  ArrowPathRoundedSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { OrdersNavTabs } from "./OrdersNavTabs";

export const ExchangeRequestsModule = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("exchanges"); // "exchanges", "return_requested", "return_approved", "return_picked", "returned"
  const [rejectModalOrder, setRejectModalOrder] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleReturnMutation = useAdminHandleReturn();

  const { data, isLoading } = useAdminOrders({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter,
  });

  const orders = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / 20);

  const getExchangeStatusBadge = (status: string) => {
    switch (status) {
      case "return_requested":
        return {
          label: "Pending Review",
          className: "bg-amber-100 text-amber-800 border-amber-200",
        };
      case "return_approved":
        return {
          label: "Exchange Approved",
          className: "bg-purple-100 text-purple-800 border-purple-200",
        };
      case "return_picked":
        return {
          label: "Picked Up by Courier",
          className: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "returned":
        return {
          label: "Exchange Completed",
          className: "bg-emerald-100 text-emerald-800 border-emerald-200",
        };
      default:
        return {
          label: status.replace(/_/g, " "),
          className: "bg-neutral-100 text-neutral-800 border-neutral-200",
        };
    }
  };

  const handleApprove = (order: any) => {
    const orderId = order.id || order._id;
    if (window.confirm(`Approve exchange request for Order #${order.orderNumber}? Our reverse pickup courier will be assigned.`)) {
      handleReturnMutation.mutate({
        orderId,
        action: "approve",
        adminNote: "Approved for size / item exchange by staff.",
      });
    }
  };

  const handleConfirmReject = () => {
    if (!rejectModalOrder) return;
    const orderId = rejectModalOrder.id || rejectModalOrder._id;
    handleReturnMutation.mutate(
      {
        orderId,
        action: "reject",
        adminNote: rejectReason || "Exchange request rejected per store policy guidelines.",
      },
      {
        onSuccess: () => {
          setRejectModalOrder(null);
          setRejectReason("");
        },
      }
    );
  };

  const handleWhatsAppContact = (order: any) => {
    const rawPhone = order.shippingAddress?.phone || "";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const customerName = order.shippingAddress?.fullName || "Rider";
    const orderNum = order.orderNumber || order.id || order._id;

    let msg = `*Store4Riders — Exchange Support*\n\n`;
    msg += `Hello *${customerName}*,\n\n`;
    msg += `We have received your 7-day size/defect exchange request for Order *#${orderNum}*.\n\n`;
    msg += `Our team is reviewing the replacement size availability for you. Would you like us to proceed with dispatching the exchange?\n\n`;
    msg += `Best regards,\nStore4Riders Exchange Team`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 uppercase flex items-center gap-2">
            <span>Customer Exchange Requests</span>
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              {totalCount} Active
            </span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage incoming size replacement and defective gear exchange requests per Store4Riders 7-day exchange policy.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <OrdersNavTabs />

      {/* Policy Reminder Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Strict 7-Day Size & Defect Exchange Policy
            </h2>
            <p className="text-xs text-amber-800 mt-0.5">
              Only unwashed, unused gear with original manufacturer tags & boxes is eligible. No cash refunds are permitted.
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 border border-neutral-200 rounded-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search order #, customer, phone, product..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-brand"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { label: "All Exchanges", value: "exchanges" },
            { label: "Pending Review", value: "return_requested" },
            { label: "Approved", value: "return_approved" },
            { label: "Picked Up", value: "return_picked" },
            { label: "Completed", value: "returned" },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => {
                setStatusFilter(pill.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                statusFilter === pill.value
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Order / Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Item to Exchange</th>
                <th className="px-6 py-4">Reason / Notes</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                      Loading Exchange Requests...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center font-bold">
                        <ArrowPathRoundedSquareIcon className="w-5 h-5" />
                      </div>
                      <div className="text-neutral-900 font-bold">No Exchange Requests Found</div>
                      <p className="text-xs text-neutral-400 max-w-sm text-center">
                        No customer has requested an item exchange under the selected filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => {
                  const customerName = order.shippingAddress?.fullName || "Customer";
                  const customerPhone = order.shippingAddress?.phone || "";
                  const customerEmail = order.customerEmail || order.guestEmail || "";
                  const customerLocation = [order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(", ");
                  const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
                  const badge = getExchangeStatusBadge(order.status);

                  // Extract exchange reason from order notes if present
                  const returnNote = order.notes?.find((n: any) => 
                    typeof n.text === "string" && (n.text.toLowerCase().includes("return") || n.text.toLowerCase().includes("exchange"))
                  );

                  return (
                    <tr key={order.id || order._id} className="hover:bg-neutral-50 transition-colors">
                      {/* Order / Date */}
                      <td className="px-6 py-4">
                        <Link 
                          href={`/admin/orders/${order.id || order._id}`}
                          className="font-mono font-bold text-neutral-900 hover:text-brand transition-colors flex items-center gap-1"
                        >
                          <span>#{order.orderNumber || order.id || order._id}</span>
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-neutral-400" />
                        </Link>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          {format(new Date(order.createdAt), "MMM dd, yyyy")}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {format(new Date(order.createdAt), "hh:mm a")}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900">{customerName}</div>
                        {customerPhone && (
                          <div className="flex items-center gap-1 text-xs text-neutral-600 mt-0.5">
                            <PhoneIcon className="w-3.5 h-3.5 text-neutral-400" />
                            <a href={`tel:${cleanPhone}`} className="hover:text-brand transition-colors font-mono">
                              {customerPhone}
                            </a>
                          </div>
                        )}
                        {customerEmail && (
                          <div className="flex items-center gap-1 text-xs text-neutral-500 mt-0.5">
                            <EnvelopeIcon className="w-3.5 h-3.5 text-neutral-400" />
                            <a href={`mailto:${customerEmail}`} className="hover:text-brand transition-colors">
                              {customerEmail}
                            </a>
                          </div>
                        )}
                        {customerLocation && (
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            📍 {customerLocation}
                          </div>
                        )}
                      </td>

                      {/* Item to Exchange */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5 max-w-xs">
                          {order.items?.map((item: any, idx: number) => {
                            const imgUrl = item.image || "/no-image.svg";
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-neutral-100 border border-neutral-200 rounded shrink-0 relative overflow-hidden">
                                  <Image
                                    src={imgUrl}
                                    alt={item.name || "Product"}
                                    fill
                                    className="object-contain p-0.5"
                                    sizes="36px"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-neutral-900 text-xs truncate max-w-[180px]" title={item.name}>
                                    {item.name}
                                  </div>
                                  <div className="text-[10px] text-neutral-500 font-mono">
                                    Qty: {item.quantity} {item.sku ? `• SKU: ${item.sku}` : ""}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Reason / Notes */}
                      <td className="px-6 py-4">
                        <div className="max-w-xs text-xs text-neutral-700 bg-neutral-50 border border-neutral-200 rounded p-2 text-wrap">
                          {returnNote ? (
                            <span>{returnNote.text}</span>
                          ) : (
                            <span className="italic text-neutral-400">Customer requested 7-day size/defect exchange.</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Review Action */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === "return_requested" && (
                            <>
                              <button
                                type="button"
                                disabled={handleReturnMutation.isPending}
                                onClick={() => handleApprove(order)}
                                title="Approve Exchange"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold uppercase hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                disabled={handleReturnMutation.isPending}
                                onClick={() => setRejectModalOrder(order)}
                                title="Reject Exchange"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold uppercase hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                              >
                                <XCircleIcon className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {customerPhone && (
                            <button
                              type="button"
                              onClick={() => handleWhatsAppContact(order)}
                              title="Message via WhatsApp"
                              className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                            >
                              <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            </button>
                          )}

                          {customerPhone && (
                            <a
                              href={`tel:${cleanPhone}`}
                              title="Call customer"
                              className="p-1.5 border border-neutral-300 rounded hover:bg-neutral-100 text-neutral-700 transition-colors"
                            >
                              <PhoneIcon className="w-4 h-4" />
                            </a>
                          )}
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
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200 flex justify-between items-center text-sm">
            <span className="text-neutral-500 text-xs">
              Page <span className="font-bold text-neutral-900">{page}</span> of{" "}
              <span className="font-bold text-neutral-900">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-neutral-300 rounded text-xs font-bold uppercase disabled:opacity-50 hover:bg-neutral-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-neutral-300 rounded text-xs font-bold uppercase disabled:opacity-50 hover:bg-neutral-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-black text-neutral-900 uppercase text-base flex items-center gap-2">
                <XCircleIcon className="w-5 h-5 text-red-600" />
                <span>Reject Exchange Request</span>
              </h3>
              <button
                onClick={() => setRejectModalOrder(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              You are rejecting the exchange request for Order #
              <span className="font-bold text-neutral-900">
                {rejectModalOrder.orderNumber}
              </span>
              . Please provide a clear explanation for the customer (e.g., tags missing, outside 7-day window, sign of wear).
            </p>

            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Reason for Rejection (Required)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this item cannot be accepted for exchange..."
                className="w-full p-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOrder(null)}
                className="px-4 py-2 border border-neutral-300 rounded text-xs font-bold uppercase text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={handleReturnMutation.isPending || !rejectReason.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-red-600 text-white rounded text-xs font-bold uppercase hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {handleReturnMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
