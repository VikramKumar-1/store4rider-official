"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  AlertCircle, 
  TrendingUp, 
  Package, 
  Truck, 
  ArrowRight, 
  Copy, 
  CreditCard, 
  Banknote,
  Eye
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useAdminStats, useAdminRevenueChart, useAdminRecentOrders } from "@/core/hooks/useAdminDashboard";
import { formatPrice } from "@store4riders/shared-utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { OrderQuickViewModal } from "@/modules/admin-orders/components/OrderQuickViewModal";
import { OrderFulfillmentPanel } from "@/modules/admin-shipping/components/OrderFulfillmentPanel";
import { AdminCustomerCareDashboard } from "./AdminCustomerCareDashboard";

export function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [selectedQuickViewOrder, setSelectedQuickViewOrder] = useState<any | null>(null);
  const [orderTab, setOrderTab] = useState<"to_pack" | "all">("to_pack");
  const [fulfillOrderId, setFulfillOrderId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const isCustomerCareTab = tabParam === "inquiries" || tabParam === "orders";

  const isLogisticRole = user?.role === "logistic";
  const isCustomerCareRole = user?.role === "customer_care" || user?.role === "customer_support";

  // If user has pure logistic role, navigate directly to their dedicated shipping workspace
  useEffect(() => {
    if (mounted && isLogisticRole) {
      router.replace("/admin/shipping");
    }
  }, [mounted, isLogisticRole, router]);

  const { data: stats, isLoading: statsLoading } = useAdminStats({ enabled: !isCustomerCareRole && !isCustomerCareTab });
  const { data: chartData, isLoading: chartLoading } = useAdminRevenueChart({ enabled: !isCustomerCareRole && !isCustomerCareTab });
  const { data: recentOrders, isLoading: ordersLoading } = useAdminRecentOrders({ enabled: !isCustomerCareRole && !isCustomerCareTab });

  if (!mounted || isLogisticRole) {
    if (isLogisticRole) return null;
    return (
      <div className="space-y-6">
        <div className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-100 rounded-xl animate-pulse"></div>
          <div className="h-28 bg-slate-100 rounded-xl animate-pulse"></div>
          <div className="h-28 bg-slate-100 rounded-xl animate-pulse"></div>
          <div className="h-28 bg-slate-100 rounded-xl animate-pulse"></div>
        </div>
        <div className="h-72 bg-slate-100 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  // Pure dedicated Customer Care console: shows only Contact Us issues and Order Search/Assistance
  if (isCustomerCareRole || isCustomerCareTab) {
    return <AdminCustomerCareDashboard />;
  }

  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "shipped": return "bg-blue-100 text-blue-800 border-blue-200";
      case "packed": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "processing": case "confirmed": return "bg-amber-100 text-amber-800 border-amber-200";
      case "cancelled": case "failed": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Store Overview &amp; Analytics
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Real-time financial performance, recent orders, and customer activity.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/shipping"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-sm transition-colors"
          >
            <Truck className="w-4 h-4 text-brand" />
            <span>Shipping &amp; Fulfillment</span>
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand/90 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>All Orders</span>
          </Link>
        </div>
      </div>

      {/* 4 Core Financial & Store KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard
          title="Total Store Revenue"
          value={statsLoading ? "..." : formatPrice(stats?.totalRevenue || 0)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          trend="All completed & active orders"
          trendUp={true}
          bgClass="bg-emerald-50"
        />
        <KpiCard
          title="Total Placed Orders"
          value={statsLoading ? "..." : (stats?.totalOrders || 0).toLocaleString()}
          icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
          trend="Lifetime commercial orders"
          trendUp={true}
          bgClass="bg-blue-50"
        />
        <KpiCard
          title="Registered Customers"
          value={statsLoading ? "..." : (stats?.customers || 0).toLocaleString()}
          icon={<Users className="w-5 h-5 text-purple-600" />}
          trend="Active buyer accounts"
          trendUp={true}
          bgClass="bg-purple-50"
        />
        <KpiCard
          title="Low Stock Products"
          value={statsLoading ? "..." : (stats?.lowStockCount || 0).toLocaleString()}
          icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
          trend={stats?.lowStockCount > 0 ? "Requires restock" : "Inventory healthy"}
          trendUp={stats?.lowStockCount === 0}
          bgClass="bg-amber-50"
        />
      </div>

      {/* Analytics & Fast Dispatch Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Chart (30 Days) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-100 text-brand">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Revenue Trend (Last 30 Days)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Aggregated daily</span>
          </div>

          {chartLoading ? (
            <div className="animate-pulse h-64 bg-slate-50 rounded-xl" />
          ) : (
            <div className="h-64 w-full">
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      dy={8}
                    />
                    <YAxis 
                      width={60}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(value) => `₹${value}`}
                      domain={[0, (dataMax: number) => Math.max(dataMax, 5000)]}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [formatPrice(value), "Sales"]}
                      labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#AB1509" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={45}
                      minPointSize={4}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  No sales recorded in the last 30 days.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Fulfillment & Operations Widget */}
        <div className="bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-brand/20 border border-brand/30 text-brand">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Logistics &amp; Dispatch</h3>
            </div>
            
            <p className="text-slate-400 text-xs leading-relaxed">
              Live handover and tracking pipeline for courier partners (Shiprocket, Delhivery, Xpressbees).
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Orders Ready to Pack</span>
                <span className="font-bold text-amber-400 font-mono text-sm">
                  {statsLoading ? "..." : `${stats?.pendingFulfillments ?? 0} Orders`}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Packages in Transit</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {statsLoading ? "..." : `${stats?.activeShipments ?? 0} Active`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <Link
              href="/admin/shipping"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              <span>Open Shipping Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table Header Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOrderTab("to_pack")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  orderTab === "to_pack"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span>Orders to Pack</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${orderTab === "to_pack" ? "bg-amber-400 text-slate-950 font-black" : "bg-slate-200 text-slate-700"}`}>
                  {(recentOrders || []).filter((o: any) => ["confirmed", "processing", "pending_payment", "paid"].includes(String(o.status || "").toLowerCase())).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOrderTab("all")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  orderTab === "all"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                <span>All Recent Orders</span>
              </button>
            </div>
          </div>
          
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {ordersLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                    Loading recent orders...
                  </td>
                </tr>
              ) : !recentOrders || recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                (recentOrders || [])
                .filter((order: any) => orderTab === "all" || ["confirmed", "processing", "pending_payment", "paid"].includes(String(order.status || "").toLowerCase()))
                .map((order: any) => {
                  const isCod = String(order.paymentMethod || "").toLowerCase() === "cod";
                  const orderNum = order.orderNumber || order.id || order._id;
                  const customerName = order.shippingAddress?.fullName || "Guest Rider";
                  const total = formatPrice(order.pricing?.total || 0);

                  return (
                    <tr key={order._id || order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedQuickViewOrder(order)}
                            className="font-bold text-slate-900 hover:text-brand font-mono text-xs"
                          >
                            #{orderNum}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(e, orderNum, "Order number")}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                            title="Copy Order #"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {customerName}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {order.createdAt ? format(new Date(order.createdAt), "dd MMM, hh:mm a") : "-"}
                      </td>

                      <td className="py-3.5 px-4">
                        {isCod ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                            <Banknote className="w-3 h-3" />
                            COD
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                            <CreditCard className="w-3 h-3" />
                            Prepaid
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {total}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap ${getStatusColor(order.status)}`}>
                          {order.status?.replace(/_/g, " ") || "Pending"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {["confirmed", "processing", "pending_payment", "paid"].includes(String(order.status || "").toLowerCase()) && (
                            <button
                              type="button"
                              onClick={() => setFulfillOrderId(String(order._id || order.id))}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand hover:bg-brand/90 text-white font-bold text-xs shadow-sm transition-colors"
                              title="Pack order & assign courier"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>Pack Order</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedQuickViewOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Quick View Modal */}
      {fulfillOrderId && (
        <OrderFulfillmentPanel
          orderId={fulfillOrderId}
          onClose={() => setFulfillOrderId(null)}
        />
      )}

      {selectedQuickViewOrder && (
        <OrderQuickViewModal
          order={selectedQuickViewOrder}
          onClose={() => setSelectedQuickViewOrder(null)}
        />
      )}

    </div>
  );
}

function KpiCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp, 
  bgClass 
}: { 
  title: string; 
  value: React.ReactNode; 
  icon: React.ReactNode; 
  trend: string; 
  trendUp: boolean; 
  bgClass: string 
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${bgClass}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {trend}
        </span>
      </div>
      <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-0.5">{value}</div>
      <div className="text-xs font-medium text-slate-500">{title}</div>
    </div>
  );
}
