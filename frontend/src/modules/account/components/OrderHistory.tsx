"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatPrice } from "@store4riders/shared-utils";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Package, Truck } from "lucide-react";

export function OrderHistory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await apiClient.get("/orders/me");
      return res.data;
    }
  });

  if (isLoading) return <div className="py-20 text-center">Loading orders...</div>;
  if (error) return <div className="py-20 text-center text-red-500">Failed to load orders.</div>;

  const orders = data?.data || [];

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-full text-zinc-400 mb-2">
          <Package size={48} />
        </div>
        <h2 className="text-2xl font-bold">No orders yet</h2>
        <p className="text-zinc-500 max-w-md mx-auto mb-4">You haven't placed any orders. Start exploring our gear!</p>
        <Link href="/products"><Button>Browse Products</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Order History</h1>
      
      <div className="flex flex-col gap-4">
        {orders.map((order: any) => (
          <div key={order._id} className="glass p-6 rounded-xl border border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono font-medium">#{order._id.slice(-8).toUpperCase()}</span>
                <Badge variant={order.status === "pending" ? "warning" : "success"}>
                  {order.status}
                </Badge>
              </div>
              <p className="text-sm text-zinc-500">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm font-medium mt-2">
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            
            <div className="flex flex-col md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-zinc-100 dark:border-zinc-800">
              <span className="text-xl font-bold text-brand">{formatPrice(order.pricing?.total || 0)}</span>
              <div className="flex gap-2">
                {["shipped", "processing", "delivered"].includes(order.status) && (
                  <Link href={`/account/orders/${order._id || order.id}/tracking`}>
                    <Button variant="outline" size="sm" className="gap-2"><Truck className="w-4 h-4"/> Track</Button>
                  </Link>
                )}
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
