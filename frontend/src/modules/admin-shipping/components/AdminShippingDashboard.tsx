"use client";

import React, { useState } from "react";
import { ShipmentListTable } from "./ShipmentListTable";
import { AdminLogisticsDashboard } from "./AdminLogisticsDashboard";
import { TruckIcon, TableCellsIcon } from "@heroicons/react/24/outline";
import { useAdminLogisticsStats } from "@/core/hooks/useAdminDashboard";

export const AdminShippingDashboard = () => {
  const [activeTab, setActiveTab] = useState<"intake" | "shipments">("intake");
  const { data: stats, isLoading } = useAdminLogisticsStats();

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Shipping Portal Header & Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            Logistics &amp; Courier Fulfillment
          </h1>

        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("intake")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === "intake"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TruckIcon className="w-4 h-4 text-brand" />
            <span>Orders to Dispatch</span>
          </button>
          
          <button
            onClick={() => setActiveTab("shipments")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === "shipments"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TableCellsIcon className="w-4 h-4 text-slate-600" />
            <span>Carrier Shipments</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Dispatch & Packing Queue */}
      {activeTab === "intake" && (
        <div className="animate-in fade-in duration-200">
          <AdminLogisticsDashboard />
        </div>
      )}

      {/* Tab 2: Courier Shipments Register & Sync */}
      {activeTab === "shipments" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          
          {/* Quick Carrier Operational Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 border border-slate-200 shadow-sm rounded-xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Fulfillment</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono">
                {isLoading ? "..." : stats?.overallPipeline?.pendingPacking ?? 0}
              </span>
            </div>
            <div className="bg-white p-3 border border-slate-200 shadow-sm rounded-xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Transit</span>
              <span className="text-xl sm:text-2xl font-black text-blue-600 mt-1 font-mono">
                {isLoading ? "..." : stats?.overallPipeline?.inTransit ?? 0}
              </span>
            </div>
            <div className="bg-white p-3 border border-slate-200 shadow-sm rounded-xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivered Today</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 font-mono">
                {isLoading ? "..." : stats?.overallPipeline?.deliveredToday ?? 0}
              </span>
            </div>
            <div className="bg-white p-3 border border-slate-200 shadow-sm rounded-xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NDR / Exceptions</span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 mt-1 font-mono">
                {isLoading ? "..." : stats?.overallPipeline?.exceptions ?? 0}
              </span>
            </div>
          </div>

          {/* Main Shipment Table */}
          <ShipmentListTable />
          
        </div>
      )}

    </div>
  );
};
