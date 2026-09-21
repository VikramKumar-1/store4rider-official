"use client";
import { useAdminStats, useAdminRecentOrders, useAdminRevenueChart } from "@/core/hooks/useAdminDashboard";
import { formatPrice } from "@store4riders/shared-utils";
import { DollarSign, ShoppingBag, Users, AlertCircle, TrendingUp, Package, Clock } from "lucide-react";
import Link from "next/link";

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: recentOrders, isLoading: ordersLoading } = useAdminRecentOrders();
  const { data: chartData, isLoading: chartLoading } = useAdminRevenueChart();

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart (Placeholder for now, could use Recharts) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <TrendingUp className="mr-2 text-slate-500" size={20} />
              Revenue (Last 30 Days)
            </h2>
          </div>
          {chartLoading ? (
            <div className="animate-pulse h-64 bg-slate-100 rounded-xl"></div>
          ) : (
            <div className="h-64 flex items-end space-x-2">
              {chartData?.map((item: any) => (
                <div 
                  key={item.date} 
                  className="flex-1 bg-brand/80 hover:bg-brand transition-colors rounded-t-sm" 
                  style={{ height: `${Math.max(10, (item.revenue / (Math.max(...chartData.map((d: any) => d.revenue)) || 1)) * 100)}%` }} 
                  title={`${item.date}: ${formatPrice(item.revenue)}`}
                ></div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-4 text-center">Run `pnpm add recharts` and we can make this chart interactive!</p>
        </div>

        {/* Actionable Panels */}
        <div className="space-y-8">
          
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <Clock className="mr-2 text-slate-500" size={20} />
                Recent Orders
              </h2>
              <Link href="/admin/orders" className="text-brand text-sm font-medium hover:underline">View All</Link>
            </div>
            
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="animate-pulse h-12 bg-slate-100 rounded-lg"></div>)}
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders?.map((order: any) => (
                  <div key={order._id} className="group flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-xs">
                        #{order._id.substring(order._id.length - 4).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{formatPrice(order.totalAmount)}</div>
                        <div className="text-xs text-slate-500 capitalize">{order.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {recentOrders?.length === 0 && <div className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">No recent orders found.</div>}
              </div>
            )}
          </div>
          
          {/* Quick Actions Placeholder */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-sm border border-slate-700 p-6 text-white">
             <h2 className="text-lg font-bold flex items-center mb-4">
                <Package className="mr-2 text-brand" size={20} />
                Pending Fulfillments
             </h2>
             <p className="text-slate-300 text-sm mb-4">You have orders waiting to be shipped.</p>
             <Link href="/admin/orders?status=paid" className="block w-full py-2.5 bg-white text-slate-900 text-center rounded-lg font-medium hover:bg-slate-100 transition-colors">
               Ship Orders Now
             </Link>
          </div>

        </div>
      </div>
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
