"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatPrice } from "@store4riders/shared-utils";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Package, Truck } from "lucide-react";

import Image from "next/image";

export function OrderHistory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await apiClient.get("/orders/me");
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-8 w-48 bg-neutral-200 rounded mb-2"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-neutral-100 border border-neutral-200 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (error) return <div className="py-20 text-center text-red-500 font-bold">Failed to load your orders. Please try again.</div>;

  const orders = data?.data || [];

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-neutral-50 rounded-2xl border border-neutral-100">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-5 text-neutral-300">
          <Package size={40} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-black text-neutral-900 tracking-tight uppercase mb-2">No Orders Yet</h2>
        <p className="text-neutral-500 max-w-sm mx-auto mb-8 text-sm">
          You haven't placed any orders yet. Start exploring our premium riding gear and accessories!
        </p>
        <Link href="/">
          <button className="bg-brand hover:bg-red-800 text-white font-bold px-8 py-3.5 text-xs tracking-wider uppercase transition-colors shadow-md">
            Start Shopping
          </button>
        </Link>
      </div>
    );
  }

  // Helper to format status nicely
  const getStatusDisplay = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending_payment': return { text: 'Awaiting Payment', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'processing': return { text: 'Processing', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'shipped': return { text: 'Shipped', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'delivered': return { text: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'cancelled': return { text: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' };
      default: return { text: status.toUpperCase(), color: 'bg-neutral-100 text-neutral-600 border-neutral-200' };
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-sans font-black text-2xl lg:text-3xl text-neutral-900 tracking-tight uppercase">
          Order History
        </h1>
        <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
        </span>
      </div>
      
      <div className="flex flex-col gap-5">
        {orders.map((order: any) => {
          const statusConfig = getStatusDisplay(order.status);
          const firstItem = order.items?.[0];
          const productImg = firstItem?.product?.images?.[0]?.url || firstItem?.product?.image || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80";
          const additionalItemsCount = Math.max(0, (order.items?.length || 0) - 1);
          
          return (
            <div key={order._id || order.id} className="group bg-white border border-neutral-200 hover:border-neutral-300 rounded-none overflow-hidden transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col md:flex-row">
              
              {/* Order Header & Info (Left Side) */}
              <div className="flex flex-col flex-1 p-5 lg:p-6 border-b md:border-b-0 md:border-r border-neutral-100">
                
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="font-mono text-sm font-bold text-neutral-900">
                    Order #{order.orderNumber || (order._id || order.id).slice(-8).toUpperCase()}
                  </span>
                  <div className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border rounded-sm ${statusConfig.color}`}>
                    {statusConfig.text}
                  </div>
                </div>

                <div className="flex gap-4">
                  {/* Item Image */}
                  <Link href={`/products/${firstItem?.product?.slug}`} className="shrink-0">
                    <div className="relative w-20 h-20 bg-neutral-50 border border-neutral-100 flex items-center justify-center p-1 hover:border-brand transition-colors">
                      <Image 
                        src={productImg} 
                        alt="Product" 
                        fill 
                        className="object-contain p-1 mix-blend-multiply" 
                        sizes="80px"
                      />
                    </div>
                  </Link>
                  
                  {/* Item Details */}
                  <div className="flex flex-col justify-center min-w-0">
                    <Link href={`/products/${firstItem?.product?.slug}`}>
                      <p className="text-xs font-bold text-neutral-900 uppercase line-clamp-2 mb-1 hover:text-brand transition-colors">
                        {firstItem?.product?.name || "Riding Gear"}
                      </p>
                    </Link>
                    <p className="text-[11px] text-neutral-500 font-medium">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {additionalItemsCount > 0 && (
                      <p className="text-[10px] font-bold text-brand mt-1.5 uppercase tracking-wide">
                        + {additionalItemsCount} more {additionalItemsCount === 1 ? 'item' : 'items'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Actions & Price (Right Side) */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between p-5 lg:p-6 md:w-64 bg-neutral-50/50">
                <div className="flex flex-col md:items-end w-full">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Total Amount</span>
                  <span className="text-xl md:text-2xl font-black text-neutral-900">
                    {formatPrice(order.pricing?.total || order.totalAmount || 0)}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-auto w-full md:w-auto shrink-0">
                  {/* Tracking Button - Only shows when processing or shipped */}
                  {["shipped", "processing", "delivered"].includes(order.status) && (
                    <Link href={`/account/orders/${order._id || order.id}`} className="w-full md:w-auto">
                      <button className="w-full border border-brand text-brand hover:bg-brand hover:text-white text-[11px] font-bold tracking-wider uppercase px-4 py-2.5 transition-colors flex items-center justify-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        Track
                      </button>
                    </Link>
                  )}
                  
                  <Link href={`/account/orders/${order._id || order.id}`} className="w-full md:w-auto">
                    <button className="w-full border border-neutral-300 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 text-[11px] font-bold tracking-wider uppercase px-4 py-2.5 transition-colors">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
}
