"use client";

import React, { useState } from "react";
import { ShipmentListTable } from "./ShipmentListTable";
import { WarehouseManager } from "./WarehouseManager";
import { TruckIcon, HomeModernIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export const AdminShippingDashboard = () => {
  const [activeTab, setActiveTab] = useState<"shipments" | "warehouses">("shipments");

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight">Shipping & Fulfillment</h1>
          <p className="text-sm text-neutral-500 font-medium mt-1">Manage orders, dispatch packages, and track couriers.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("shipments")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "shipments" ? "border-brand text-brand" : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <TruckIcon className="w-5 h-5" />
          Shipments
        </button>
        <button
          onClick={() => setActiveTab("warehouses")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "warehouses" ? "border-brand text-brand" : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <HomeModernIcon className="w-5 h-5" />
          Warehouses
        </button>
      </div>

      {/* Content Area */}
      {activeTab === "shipments" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          
          {/* Quick Stats (Awaiting real backend stats API - defaulting to 0 to avoid mocks) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 border border-neutral-200 shadow-sm rounded-lg flex flex-col">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Pending Fulfillment</span>
              <span className="text-2xl font-black text-neutral-900 mt-1">0</span>
            </div>
            <div className="bg-white p-4 border border-neutral-200 shadow-sm rounded-lg flex flex-col">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">In Transit</span>
              <span className="text-2xl font-black text-blue-600 mt-1">0</span>
            </div>
            <div className="bg-white p-4 border border-neutral-200 shadow-sm rounded-lg flex flex-col">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Delivered (30d)</span>
              <span className="text-2xl font-black text-green-600 mt-1">0</span>
            </div>
            <div className="bg-white p-4 border border-neutral-200 shadow-sm rounded-lg flex flex-col">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">RTO / Issues</span>
              <span className="text-2xl font-black text-red-600 mt-1">0</span>
            </div>
          </div>

          {/* Main Table */}
          <ShipmentListTable />
          
        </div>
      )}

      {activeTab === "warehouses" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <WarehouseManager />
        </div>
      )}

    </div>
  );
};
