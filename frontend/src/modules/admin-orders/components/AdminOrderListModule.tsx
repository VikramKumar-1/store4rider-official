"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@store4riders/shared-utils";
import { useAdminOrders } from "@/core/hooks/useAdminOrders";
import { format } from "date-fns";
import { MagnifyingGlassIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";

export const AdminOrderListModule = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useAdminOrders({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const orders = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / 20);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": case "failed": case "refunded": return "bg-red-100 text-red-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "return_requested": return "bg-orange-100 text-orange-800";
      case "return_approved": return "bg-purple-100 text-purple-800";
      default: return "bg-neutral-100 text-neutral-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 uppercase">Orders Management</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage and track all customer orders</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 border border-neutral-200 rounded-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search order #, customer, phone..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-brand"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-auto px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-brand font-bold uppercase text-neutral-700"
        >
          <option value="">All Statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="return_requested">Return Requested</option>
          <option value="return_approved">Return Approved</option>
          <option value="returned">Returned</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                      Loading Orders...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500 font-medium">
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id || order._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-neutral-900">
                      {order.orderNumber || order.id || order._id}
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {format(new Date(order.createdAt), "MMM dd, yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900">{order.shippingAddress?.fullName}</div>
                      <div className="text-xs text-neutral-500">{order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-neutral-900 uppercase">
                          {order.paymentMethod === 'cod' ? 'COD' : 'PREPAID'}
                        </span>
                        <span className={`text-[10px] uppercase font-bold ${order.paymentMethod !== 'cod' ? 'text-emerald-600' : 'text-neutral-500'}`}>
                          {order.paymentMethod !== 'cod' ? `PAID (${order.paymentMethod})` : 'UNPAID'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-neutral-900">
                      {formatPrice(order.pricing?.total || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/orders/${order.id || order._id}`}
                        className="text-brand font-bold text-xs uppercase hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 bg-white border border-neutral-300 rounded text-sm font-bold disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs font-bold text-neutral-500">Page {page} of {totalPages}</span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 bg-white border border-neutral-300 rounded text-sm font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
