"use client";
import { useState } from "react";
import { useAdminStats, useAdminRevenueChart } from "@/core/hooks/useAdminDashboard";
import { formatPrice } from "@store4riders/shared-utils";
import { DollarSign, ShoppingBag, Users, AlertCircle, TrendingUp, Package } from "lucide-react";
import Link from "next/link";
import { OrderFulfillmentPanel } from "@/modules/admin-shipping/components/OrderFulfillmentPanel";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: chartData, isLoading: chartLoading } = useAdminRevenueChart();
  
  const [fulfillOrderId, setFulfillOrderId] = useState<string | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Here is what is happening in your store today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/admin/orders" className="bg-brand text-white px-4 py-2 rounded-lg font-medium hover:bg-brand/90 transition-colors shadow-sm flex items-center space-x-2">
            <ShoppingBag size={18} />
            <span>Manage Orders</span>
          </Link>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Revenue" 
          value={statsLoading ? "..." : formatPrice(stats?.totalRevenue || 0)} 
          icon={<DollarSign size={24} className="text-emerald-600" />}
          trend={stats?.revenueTrend ? `${stats.revenueTrend}% from last month` : "Calculated nightly"}
          trendUp={true}
          bgClass="bg-emerald-50"
        />
        <KpiCard 
          title="Total Orders" 
          value={statsLoading ? "..." : stats?.totalOrders || 0} 
          icon={<ShoppingBag size={24} className="text-blue-600" />}
          trend={stats?.ordersTrend ? `${stats.ordersTrend}% from last month` : "Calculated nightly"}
          trendUp={true}
          bgClass="bg-blue-50"
        />
        <KpiCard 
          title="Customers" 
          value={statsLoading ? "..." : stats?.customers || 0} 
          icon={<Users size={24} className="text-purple-600" />}
          trend={stats?.customersTrend ? `${stats.customersTrend}% from last month` : "Calculated nightly"}
          trendUp={true}
          bgClass="bg-purple-50"
        />
        <KpiCard 
          title="Low Stock Alerts" 
          value={statsLoading ? "..." : stats?.lowStockCount || 0} 
          icon={<AlertCircle size={24} className="text-red-600" />}
          trend="Requires attention"
          trendUp={false}
          bgClass="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-w-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <TrendingUp className="mr-2 text-slate-500" size={20} />
              Revenue (Last 30 Days)
            </h2>
          </div>
          {chartLoading ? (
            <div className="animate-pulse h-64 bg-slate-100 rounded-xl"></div>
          ) : (
            <div className="h-64 w-full">
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      width={60}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `₹${value}`}
                      domain={[0, (dataMax: number) => Math.max(dataMax, 5000)]}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [formatPrice(value), "Revenue"]}
                      labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#AB1509" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                      minPointSize={4}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  No revenue data available for the selected period.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actionable Panels (Right Column) */}
        <div className="space-y-8 min-w-0">
          
          {/* Quick Actions Placeholder */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-sm border border-slate-700 p-6 text-white h-full flex flex-col justify-center">
             <h2 className="text-lg font-bold flex items-center mb-4">
                <Package className="mr-2 text-brand" size={20} />
                Pending Fulfillments
             </h2>
             <p className="text-slate-300 text-sm mb-6">You have orders waiting to be shipped. Keep the momentum going!</p>
             <Link href="/admin/orders?status=paid" className="block w-full py-3 bg-brand text-white text-center rounded-lg font-bold hover:bg-red-800 transition-colors shadow-lg">
               Ship Orders Now
             </Link>
          </div>

        </div>
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

function KpiCard({ title, value, icon, trend, trendUp, bgClass }: { title: string; value: React.ReactNode; icon: React.ReactNode; trend: string; trendUp: boolean; bgClass: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgClass}`}>
          {icon}
        </div>
        {/* Trend Pill */}
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {trend}
        </span>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-500">{title}</div>
    </div>
  );
}
