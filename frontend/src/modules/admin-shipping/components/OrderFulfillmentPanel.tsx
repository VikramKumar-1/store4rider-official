"use client";

import React, { useState, useEffect, useMemo } from "react";
import { XMarkIcon, CubeIcon, TruckIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { useAdminOrderById } from "@/core/hooks/useOrderById";
import { useShipmentRates, useCreateShipment, useRequestPickup } from "@/core/hooks/useAdminShipments";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatPrice } from "@store4riders/shared-utils";

interface OrderFulfillmentPanelProps {
  orderId: string;
  onClose: () => void;
}

export const OrderFulfillmentPanel: React.FC<OrderFulfillmentPanelProps> = ({ orderId, onClose }) => {
  const { data: order, isLoading: isOrderLoading } = useAdminOrderById(orderId);
  const getRatesMutation = useShipmentRates();
  const createShipmentMutation = useCreateShipment();
  const requestPickupMutation = useRequestPickup();

  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const res = await apiClient.get("/settings/public");
      return res.data.data;
    }
  });

  const [dimensions, setDimensions] = useState({ length: "", breadth: "", height: "", weightKg: "" });
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [createdShipment, setCreatedShipment] = useState<any>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  // Auto-calculate weight when order loads (Sum of real product weights only)
  useEffect(() => {
    if (order && order.items) {
      let totalWeight = 0;
      let hasMissingWeight = false;

      order.items.forEach(item => {
        if ((item as any).product?.weight) {
          totalWeight += (item as any).product.weight * item.quantity;
        } else {
          hasMissingWeight = true;
        }
      });

      // If we have a calculated weight, pre-fill it. If missing, leave blank so staff MUST weigh it.
      if (totalWeight > 0) {
        setDimensions(prev => ({ ...prev, weightKg: Number(totalWeight.toFixed(2)).toString() }));
      }
    }
  }, [order]);

  const handleGetRates = () => {
    getRatesMutation.mutate({
      orderId,
      weightKg: Number(dimensions.weightKg),
      length: Number(dimensions.length),
      breadth: Number(dimensions.breadth),
      height: Number(dimensions.height),
      isCod: order?.paymentMethod === "cod"
    }, {
      onSuccess: (rates) => {
        if (rates && rates.length > 0) {
          // Auto-select cheapest
          const cheapest = [...rates].sort((a, b) => a.rate - b.rate)[0];
          setSelectedProvider(cheapest.provider);
        }
      }
    });
  };

  const handleCreateShipment = () => {
    if (!selectedProvider) return;
    createShipmentMutation.mutate({
      orderId,
      provider: selectedProvider,
      weight: Number(dimensions.weightKg),
      length: Number(dimensions.length),
      breadth: Number(dimensions.breadth),
      height: Number(dimensions.height)
    }, {
      onSuccess: (data) => {
        setCreatedShipment(data);
      }
    });
  };

  const handleRequestPickup = () => {
    if (createdShipment && (createdShipment.id || createdShipment._id)) {
      requestPickupMutation.mutate(createdShipment.id || createdShipment._id);
    }
  };

  // Sort rates for display
  const sortedRates = useMemo(() => {
    if (!getRatesMutation.data) return [];
    return [...getRatesMutation.data].sort((a, b) => a.rate - b.rate);
  }, [getRatesMutation.data]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-brand" />
            Fulfill Order
          </h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 rounded transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
          
          {isOrderLoading ? (
            <div className="animate-pulse flex flex-col gap-4">
              <div className="h-24 bg-neutral-100 w-full" />
              <div className="h-40 bg-neutral-100 w-full" />
            </div>
          ) : !order ? (
            <div className="text-red-500 text-center py-10">Order not found.</div>
          ) : createdShipment ? (
            /* SUCCESS VIEW */
            <div className="flex flex-col items-center text-center py-12 gap-6 animate-in fade-in zoom-in-95">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                <CheckBadgeIcon className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-neutral-900 uppercase">Shipment Created!</h3>
                <p className="text-neutral-500 mt-2">The order has been successfully assigned to a courier.</p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 p-6 w-full text-left rounded-lg mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-neutral-500 uppercase">Tracking AWB</span>
                    <p className="font-mono text-lg font-bold text-neutral-900">{createdShipment.awb || "Pending"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-500 uppercase">Courier</span>
                    <p className="text-lg font-bold text-neutral-900 capitalize">{createdShipment.courierName || createdShipment.provider}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full mt-4">
                <button
                  onClick={() => createdShipment.labelUrl ? window.open(createdShipment.labelUrl) : alert("Label not available yet")}
                  className="flex-1 py-3 bg-white border border-neutral-300 text-neutral-700 font-bold text-sm uppercase flex justify-center items-center gap-2 hover:bg-neutral-50 transition-colors"
                >
                  <DocumentTextIcon className="w-5 h-5" /> Print Label
                </button>
                <button
                  onClick={handleRequestPickup}
                  disabled={requestPickupMutation.isPending || createdShipment.status === "ready_to_ship"}
                  className="flex-1 py-3 bg-brand text-white font-bold text-sm uppercase hover:bg-red-800 transition-colors disabled:opacity-50"
                >
                  {requestPickupMutation.isPending ? "Requesting..." : 
                   createdShipment.status === "ready_to_ship" ? "Pickup Scheduled" : "Request Pickup"}
                </button>
              </div>
            </div>
          ) : (
            /* FULFILLMENT FORM VIEW */
            <>
              {/* Order Info */}
              <div className="border border-neutral-200 rounded p-4 bg-white">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Order Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 font-bold block">Order Number</span>
                    <span className="text-sm font-semibold text-neutral-900">{order.orderNumber || order.id || (order as any)._id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 font-bold block">Customer</span>
                    <span className="text-sm font-semibold text-neutral-900">{order.shippingAddress?.fullName || "Customer"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase text-neutral-400 font-bold block">Destination Pincode</span>
                    <span className="text-sm font-semibold text-neutral-900">{order.shippingAddress?.pincode} ({order.shippingAddress?.city})</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase text-neutral-400 font-bold block">Items ({order.items?.length || 0})</span>
                    <div className="text-sm text-neutral-600 line-clamp-2 mt-0.5">
                      {order.items?.map(i => `${i.quantity}x ${i.name || 'Product'}`).join(', ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Dimensions */}
              <div className="border border-neutral-200 rounded p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CubeIcon className="w-4 h-4 text-neutral-500" />
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Package Dimensions</h3>
                  </div>
                  
                  <select
                    value={selectedPreset}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedPreset(val);
                      if (val) {
                        const presetsList = settings?.packagePresets?.length > 0 ? settings.packagePresets : [
                          { name: "Small Box (Accessories)", length: 15, breadth: 15, height: 10 },
                          { name: "Medium Box (Jackets/Boots)", length: 30, breadth: 30, height: 15 },
                          { name: "Large Box (Helmets)", length: 40, breadth: 30, height: 30 }
                        ];
                        const preset = presetsList.find((p: any) => p.name === val);
                        if (preset) {
                          setDimensions(prev => ({ 
                            ...prev, 
                            length: preset.length.toString(), 
                            breadth: preset.breadth.toString(), 
                            height: preset.height.toString() 
                          }));
                        }
                      } else {
                        setDimensions(prev => ({ ...prev, length: "", breadth: "", height: "" }));
                      }
                    }}
                    className="text-xs border border-neutral-300 rounded px-2 py-1 bg-neutral-50 focus:outline-none focus:border-brand"
                  >
                    <option value="">Custom Size...</option>
                    {(settings?.packagePresets?.length > 0 ? settings.packagePresets : [
                      { name: "Small Box (Accessories)", length: 15, breadth: 15, height: 10 },
                      { name: "Medium Box (Jackets/Boots)", length: 30, breadth: 30, height: 15 },
                      { name: "Large Box (Helmets)", length: 40, breadth: 30, height: 30 }
                    ]).map((p: any) => (
                      <option key={p.name} value={p.name}>{p.name} ({p.length}x{p.breadth}x{p.height})</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 uppercase">Length (cm)</label>
                    <input type="number" min="1" value={dimensions.length} onChange={e => setDimensions(d => ({ ...d, length: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:border-brand" placeholder="e.g. 15" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 uppercase">Breadth (cm)</label>
                    <input type="number" min="1" value={dimensions.breadth} onChange={e => setDimensions(d => ({ ...d, breadth: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:border-brand" placeholder="e.g. 15" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 uppercase">Height (cm)</label>
                    <input type="number" min="1" value={dimensions.height} onChange={e => setDimensions(d => ({ ...d, height: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:border-brand" placeholder="e.g. 10" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 uppercase">Weight (kg)</label>
                    <input type="number" min="0.1" step="0.1" value={dimensions.weightKg} onChange={e => setDimensions(d => ({ ...d, weightKg: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:border-brand" placeholder="e.g. 1.5" />
                  </div>
                </div>
                
                <button 
                  onClick={handleGetRates}
                  disabled={getRatesMutation.isPending || !dimensions.length || !dimensions.breadth || !dimensions.height || !dimensions.weightKg}
                  className="w-full py-2.5 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {getRatesMutation.isPending ? "Fetching Rates..." : "Calculate Shipping Rates"}
                </button>
              </div>

              {/* Rates Comparison */}
              {getRatesMutation.isError && (
                <div className="bg-red-50 text-red-600 p-3 text-sm font-semibold border border-red-200 mt-4 rounded">
                  Failed to fetch shipping rates. Ensure warehouse address is configured correctly.
                </div>
              )}

              {getRatesMutation.isSuccess && sortedRates.length === 0 && (
                <div className="bg-orange-50 text-orange-700 p-4 text-sm font-semibold border border-orange-200 mt-4 rounded">
                  <strong className="block text-orange-800 mb-1">No courier rates found.</strong>
                  This usually happens because:
                  <ul className="list-disc ml-5 mt-2 font-normal text-xs">
                    <li>You have not entered your <b>Shiprocket / Delhivery API Keys</b> in Settings yet.</li>
                    <li>The destination pincode is incorrect or unserviceable.</li>
                    <li>The package weight/dimensions exceed courier limits.</li>
                  </ul>
                </div>
              )}

              {sortedRates.length > 0 && (
                <div className="border border-neutral-200 rounded bg-white overflow-hidden mt-4">
                  <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Available Couriers</h3>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 uppercase">Cheapest Auto-Selected</span>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {sortedRates.map((rate, idx) => {
                      const isSelected = selectedProvider === rate.provider;
                      const isCheapest = idx === 0;

                      return (
                        <label 
                          key={rate.provider + idx} 
                          className={`flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-orange-50/30 ${isSelected ? "bg-orange-50/50" : ""}`}
                        >
                          <div className="flex items-center gap-4">
                            <input 
                              type="radio" 
                              name="courier" 
                              checked={isSelected}
                              onChange={() => setSelectedProvider(rate.provider)}
                              className="w-4 h-4 text-brand accent-brand"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-neutral-900 capitalize flex items-center gap-2">
                                {rate.courierName || rate.provider}
                                {isCheapest && <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded uppercase">Cheapest</span>}
                              </span>
                              <span className="text-xs text-neutral-500">Provider: <span className="uppercase">{rate.provider}</span> • Est. Days: {rate.estimatedDays || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-lg text-brand block">{formatPrice(rate.rate)}</span>
                            {rate.codAvailable && <span className="text-[10px] font-bold text-neutral-500 uppercase">COD Available</span>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions (Only show if not yet created) */}
        {!createdShipment && (
          <div className="p-4 border-t border-neutral-200 bg-white">
            <button
              onClick={handleCreateShipment}
              disabled={!selectedProvider || createShipmentMutation.isPending}
              className="w-full py-4 bg-brand text-white font-black uppercase tracking-widest text-sm hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createShipmentMutation.isPending ? "Generating Shipment..." : "Generate Shipment & AWB"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
