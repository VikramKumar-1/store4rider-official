"use client";

import React, { useState, useEffect } from "react";
import { 
  XMarkIcon, 
  CubeIcon, 
  TruckIcon, 
  DocumentTextIcon, 
  ArrowPathIcon,
  BuildingStorefrontIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { useAdminOrderById } from "@/core/hooks/useOrderById";
import { 
  usePushToShiprocket, 
  useCreateDirectShipment, 
  useRequestPickup 
} from "@/core/hooks/useAdminShipments";
import { useWarehouses } from "@/core/hooks/useWarehouses";

interface OrderFulfillmentPanelProps {
  orderId: string;
  onClose: () => void;
}

type ShippingMethod = "shiprocket" | "delhivery" | "xpressbees";

export const OrderFulfillmentPanel: React.FC<OrderFulfillmentPanelProps> = ({ orderId, onClose }) => {
  const { data: order, isLoading: isOrderLoading } = useAdminOrderById(orderId);
  const { data: warehouses, isLoading: isWarehousesLoading } = useWarehouses();

  const pushShiprocketMutation = usePushToShiprocket();
  const directShipmentMutation = useCreateDirectShipment();
  const requestPickupMutation = useRequestPickup();

  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod>("shiprocket");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [dimensions, setDimensions] = useState({ length: "15", breadth: "15", height: "10", weightKg: "1.0" });
  const [createdShipment, setCreatedShipment] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-calculate weight from order items
  useEffect(() => {
    if (order && order.items) {
      let totalWeight = 0;
      order.items.forEach((item: any) => {
        const itemWeight = item.product?.weight || 0.5;
        totalWeight += itemWeight * item.quantity;
      });
      if (totalWeight > 0) {
        setDimensions((prev) => ({ ...prev, weightKg: Number(totalWeight.toFixed(2)).toString() }));
      }
    }
  }, [order]);

  // Set default warehouse when warehouses load
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !selectedWarehouseId) {
      const defaultWh = warehouses.find((w: any) => w.isDefault) || warehouses[0];
      setSelectedWarehouseId(defaultWh.id || String(defaultWh._id));
    }
  }, [warehouses, selectedWarehouseId]);

  const handlePushToShiprocket = () => {
    setErrorMessage(null);
    pushShiprocketMutation.mutate({ orderId, warehouseId: selectedWarehouseId }, {
      onSuccess: (data) => {
        setCreatedShipment({
          ...data,
          courierName: "Shiprocket (Dashboard Managed)",
          awb: data.awb || "Pending Assignment in Shiprocket",
          labelUrl: data.labelUrl,
          isShiprocketDashboard: true,
        });
      },
      onError: (err: any) => {
        setErrorMessage(err.response?.data?.message || err.message || "Failed to push order to Shiprocket");
      },
    });
  };

  const handleDispatchDirect = (provider: "delhivery" | "xpressbees") => {
    setErrorMessage(null);
    if (!selectedWarehouseId) {
      setErrorMessage("Please select a dispatch warehouse.");
      return;
    }

    directShipmentMutation.mutate(
      {
        orderId,
        provider,
        warehouseId: selectedWarehouseId,
        weightKg: Number(dimensions.weightKg) || 1,
        length: Number(dimensions.length) || 15,
        breadth: Number(dimensions.breadth) || 15,
        height: Number(dimensions.height) || 10,
      },
      {
        onSuccess: (data) => {
          setCreatedShipment(data);
        },
        onError: (err: any) => {
          setErrorMessage(err.response?.data?.message || err.message || `Failed to dispatch via ${provider}`);
        },
      }
    );
  };

  const handleRequestPickup = () => {
    if (createdShipment && (createdShipment.id || createdShipment._id)) {
      requestPickupMutation.mutate(createdShipment.id || createdShipment._id);
    }
  };

  const isPending = 
    pushShiprocketMutation.isPending || 
    directShipmentMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight">
              Fulfill Order #{order?.orderNumber || orderId}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 rounded transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          
          {isOrderLoading ? (
            <div className="animate-pulse flex flex-col gap-4">
              <div className="h-24 bg-neutral-100 w-full rounded" />
              <div className="h-40 bg-neutral-100 w-full rounded" />
            </div>
          ) : !order ? (
            <div className="text-red-500 text-center py-10 font-bold">Order not found.</div>
          ) : createdShipment ? (
            /* SUCCESS VIEW */
            <div className="flex flex-col items-center text-center py-8 gap-6 animate-in fade-in zoom-in-95">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                <CheckBadgeIcon className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-neutral-900 uppercase">
                  {createdShipment.isShiprocketDashboard ? "Sent to Shiprocket!" : "Shipment Dispatched!"}
                </h3>
                <p className="text-neutral-500 mt-2 text-sm max-w-md">
                  {createdShipment.isShiprocketDashboard
                    ? "Order is now in your Shiprocket Dashboard. You can select your pickup location (Kolkata/Pune), review package weight, and generate the label in Shiprocket."
                    : "The shipment has been successfully created and linked to the order."}
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 p-5 w-full text-left rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-neutral-500 uppercase">Tracking AWB</span>
                    <p className="font-mono text-base font-bold text-neutral-900 mt-0.5">{createdShipment.awb || "Pending"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-500 uppercase">Courier / Gateway</span>
                    <p className="text-base font-bold text-neutral-900 capitalize mt-0.5">{createdShipment.courierName || createdShipment.provider}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full mt-2">
                {createdShipment.labelUrl && (
                  <button
                    onClick={() => window.open(createdShipment.labelUrl, "_blank")}
                    className="flex-1 py-3 bg-white border border-neutral-300 text-neutral-700 font-bold text-sm uppercase flex justify-center items-center gap-2 hover:bg-neutral-50 transition-colors rounded"
                  >
                    <DocumentTextIcon className="w-5 h-5" /> Print Label
                  </button>
                )}
                {!createdShipment.isShiprocketDashboard && (
                  <button
                    onClick={handleRequestPickup}
                    disabled={requestPickupMutation.isPending || createdShipment.pickupStatus === "SCHEDULED"}
                    className="flex-1 py-3 bg-brand text-white font-bold text-sm uppercase hover:bg-red-800 transition-colors disabled:opacity-50 rounded"
                  >
                    {requestPickupMutation.isPending ? "Requesting..." : 
                     createdShipment.pickupStatus === "SCHEDULED" ? "Pickup Scheduled" : "Request Pickup"}
                  </button>
                )}
                {createdShipment.isShiprocketDashboard && (
                  <a
                    href="https://app.shiprocket.in/orders"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-orange-600 text-white font-bold text-sm uppercase flex justify-center items-center gap-2 hover:bg-orange-700 transition-colors rounded"
                  >
                    Open Shiprocket Dashboard ↗
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* FULFILLMENT FORM VIEW */
            <>
              {/* Order Summary Snapshot */}
              <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 font-bold block">Customer</span>
                    <span className="text-sm font-semibold text-neutral-900">{order.shippingAddress?.fullName} ({order.shippingAddress?.phone})</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 font-bold block">Delivery Pincode</span>
                    <span className="text-sm font-semibold text-neutral-900">{order.shippingAddress?.pincode} — {order.shippingAddress?.city}, {order.shippingAddress?.state}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase text-neutral-400 font-bold block">Items to Pack</span>
                    <div className="text-xs text-neutral-700 mt-1 font-medium">
                      {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(" • ")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded">
                  {errorMessage}
                </div>
              )}

              {/* Shipping Gateway Method Selection */}
              <div>
                <label className="text-xs font-black uppercase text-neutral-700 tracking-wider block mb-3">
                  Choose Shipping Gateway & Method
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Method 1: Shiprocket */}
                  <label className={`border rounded-lg p-3.5 cursor-pointer flex items-start gap-3 transition-colors ${selectedMethod === "shiprocket" ? "border-brand bg-orange-50/20 shadow-sm" : "border-neutral-200 hover:border-neutral-300"}`}>
                    <input 
                      type="radio" 
                      name="shippingMethod" 
                      checked={selectedMethod === "shiprocket"} 
                      onChange={() => setSelectedMethod("shiprocket")}
                      className="mt-0.5 accent-brand"
                    />
                    <div>
                      <span className="font-bold text-sm text-neutral-900 block">Shiprocket</span>
                      <span className="text-[11px] text-neutral-500 leading-snug block mt-0.5">
                        Push order to Shiprocket. Select warehouse & courier in Shiprocket.
                      </span>
                    </div>
                  </label>

                  {/* Method 2: Delhivery Direct */}
                  <label className={`border rounded-lg p-3.5 cursor-pointer flex items-start gap-3 transition-colors ${selectedMethod === "delhivery" ? "border-brand bg-orange-50/20 shadow-sm" : "border-neutral-200 hover:border-neutral-300"}`}>
                    <input 
                      type="radio" 
                      name="shippingMethod" 
                      checked={selectedMethod === "delhivery"} 
                      onChange={() => setSelectedMethod("delhivery")}
                      className="mt-0.5 accent-brand"
                    />
                    <div>
                      <span className="font-bold text-sm text-neutral-900 block">Delhivery Direct</span>
                      <span className="text-[11px] text-neutral-500 leading-snug block mt-0.5">
                        Direct API dispatch. Select warehouse & print label directly.
                      </span>
                    </div>
                  </label>

                  {/* Method 3: Xpressbees Direct */}
                  <label className={`border rounded-lg p-3.5 cursor-pointer flex items-start gap-3 transition-colors ${selectedMethod === "xpressbees" ? "border-brand bg-orange-50/20 shadow-sm" : "border-neutral-200 hover:border-neutral-300"}`}>
                    <input 
                      type="radio" 
                      name="shippingMethod" 
                      checked={selectedMethod === "xpressbees"} 
                      onChange={() => setSelectedMethod("xpressbees")}
                      className="mt-0.5 accent-brand"
                    />
                    <div>
                      <span className="font-bold text-sm text-neutral-900 block">Xpressbees Direct</span>
                      <span className="text-[11px] text-neutral-500 leading-snug block mt-0.5">
                        Direct API dispatch via Xpressbees surface/express.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* DYNAMIC FORM SECTION BASED ON SELECTED METHOD */}

              {/* SECTION: SHIPROCKET */}
              {selectedMethod === "shiprocket" && (
                <div className="border border-neutral-200 rounded-lg p-5 bg-neutral-50 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-black">
                      SR
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900">Shiprocket Dashboard Fulfillment</h4>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Push order to your Shiprocket account and manage dispatch directly in Shiprocket.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-neutral-200 rounded p-4 text-xs text-neutral-600 leading-relaxed flex flex-col gap-2">
                    <p>• Order details (Customer address, items, payment mode: <b>{order.paymentMethod.toUpperCase()}</b>) will sync to Shiprocket.</p>
                    <p>• <b>Warehouse Selection:</b> In your Shiprocket Dashboard (<b>app.shiprocket.in</b>), open this order, click <b>Ship Now</b>, and pick your Dispatch Warehouse / Pickup Location (e.g. Kolkata Hub, Mumbai, Pune).</p>
                    <p>• <b>Auto-Sync:</b> Once dispatched in Shiprocket, our webhook automatically detects your chosen warehouse, updates the order tracking, and aligns the Tax Invoice PDF (Intra-State vs Inter-State GST).</p>
                  </div>

                  {/* Optional Default Hint */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                      Initial Pickup Location Hint (Optional Default)
                    </label>
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:border-brand focus:outline-none"
                    >
                      {warehouses?.map((wh: any) => (
                        <option key={wh.id || String(wh._id)} value={wh.id || String(wh._id)}>
                          {wh.name} — {wh.city}, {wh.state} ({wh.pincode}) {wh.isDefault ? "[Default]" : ""} {wh.shiprocketLocationId ? `• Pickup: ${wh.shiprocketLocationId}` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Initial default passed to Shiprocket API. You can change this to any warehouse directly in your Shiprocket Dashboard.
                    </p>
                  </div>

                  <button
                    onClick={handlePushToShiprocket}
                    disabled={isPending}
                    className="w-full py-3.5 bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" /> Pushing to Shiprocket...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-4 h-4" /> Send Order to Shiprocket Dashboard
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* SECTION: DELHIVERY OR XPRESSBEES DIRECT */}
              {(selectedMethod === "delhivery" || selectedMethod === "xpressbees") && (
                <div className="border border-neutral-200 rounded-lg p-5 bg-white flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <BuildingStorefrontIcon className="w-5 h-5 text-neutral-500" />
                    <h4 className="font-bold text-sm text-neutral-900 capitalize">
                      {selectedMethod} Direct Dispatch
                    </h4>
                  </div>

                  {/* Warehouse Selection */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                      Dispatch Origin Warehouse (Godown)
                    </label>
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:border-brand focus:outline-none"
                    >
                      {warehouses?.map((wh: any) => (
                        <option key={wh.id || String(wh._id)} value={wh.id || String(wh._id)}>
                          {wh.name} — {wh.city} ({wh.pincode}) {wh.isDefault ? "[Default]" : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      The courier will pickup from this warehouse address.
                    </p>
                  </div>

                  {/* Weight & Dimensions */}
                  <div className="grid grid-cols-4 gap-3 pt-2 border-t border-neutral-100">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase">Weight (kg)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        value={dimensions.weightKg}
                        onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault(); }}
                        onChange={(e) => setDimensions((d) => ({ ...d, weightKg: e.target.value === "" ? "" : (Number(e.target.value) < 0 ? "0" : e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase">Length (cm)</label>
                      <input
                        type="number"
                        min={0}
                        value={dimensions.length}
                        onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault(); }}
                        onChange={(e) => setDimensions((d) => ({ ...d, length: e.target.value === "" ? "" : (Number(e.target.value) < 0 ? "0" : e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase">Breadth (cm)</label>
                      <input
                        type="number"
                        min={0}
                        value={dimensions.breadth}
                        onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault(); }}
                        onChange={(e) => setDimensions((d) => ({ ...d, breadth: e.target.value === "" ? "" : (Number(e.target.value) < 0 ? "0" : e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase">Height (cm)</label>
                      <input
                        type="number"
                        min={0}
                        value={dimensions.height}
                        onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault(); }}
                        onChange={(e) => setDimensions((d) => ({ ...d, height: e.target.value === "" ? "" : (Number(e.target.value) < 0 ? "0" : e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleDispatchDirect(selectedMethod as any)}
                    disabled={isPending || !selectedWarehouseId}
                    className="w-full py-3.5 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {isPending ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" /> Generating AWB...
                      </>
                    ) : (
                      <>
                        <TruckIcon className="w-4 h-4" /> Generate {selectedMethod.toUpperCase()} AWB & Label
                      </>
                    )}
                  </button>
                </div>
              )}

            </>
          )}

        </div>
      </div>
    </div>
  );
};
