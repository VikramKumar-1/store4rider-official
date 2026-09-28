"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { formatPrice } from "@store4riders/shared-utils";
import { useAdminOrderById } from "@/core/hooks/useOrderById";
import { useAdminUpdateOrderStatus, useAdminAddOrderNote, useAdminHandleReturn } from "@/core/hooks/useAdminOrders";
import { useGenerateInvoice } from "@/core/hooks/useOrderActions";
import { ArrowLeftIcon, DocumentArrowDownIcon, ChatBubbleLeftRightIcon, TruckIcon } from "@heroicons/react/24/outline";

const STATUS_OPTIONS = [
  "pending_payment", "confirmed", "processing", "packed", "shipped", 
  "delivered", "cancelled", "failed", "refunded", 
  "return_requested", "return_approved", "return_picked", "returned"
];

export const AdminOrderDetailModule = ({ orderId }: { orderId: string }) => {
  const { data: order, isLoading } = useAdminOrderById(orderId);
  const updateStatusMutation = useAdminUpdateOrderStatus();
  const addNoteMutation = useAdminAddOrderNote();
  const handleReturnMutation = useAdminHandleReturn();
  const generateInvoiceMutation = useGenerateInvoice();

  const [noteText, setNoteText] = useState("");
  const [returnNote, setReturnNote] = useState("");

  if (isLoading) {
    return <div className="p-12 text-center animate-pulse text-neutral-500 font-bold uppercase">Loading Order...</div>;
  }

  if (!order) {
    return <div className="p-12 text-center text-red-500 font-bold">Order not found.</div>;
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateStatusMutation.mutate({ orderId, status: e.target.value });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNoteMutation.mutate({ orderId, text: noteText }, {
      onSuccess: () => setNoteText("")
    });
  };

  const handleReturnAction = (action: "approve" | "reject") => {
    handleReturnMutation.mutate({ orderId, action, adminNote: returnNote });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="p-2 border border-neutral-200 rounded hover:bg-neutral-50">
          <ArrowLeftIcon className="w-5 h-5 text-neutral-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-neutral-900 uppercase">Order #{order.orderNumber || order.id || (order as any)._id}</h1>
          <p className="text-sm text-neutral-500 mt-1">Placed on {format(new Date(order.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-sm font-black uppercase text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Items</h2>
            <div className="divide-y divide-neutral-100">
              {order.items?.map((item: any) => (
                <div key={item.productId + item.variantId} className="py-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-neutral-900">{item.name}</div>
                    <div className="text-xs text-neutral-500 font-mono mt-0.5">SKU: {item.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-neutral-900">{formatPrice(item.unitPrice)}</div>
                    <div className="text-xs text-neutral-500">Qty: {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-sm font-black uppercase text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Pricing</h2>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-neutral-900">{formatPrice(order.pricing?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-bold text-neutral-900">{formatPrice(order.pricing?.shipping || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({order.pricing?.taxRate || 0}%)</span>
                <span className="font-bold text-neutral-900">{formatPrice(order.pricing?.tax || 0)}</span>
              </div>
              {order.pricing?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-bold">-{formatPrice(order.pricing.discount)}</span>
                </div>
              )}
              {order.pricing?.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({order.pricing.couponCode})</span>
                  <span className="font-bold">-{formatPrice(order.pricing.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-4 border-t border-neutral-100 mt-2 text-lg font-black text-neutral-900">
                <span>Total</span>
                <span className="text-brand">{formatPrice(order.pricing?.total || 0)}</span>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-sm font-black uppercase text-neutral-900 mb-4 border-b border-neutral-100 pb-2 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-neutral-400" />
              Internal Notes
            </h2>
            
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
              {(order as any).notes?.length === 0 ? (
                <div className="text-sm text-neutral-400 italic">No notes added yet.</div>
              ) : (
                (order as any).notes?.map((note: any, idx: number) => (
                  <div key={idx} className="bg-neutral-50 border border-neutral-100 p-3 rounded text-sm">
                    <p className="text-neutral-800">{note.text}</p>
                    <div className="flex justify-between items-center mt-2 text-[10px] uppercase font-bold text-neutral-400">
                      <span>{note.author}</span>
                      <span>{format(new Date(note.timestamp), "MMM dd, HH:mm")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Type an internal note..."
                className="flex-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-brand"
              />
              <button 
                type="submit" 
                disabled={addNoteMutation.isPending || !noteText.trim()}
                className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs uppercase rounded disabled:opacity-50"
              >
                {addNoteMutation.isPending ? "..." : "Add Note"}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          
          {/* Status Updater */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-sm font-black uppercase text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Status</h2>
            
            <div className="mb-4">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Current Status</label>
              <select
                value={order.status}
                onChange={handleStatusChange}
                disabled={updateStatusMutation.isPending}
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-brand font-bold uppercase text-neutral-800 bg-neutral-50"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => generateInvoiceMutation.mutate(orderId)}
              disabled={generateInvoiceMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-neutral-300 bg-white text-neutral-800 font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              {generateInvoiceMutation.isPending ? "Generating..." : "Download Invoice PDF"}
            </button>
          </div>

          {/* Return Management (Only visible if requested) */}
          {order.status === "return_requested" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 animate-in fade-in">
              <h2 className="text-sm font-black uppercase text-orange-900 mb-2">Return Request Pending</h2>
              <p className="text-xs text-orange-700 mb-4">Customer has requested a return. Review and take action.</p>
              
              <input 
                type="text" 
                value={returnNote}
                onChange={e => setReturnNote(e.target.value)}
                placeholder="Reason / Note to customer (optional)"
                className="w-full px-3 py-2 border border-orange-200 rounded text-sm mb-4 focus:outline-none focus:border-orange-400 bg-white"
              />

              <div className="flex gap-2">
                <button 
                  onClick={() => handleReturnAction("approve")}
                  disabled={handleReturnMutation.isPending}
                  className="flex-1 py-2 bg-green-600 text-white font-bold text-xs uppercase rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleReturnAction("reject")}
                  disabled={handleReturnMutation.isPending}
                  className="flex-1 py-2 bg-red-600 text-white font-bold text-xs uppercase rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-sm font-black uppercase text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Customer & Shipping</h2>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Name</span>
                <span className="font-bold text-neutral-900">{order.shippingAddress?.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Phone</span>
                <span className="text-neutral-800">{order.shippingAddress?.phone}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Address</span>
                <span className="text-neutral-800 block">{order.shippingAddress?.addressLine1}</span>
                {order.shippingAddress?.addressLine2 && <span className="text-neutral-800 block">{order.shippingAddress?.addressLine2}</span>}
                <span className="text-neutral-800 block">{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Payment Method</span>
                <span className="text-neutral-800 uppercase font-bold">{order.paymentMethod}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
