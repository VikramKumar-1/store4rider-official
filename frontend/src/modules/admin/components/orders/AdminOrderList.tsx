"use client";

import React, { useState } from "react";
import { useAdminRecentOrders } from "@/core/hooks/useAdminDashboard";
import { formatPrice } from "@store4riders/shared-utils";
import { OrderFulfillmentPanel } from "@/modules/admin-shipping/components/OrderFulfillmentPanel";

export function AdminOrderList() {
  const { data: orders, isLoading } = useAdminRecentOrders();
  const [fulfillOrderId, setFulfillOrderId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Manage Orders</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-xs uppercase text-neutral-500 font-bold border-b border-neutral-200">
              <th className="p-4">Order ID</th>
              <th className="p-4">Status</th>
              <th className="p-4">Total</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-500 animate-pulse">Loading orders...</td>
              </tr>
            ) : orders?.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-500">No orders found.</td>
              </tr>
            ) : (
              orders?.map((order: any) => (
                <tr key={order._id || order.id} className="hover:bg-neutral-50 group">
                  <td className="p-4 font-mono font-bold">#{ (order._id || order.id).slice(-6).toUpperCase() }</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-neutral-100 rounded text-xs font-bold uppercase">{order.status}</span>
                  </td>
                  <td className="p-4 font-bold text-brand">{formatPrice(order.pricing?.total || 0)}</td>
                  <td className="p-4 text-right">
                    {["confirmed", "processing", "paid"].includes(order.status) && (
                      <button
                        onClick={() => setFulfillOrderId(order._id || order.id)}
                        className="px-3 py-1.5 bg-brand text-white text-xs font-bold uppercase rounded hover:bg-red-700 transition-colors"
                      >
                        Ship Order
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {fulfillOrderId && (
        <OrderFulfillmentPanel 
          orderId={fulfillOrderId} 
          onClose={() => setFulfillOrderId(null)} 
        />
      )}
    </div>
  );
}
