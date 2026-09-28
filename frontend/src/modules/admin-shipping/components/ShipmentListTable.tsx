"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { useAdminShipments, useSyncTracking } from "@/core/hooks/useAdminShipments";
import { IShipment } from "@store4riders/shared-types";
import { MagnifyingGlassIcon, ArrowPathIcon, DocumentTextIcon, EyeIcon } from "@heroicons/react/24/outline";

export const ShipmentListTable = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading } = useAdminShipments({
    page,
    limit: 10,
    search: debouncedSearch,
    status: statusFilter,
    provider: providerFilter
  });

  const syncMutation = useSyncTracking();

  const handleSync = (shipmentId: string) => {
    syncMutation.mutate(shipmentId);
  };

  const handlePrintLabel = (labelUrl?: string) => {
    if (labelUrl) {
      window.open(labelUrl, "_blank");
    } else {
      alert("Label URL not available for this shipment yet.");
    }
  };

  return (
    <div className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
      {/* Filters Bar */}
      <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <MagnifyingGlassIcon className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order ID or AWB..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-brand"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={providerFilter} 
            onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
            className="border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand w-full md:w-40 bg-white"
          >
            <option value="">All Providers</option>
            <option value="shiprocket">Shiprocket</option>
            <option value="delhivery">Delhivery</option>
            <option value="xpressbees">Xpressbees</option>
          </select>
          
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand w-full md:w-40 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="ready_to_ship">Ready to Ship</option>
            <option value="shipped">Shipped</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="rto_initiated">RTO Initiated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-100 text-xs uppercase tracking-wider text-neutral-600 font-bold border-b border-neutral-200">
              <th className="p-4">Order / ID</th>
              <th className="p-4">Provider & Courier</th>
              <th className="p-4">AWB</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-500 animate-pulse">
                  Loading shipments...
                </td>
              </tr>
            ) : data?.items?.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-500">
                  No shipments found matching your filters.
                </td>
              </tr>
            ) : (
              data?.items?.map((shipment: IShipment) => (
                <tr key={shipment.id || String(shipment._id)} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4 align-top">
                    <span className="font-bold text-neutral-900 block">{shipment.orderId.slice(-8).toUpperCase()}</span>
                    <span className="text-xs text-neutral-500">{shipment.shipmentType === "forward" ? "Forward" : "Reverse"}</span>
                  </td>
                  <td className="p-4 align-top">
                    <span className="block font-semibold capitalize text-brand">{shipment.provider}</span>
                    <span className="text-xs text-neutral-600">{shipment.courierName || "Assigning..."}</span>
                  </td>
                  <td className="p-4 align-top">
                    <span className="font-mono bg-neutral-100 px-2 py-1 rounded text-xs">{shipment.awb || "Pending"}</span>
                  </td>
                  <td className="p-4 align-top">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      shipment.status === "delivered" ? "bg-green-100 text-green-700" :
                      ["rto_initiated", "cancelled", "failed"].includes(shipment.status) ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {shipment.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 align-top text-xs text-neutral-600">
                    {format(new Date(shipment.createdAt || new Date()), "dd MMM yyyy, HH:mm")}
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleSync(shipment.id || String(shipment._id))}
                        disabled={syncMutation.isPending}
                        className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors tooltip-trigger"
                        title="Sync Tracking"
                      >
                        <ArrowPathIcon className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                      </button>
                      <button 
                        onClick={() => handlePrintLabel(shipment.labelUrl)}
                        className="p-1.5 text-neutral-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Print Label"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 text-neutral-500 hover:text-brand hover:bg-orange-50 rounded transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {data?.total > 0 && (
        <div className="p-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
          <span className="text-xs text-neutral-500">
            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, data.total)} of {data.total} entries
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 border border-neutral-300 bg-white rounded text-xs font-bold disabled:opacity-50"
            >
              PREV
            </button>
            <span className="text-xs font-bold px-2">{page}</span>
            <button 
              disabled={page * 10 >= data.total}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-neutral-300 bg-white rounded text-xs font-bold disabled:opacity-50"
            >
              NEXT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
