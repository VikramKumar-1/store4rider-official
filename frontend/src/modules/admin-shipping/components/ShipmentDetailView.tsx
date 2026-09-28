"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeftIcon, DocumentTextIcon, ArrowPathIcon, CheckCircleIcon, TruckIcon } from "@heroicons/react/24/outline";
import { useAdminShipmentById, useSyncTracking } from "@/core/hooks/useAdminShipments";

interface Props {
  shipmentId: string;
}

export function ShipmentDetailView({ shipmentId }: Props) {
  const { data: shipment, isLoading, isError } = useAdminShipmentById(shipmentId);
  const syncMutation = useSyncTracking();

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-slate-100 rounded w-1/4" />
        <div className="h-40 bg-slate-100 rounded" />
        <div className="h-64 bg-slate-100 rounded" />
      </div>
    );
  }

  if (isError || !shipment) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200">
          Failed to load shipment details.
        </div>
      </div>
    );
  }

  const events = shipment.events || [];
  
  // Sort events newest first for the timeline
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleSync = () => {
    syncMutation.mutate(shipmentId);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-slate-100 text-slate-800",
    shipment_created: "bg-blue-100 text-blue-800",
    awb_assigned: "bg-indigo-100 text-indigo-800",
    ready_to_ship: "bg-purple-100 text-purple-800",
    picked_up: "bg-yellow-100 text-yellow-800",
    in_transit: "bg-orange-100 text-orange-800",
    out_for_delivery: "bg-teal-100 text-teal-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    failed: "bg-red-100 text-red-800",
    rto_initiated: "bg-rose-100 text-rose-800",
  };

  const badgeColor = statusColors[shipment.status] || "bg-slate-100 text-slate-800";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/shipping" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              Shipment Details
              <span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider ${badgeColor}`}>
                {shipment.status.replace(/_/g, " ")}
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Order #{shipment.orderId} • Created on {shipment.createdAt ? format(new Date(shipment.createdAt), "MMM d, yyyy") : "N/A"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? "Syncing..." : "Sync Tracking"}
          </button>

          {shipment.labelUrl && (
            <button 
              onClick={() => window.open(shipment.labelUrl, "_blank")}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded text-sm font-bold shadow-sm hover:bg-red-800 transition-colors"
            >
              <DocumentTextIcon className="w-4 h-4" />
              Print Label
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Tracking Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <TruckIcon className="w-5 h-5 text-slate-400" />
              <h2 className="font-bold text-slate-800">Tracking Timeline</h2>
            </div>
            
            <div className="p-6">
              {sortedEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No tracking events recorded yet.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
                  {sortedEvents.map((ev, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={idx} className="relative pl-6">
                        {/* Dot */}
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${isLatest ? 'bg-brand' : 'bg-slate-300'}`} />
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-bold uppercase tracking-wider ${isLatest ? 'text-slate-900' : 'text-slate-600'}`}>
                              {ev.status.replace(/_/g, " ")}
                            </h3>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {format(new Date(ev.timestamp), "MMM d, yyyy • h:mm a")}
                            </span>
                          </div>
                          {ev.location && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              Location: <span className="font-medium text-slate-700">{ev.location}</span>
                            </p>
                          )}
                          {ev.description && (
                            <p className="text-xs text-slate-500 mt-1 italic">
                              "{ev.description}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Info Cards */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase">Courier Info</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provider</span>
                <span className="text-sm font-medium text-slate-900 capitalize">{shipment.provider}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Courier Name</span>
                <span className="text-sm font-medium text-slate-900 capitalize">{shipment.courierName || 'Pending'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tracking AWB</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-sm font-bold text-brand">{shipment.awb || 'Pending'}</span>
                  {shipment.awb && (
                    <button 
                      onClick={() => navigator.clipboard.writeText(shipment.awb!)}
                      className="text-xs text-slate-400 hover:text-brand"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Delivery</span>
                <span className="text-sm font-medium text-slate-900">
                  {shipment.estimatedDeliveryDate ? format(new Date(shipment.estimatedDeliveryDate), "MMM d, yyyy") : 'Not Available'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase">Package Details</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight</span>
                <span className="text-sm font-medium text-slate-900">{shipment.weight} kg</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dimensions</span>
                <span className="text-sm font-medium text-slate-900">
                  {shipment.length} × {shipment.breadth} × {shipment.height} cm
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shipment Type</span>
                <span className="text-sm font-medium text-slate-900 capitalize">{shipment.shipmentType}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
