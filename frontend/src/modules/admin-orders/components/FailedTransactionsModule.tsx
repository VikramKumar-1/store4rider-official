"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@store4riders/shared-utils";
import { useAdminOrders } from "@/core/hooks/useAdminOrders";
import { format } from "date-fns";
import { 
  MagnifyingGlassIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";
import { OrdersNavTabs } from "./OrdersNavTabs";

export const FailedTransactionsModule = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAdminOrders({
    page,
    limit: 20,
    search: search || undefined,
    status: "failed", // Specifically queries failed + pending_payment abandoned checkouts
  });

  const orders = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / 20) || 1;

  // Compute summary metrics for failed pipeline
  const totalAttemptedValue = orders.reduce((sum: number, o: any) => sum + (o.pricing?.total || 0), 0);

  const getFormattedFailureReason = (reason?: string, status?: string) => {
    const r = (reason || "").toLowerCase();
    if (status === "pending_payment" || r.includes("expired") || r.includes("abandoned") || r.includes("window")) {
      return "Session Expired";
    }
    if (r.includes("cancelled") || r.includes("canceled") || r.includes("user")) {
      return "Cancelled by User";
    }
    if (r.includes("decline") || r.includes("declined") || r.includes("rejected")) {
      return "Card / UPI Declined";
    }
    if (r.includes("insufficient") || r.includes("funds")) {
      return "Insufficient Funds";
    }
    if (r.includes("timeout") || r.includes("timed out")) {
      return "Gateway Timeout";
    }
    if (!reason) {
      return "Payment Incomplete";
    }
    return reason.length > 25 ? `${reason.substring(0, 25)}...` : reason;
  };

  const handleWhatsAppRecovery = (order: any) => {
    const rawPhone = order.shippingAddress?.phone || "";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const customerName = order.shippingAddress?.fullName || "Rider";
    const orderNum = order.orderNumber || order.id || order._id;
    const itemsList = order.items?.map((i: any) => i.name).slice(0, 2).join(", ") || "Riding Gear";
    const amountStr = formatPrice(order.pricing?.total || 0);

    let msg = `*Store4Riders — Order Assistance*\n\n`;
    msg += `Hello *${customerName}*,\n\n`;
    msg += `We noticed that your payment of *${amountStr}* for *${itemsList}* (Order #${orderNum}) could not be completed on Store4Riders.\n\n`;
    msg += `If you faced any issue with the payment gateway, UPI, or card, our team is happy to assist you in completing your order or providing an alternative checkout link.\n\n`;
    msg += `Please reply to this message if you'd like us to help reserve your gear!\n\n`;
    msg += `Best regards,\nStore4Riders Customer Support`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase flex items-center gap-2">
            <span>Failed Transactions &amp; Drop-Offs</span>
            <span className="text-xs bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-mono font-bold">
              {totalCount} Total
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track uncaptured gateway attempts and abandoned checkouts to reach out and recover lost sales.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <OrdersNavTabs />

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Failed / Drop-Offs</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{totalCount} Attempt(s)</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <ClockIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attempted Cart Value (Page)</div>
            <div className="text-xl font-black text-amber-700 font-mono mt-0.5">{formatPrice(totalAttemptedValue)}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Direct Recovery</div>
            <div className="text-xs text-slate-600 mt-0.5">1-Click WhatsApp follow-up with customer</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer, phone, email, order #..."
            className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-brand"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900">{orders.length}</span> of <span className="font-bold text-slate-900">{totalCount}</span> attempts
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto text-xs text-slate-700">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-2.5 px-3 w-[22%]">Customer Details</th>
                <th className="py-2.5 px-3 w-[20%]">Product(s) Attempted</th>
                <th className="py-2.5 px-3 w-[14%]">Attempted Amount</th>
                <th className="py-2.5 px-3 w-[14%]">Gateway &amp; Time</th>
                <th className="py-2.5 px-3 w-[18%]">Failure Reason</th>
                <th className="py-2.5 px-3 w-[12%] text-right">Recovery Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-semibold">
                    <div className="w-6 h-6 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading Failed Transactions...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mx-auto mb-2">
                      ✓
                    </div>
                    <div className="text-slate-900 font-bold text-sm">No Failed Transactions Found</div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
                      All checkouts are converting smoothly or match your filter criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => {
                  const customerName = order.shippingAddress?.fullName || "Guest Customer";
                  const customerPhone = order.shippingAddress?.phone || "";
                  const customerEmail = order.customerEmail || order.guestEmail || "";
                  const customerLocation = [order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(", ");
                  const cleanPhone = customerPhone.replace(/[^0-9]/g, "");

                  const fullFailureReason = order.failureReason || (
                    order.status === "pending_payment" 
                      ? "Checkout window expired / abandoned before payment completion" 
                      : "Transaction declined or cancelled by customer at payment gateway"
                  );

                  return (
                    <tr key={order.id || order._id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Customer Info */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="flex flex-col gap-0.5 max-w-[210px]">
                          <div className="font-bold text-slate-900 text-xs truncate">{customerName}</div>
                          {customerPhone && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-600">
                              <PhoneIcon className="w-3 h-3 text-slate-400 shrink-0" />
                              <a href={`tel:${cleanPhone}`} className="hover:text-brand transition-colors font-mono">
                                {customerPhone}
                              </a>
                            </div>
                          )}
                          {customerEmail && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate" title={customerEmail}>
                              <EnvelopeIcon className="w-3 h-3 text-slate-400 shrink-0" />
                              <a href={`mailto:${customerEmail}`} className="hover:text-brand transition-colors truncate">
                                {customerEmail}
                              </a>
                            </div>
                          )}
                          {customerLocation && (
                            <div className="text-[10px] text-slate-400 truncate">
                              📍 {customerLocation}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Products Attempted */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="space-y-1.5 max-w-[190px]">
                          {order.items?.slice(0, 2).map((item: any, idx: number) => {
                            const imgUrl = item.image || "/no-image.svg";
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-slate-100 border border-slate-200 rounded shrink-0 relative overflow-hidden">
                                  <Image
                                    src={imgUrl}
                                    alt={item.name || "Product"}
                                    fill
                                    className="object-contain p-0.5"
                                    sizes="28px"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900 text-xs truncate max-w-[150px]" title={item.name}>
                                    {item.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    Qty: {item.quantity} {item.sku ? `• ${item.sku}` : ""}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {order.items && order.items.length > 2 && (
                            <span className="text-[10px] font-bold text-slate-500">
                              +{order.items.length - 2} more item(s)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Attempted Amount */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {formatPrice(order.pricing?.total || 0)}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          #{order.orderNumber || order.id?.slice(-8) || order._id?.slice(-8)}
                        </div>
                      </td>

                      {/* Gateway & Timestamp */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 w-fit border border-slate-200">
                            {order.paymentMethod || "GATEWAY"}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            {order.createdAt ? format(new Date(order.createdAt), "dd MMM, yyyy") : "-"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {order.createdAt ? format(new Date(order.createdAt), "hh:mm a") : ""}
                          </span>
                        </div>
                      </td>

                      {/* Failure Reason - Compact, Clean, No Bulky Span */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="flex flex-col gap-1 max-w-[190px]">
                          <span 
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 w-fit whitespace-nowrap"
                            title={fullFailureReason}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                            {getFormattedFailureReason(order.failureReason, order.status)}
                          </span>
                          <span className="text-[10px] text-slate-500 leading-snug line-clamp-2" title={fullFailureReason}>
                            {order.failureReason || (order.status === "pending_payment" ? "Window expired before payment" : "Customer cancelled / declined")}
                          </span>
                        </div>
                      </td>

                      {/* Recovery Actions */}
                      <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {customerPhone && (
                            <button
                              type="button"
                              onClick={() => handleWhatsAppRecovery(order)}
                              title="Send WhatsApp recovery message"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          )}

                          {customerPhone && (
                            <a
                              href={`tel:${cleanPhone}`}
                              title="Call customer"
                              className="p-1 border border-slate-200 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                            >
                              <PhoneIcon className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <Link
                            href={`/admin/orders/${order.id || order._id}`}
                            title="View Full Order Info"
                            className="p-1 border border-slate-200 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                          >
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50/70 flex justify-between items-center text-xs text-slate-600">
            <span>
              Page <strong className="font-bold text-slate-900 font-mono">{page}</strong> of{" "}
              <strong className="font-bold text-slate-900 font-mono">{totalPages}</strong>
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-300 bg-white rounded-md text-xs font-bold disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 border border-slate-300 bg-white rounded-md text-xs font-bold disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
