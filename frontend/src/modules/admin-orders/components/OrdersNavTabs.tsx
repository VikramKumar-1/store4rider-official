"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBagIcon, ExclamationTriangleIcon, ArrowPathRoundedSquareIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useAdminOrderCounts } from "@/core/hooks/useAdminOrders";
import { useAuthStore } from "@/stores/useAuthStore";

interface OrdersNavTabsProps {
  className?: string;
}

export const OrdersNavTabs: React.FC<OrdersNavTabsProps> = ({ className = "" }) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { data: counts } = useAdminOrderCounts();

  const isCustomerCare = user?.role === "customer_care" || user?.role === "customer_support";

  const allTabs = [
    {
      name: "Orders (Paid & COD)",
      href: "/admin/orders",
      icon: ShoppingBagIcon,
      count: counts?.activeCount,
      countColor: "bg-slate-100 text-slate-700",
      activeColor: "border-brand text-brand",
      isActive: pathname === "/admin/orders" || /^\/admin\/orders\/[0-9a-fA-F-]+$/.test(pathname),
      description: "Confirmed Customer Orders",
      hideForSupport: true,
    },
    {
      name: "Failed Transactions",
      href: "/admin/orders/failed",
      icon: ExclamationTriangleIcon,
      count: counts?.failedCount,
      countColor: counts?.failedCount ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500",
      activeColor: "border-red-600 text-red-600",
      isActive: pathname === "/admin/orders/failed",
      description: "Abandoned & Gateway Failures",
      hideForSupport: false,
    },
    {
      name: "Exchange Requests",
      href: "/admin/orders/exchanges",
      icon: ArrowPathRoundedSquareIcon,
      count: counts?.exchangeCount,
      countColor: counts?.exchangeCount ? "bg-amber-100 text-amber-700 font-bold" : "bg-slate-100 text-slate-500",
      activeColor: "border-amber-600 text-amber-600",
      isActive: pathname === "/admin/orders/exchanges",
      description: "7-Day Size & Defect Swaps",
      hideForSupport: true,
    },
  ];

  const visibleTabs = isCustomerCare 
    ? allTabs.filter(t => !t.hideForSupport) 
    : allTabs;

  return (
    <div className={`border-b border-slate-200 bg-white rounded-xl shadow-xs font-sans ${className}`}>
      <div className="flex items-center justify-between overflow-x-auto px-2">
        <div className="flex">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold tracking-tight whitespace-nowrap border-b-2 transition-all ${
                  tab.isActive
                    ? `${tab.activeColor} bg-slate-50/50`
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.isActive ? "" : "text-slate-400"}`} />
                <span>{tab.name}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab.countColor}`}>
                    {tab.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {isCustomerCare && (
          <div className="pr-3">
            <Link
              href="/admin?tab=orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Back to Customer Care Hub</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
