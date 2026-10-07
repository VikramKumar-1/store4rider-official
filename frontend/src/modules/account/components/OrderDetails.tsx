"use client";
import React, { useState } from "react";
import { toast } from "sonner";import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatPrice } from "@store4riders/shared-utils";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Package, Truck, Receipt, CreditCard, Clock, CheckCircle } from "lucide-react";

export function OrderDetails({ orderId }: { orderId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await apiClient.get(`/orders/${orderId}`);
      return res.data;
    },
    enabled: !!orderId
  });

  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-8 w-64 bg-neutral-200 rounded mb-4"></div>
        <div className="h-32 bg-neutral-100 rounded-xl"></div>
        <div className="h-64 bg-neutral-100 rounded-xl"></div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Order Not Found</h2>
        <p className="text-neutral-500 mb-6">We couldn't find the details for this order.</p>
        <Link href="/account/orders">
          <button className="bg-brand text-white font-bold px-6 py-2.5 text-xs tracking-wider uppercase transition-colors">
            Back to Orders
          </button>
        </Link>
      </div>
    );
  }

  const order = data.data;
  
  // Status Stepper Logic
  const statuses = ["pending_payment", "processing", "shipped", "delivered"];
  const currentStatusIndex = statuses.indexOf(order.status?.toLowerCase() || "pending_payment");
  const isCancelled = order.status?.toLowerCase() === "cancelled";

  const handleDownloadInvoice = async () => {
    try {
      setIsGeneratingInvoice(true);
      toast.loading("Generating invoice...", { id: "invoice" });
      const res = await apiClient.get(`/orders/${order._id || order.id}/invoice`);
      if (res.data?.data?.invoiceUrl) {
        window.open(res.data.data.invoiceUrl, "_blank");
        toast.success("Invoice opened in new tab!", { id: "invoice" });
      } else {
        toast.error("Failed to generate invoice", { id: "invoice" });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error generating invoice", { id: "invoice" });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  return (
    <div className="flex flex-col w-full font-sans pb-10">
      
      {/* Back Button */}
      <Link href="/account/orders" className="flex items-center gap-2 text-neutral-500 hover:text-brand text-xs font-bold uppercase tracking-wider mb-6 w-fit transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Order History
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-black text-2xl lg:text-3xl text-neutral-900 tracking-tight uppercase">
            Order #{order.orderNumber || (order._id || order.id).slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-neutral-500 font-medium mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" /> 
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadInvoice}
            disabled={isGeneratingInvoice}
            className="border border-neutral-300 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 text-[11px] font-bold tracking-wider uppercase px-4 py-2.5 transition-colors flex items-center gap-2 bg-white shadow-sm disabled:opacity-50"
          >
            <Receipt className="w-4 h-4" />
            {isGeneratingInvoice ? "Generating..." : "Invoice"}
          </button>
        </div>
      </div>

      {/* Status Timeline (Stepper) */}
      {!isCancelled ? (
        <div className="bg-white border border-neutral-200 p-6 md:p-8 mb-8 shadow-sm">
          <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-100 rounded-full z-0"></div>
            
            <div className="relative z-10 flex justify-between w-full">
              {[
                { key: "pending_payment", label: "Order Placed" },
                { key: "processing", label: "Processing" },
                { key: "shipped", label: "Shipped" },
                { key: "delivered", label: "Delivered" }
              ].map((step, index) => {
                const isActive = currentStatusIndex >= index;
                const isCurrent = currentStatusIndex === index;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 bg-white px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-neutral-300 text-neutral-300'}`}>
                      {isActive ? <CheckCircle className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-neutral-300"></div>}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wide hidden sm:block ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Active Progress Bar */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full z-0 transition-all duration-500"
              style={{ width: `${(Math.max(0, currentStatusIndex) / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 mb-8 text-sm font-bold flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <span className="text-xl">✕</span>
          </div>
          This order has been cancelled.
        </div>
      )}

      {/* Two Column Layout for Details */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Items */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white border border-neutral-200 shadow-sm">
            <div className="border-b border-neutral-200 p-4 bg-neutral-50/50">
              <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-900">Items Ordered</h3>
            </div>
            
            <div className="flex flex-col">
              {order.items?.map((item: any) => (
                <div key={item._id || item.productId} className="flex flex-col sm:flex-row gap-4 p-5 border-b border-neutral-100 last:border-0 group">
                  {item.product?.slug ? (
                    <Link href={`/products/${item.product.slug}`} className="shrink-0">
                      <div className="relative w-24 h-24 bg-neutral-50 border border-neutral-100 flex items-center justify-center p-2 hover:border-brand transition-colors">
                        <Image 
                          src={item.product?.images?.[0]?.url || item.product?.image || "/no-image.svg"} 
                          alt="Product" 
                          fill 
                          className="object-contain p-1 mix-blend-multiply" 
                          sizes="96px"
                        />
                      </div>
                    </Link>
                  ) : (
                    <div className="shrink-0 relative w-24 h-24 bg-neutral-50 border border-neutral-100 flex items-center justify-center p-2">
                      <Image 
                        src={item.product?.images?.[0]?.url || item.product?.image || "/no-image.svg"} 
                        alt="Product" 
                        fill 
                        className="object-contain p-1 mix-blend-multiply" 
                        sizes="96px"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-col flex-1 min-w-0">
                    {item.product?.slug ? (
                      <Link href={`/products/${item.product.slug}`}>
                        <p className="text-sm font-bold text-neutral-900 uppercase leading-snug mb-1 hover:text-brand transition-colors">
                          {item.name || item.product?.name || "Riding Gear"}
                        </p>
                      </Link>
                    ) : (
                      <p className="text-sm font-bold text-neutral-900 uppercase leading-snug mb-1">
                        {item.name || item.product?.name || "Riding Gear"}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 mb-3">
                      {item.variantId && <span>Variant: <strong className="text-neutral-700">{item.variantId}</strong></span>}
                      <span>Qty: <strong className="text-neutral-700">{item.quantity}</strong></span>
                      <span>Price: <strong className="text-neutral-700">{formatPrice(item.price ?? item.unitPrice)}</strong></span>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between sm:justify-start gap-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-0.5">Total</span>
                        <span className="text-base font-black text-brand">{formatPrice((item.price ?? item.unitPrice) * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Summaries */}
        <div className="w-full lg:w-[35%] flex flex-col gap-6">
          
          {/* Order Summary */}
          <div className="bg-white border border-neutral-200 shadow-sm p-5">
            <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-900 mb-4 pb-4 border-b border-neutral-100">Order Summary</h3>
            
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-medium text-neutral-900">{formatPrice(order.pricing?.subtotal || order.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span className="font-medium text-neutral-900">{formatPrice(order.pricing?.shipping || 0)}</span>
              </div>
              {order.pricing?.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-bold">-{formatPrice(order.pricing?.discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-dashed border-neutral-200">
                <span className="font-bold text-neutral-900 uppercase tracking-wider">Grand Total</span>
                <span className="text-xl font-black text-brand">{formatPrice(order.pricing?.total || order.totalAmount || 0)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="bg-white border border-neutral-200 shadow-sm p-5">
            <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-900 mb-4 pb-4 border-b border-neutral-100">Shipping & Payment</h3>
            
            <div className="flex flex-col gap-5 text-sm">
              <div className="flex flex-col gap-1.5">
                <span className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <Truck className="w-3.5 h-3.5" /> Shipping Address
                </span>
                <p className="font-bold text-neutral-900">{order.shippingAddress?.fullName}</p>
                <p className="text-neutral-600 leading-relaxed text-xs">
                  {order.shippingAddress?.street}<br/>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}<br/>
                  {order.shippingAddress?.country || "India"}
                </p>
                <p className="text-neutral-600 text-xs mt-1">Phone: {order.shippingAddress?.phone}</p>
              </div>

              <div className="flex flex-col gap-1.5 pt-4 border-t border-neutral-100">
                <span className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <CreditCard className="w-3.5 h-3.5" /> Payment Method
                </span>
                <div className="flex items-center gap-2">
                  <span className="bg-neutral-100 px-2.5 py-1 rounded-sm text-xs font-bold text-neutral-700 uppercase tracking-wide">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod?.toUpperCase()}
                  </span>
                  {order.paymentStatus === 'paid' && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200 uppercase tracking-wider">Paid</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
