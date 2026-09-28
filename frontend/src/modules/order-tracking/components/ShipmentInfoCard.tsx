import React, { useState } from "react";
import { format } from "date-fns";
import { IShipment } from "@store4riders/shared-types";
import { DocumentDuplicateIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";

interface ShipmentInfoCardProps {
  shipment: IShipment;
}

export const ShipmentInfoCard: React.FC<ShipmentInfoCardProps> = ({ shipment }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAwb = () => {
    if (shipment.awb) {
      navigator.clipboard.writeText(shipment.awb);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getProviderTrackingUrl = () => {
    // If provider provides a specific tracking URL we'd use it, otherwise fallback
    switch (shipment.provider) {
      case "shiprocket":
        return `https://store4riders.shiprocket.co/tracking/${shipment.awb}`;
      case "delhivery":
        return `https://www.delhivery.com/track/package/${shipment.awb}`;
      case "xpressbees":
        return `https://www.xpressbees.com/track?awb=${shipment.awb}`;
      default:
        return "#";
    }
  };

  const estimatedDelivery = shipment.events?.length 
    ? shipment.events[shipment.events.length - 1]?.timestamp 
    : undefined;

  return (
    <div className="bg-white border border-neutral-200 shadow-sm p-4 md:p-6 mb-6">
      <h3 className="font-sans font-bold text-lg text-neutral-900 uppercase tracking-tight mb-4 border-b border-neutral-100 pb-3">
        Shipment Details
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* AWB Number */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Tracking Number (AWB)</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-900">{shipment.awb || "Pending Assignment"}</span>
            {shipment.awb && (
              <button
                onClick={handleCopyAwb}
                className="text-neutral-400 hover:text-brand transition-colors p-1"
                title="Copy AWB"
              >
                {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Courier */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Courier Partner</span>
          <span className="text-sm font-semibold text-neutral-900">{shipment.courierName || "Assigning Courier..."}</span>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Current Status</span>
          <span className="text-sm font-semibold text-neutral-900 capitalize px-2 py-0.5 bg-neutral-100 rounded inline-flex w-fit">
            {shipment.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* External Link */}
        <div className="flex flex-col justify-end">
          {shipment.awb && (
            <a
              href={getProviderTrackingUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-brand hover:text-red-700 uppercase flex items-center gap-1.5 w-fit"
            >
              Track on Courier Website
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
