import React from "react";
import { format } from "date-fns";
import { ITrackingEvent, ShipmentStatus } from "@store4riders/shared-types";
import { 
  CheckCircleIcon, 
  MapPinIcon, 
  TruckIcon, 
  ArchiveBoxIcon, 
  HomeIcon,
  XCircleIcon
} from "@heroicons/react/24/solid";

interface TrackingTimelineProps {
  events: ITrackingEvent[];
  currentStatus: ShipmentStatus;
  orderCreatedAt: string | Date;
}

const MILESTONES = [
  { status: "pending", label: "Order Confirmed", icon: ArchiveBoxIcon },
  { status: "shipped", label: "Shipped", icon: TruckIcon },
  { status: "out_for_delivery", label: "Out for Delivery", icon: MapPinIcon },
  { status: "delivered", label: "Delivered", icon: HomeIcon },
];

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ events, currentStatus, orderCreatedAt }) => {
  // Determine the highest achieved milestone index
  let currentMilestoneIndex = 0;
  if (["delivered"].includes(currentStatus)) currentMilestoneIndex = 3;
  else if (["out_for_delivery"].includes(currentStatus)) currentMilestoneIndex = 2;
  else if (["shipped", "picked_up", "in_transit"].includes(currentStatus)) currentMilestoneIndex = 1;

  const isCancelledOrRTO = ["cancelled", "rto_initiated", "rto_in_transit", "rto_delivered"].includes(currentStatus);

  const sortedEvents = [...(events || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full">
      
      {/* Visual Milestones */}
      <div className="w-full lg:w-1/3 flex flex-col gap-0 border border-neutral-200 shadow-sm p-4 md:p-6 bg-white h-fit">
        <h3 className="font-sans font-bold text-lg text-neutral-900 uppercase tracking-tight mb-6">
          Delivery Status
        </h3>
        <div className="flex flex-col relative">
          {isCancelledOrRTO ? (
            <div className="flex gap-4 relative pb-8">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 z-10">
                  <XCircleIcon className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="flex flex-col pt-1">
                <span className="font-bold text-sm text-red-600 uppercase">
                  {currentStatus.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-neutral-500">Your order has been cancelled/returned.</span>
              </div>
            </div>
          ) : (
            MILESTONES.map((milestone, index) => {
              const isAchieved = index <= currentMilestoneIndex;
              const isCurrent = index === currentMilestoneIndex;
              const Icon = milestone.icon;
              const isLast = index === MILESTONES.length - 1;

              return (
                <div key={milestone.status} className="flex gap-4 relative pb-8">
                  {/* Vertical Line */}
                  {!isLast && (
                    <div 
                      className={`absolute left-4 top-8 bottom-0 w-[2px] -ml-px ${
                        index < currentMilestoneIndex ? "bg-green-500" : "bg-neutral-200 border-dashed"
                      }`}
                    />
                  )}
                  
                  {/* Icon Node */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                        isAchieved ? (isCurrent ? "bg-brand text-white shadow-sm ring-4 ring-brand/10" : "bg-green-500 text-white") : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      {isAchieved && !isCurrent ? <CheckCircleIcon className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Text */}
                  <div className={`flex flex-col pt-1 ${isAchieved ? "opacity-100" : "opacity-40"}`}>
                    <span className={`font-bold text-sm uppercase ${isCurrent ? "text-brand" : "text-neutral-900"}`}>
                      {milestone.label}
                    </span>
                    {index === 0 && (
                      <span className="text-xs text-neutral-500 font-medium">
                        {format(new Date(orderCreatedAt), "MMM dd, yyyy - hh:mm a")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detailed Tracking Events */}
      <div className="w-full lg:w-2/3 border border-neutral-200 shadow-sm p-4 md:p-6 bg-white">
        <h3 className="font-sans font-bold text-lg text-neutral-900 uppercase tracking-tight mb-6">
          Tracking History
        </h3>
        
        {sortedEvents.length === 0 ? (
          <div className="text-sm text-neutral-500 py-4 italic">
            Detailed tracking events will appear here once the courier updates the status.
          </div>
        ) : (
          <div className="flex flex-col gap-6 relative">
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-neutral-200" />
            
            {sortedEvents.map((event, idx) => (
              <div key={idx} className="flex gap-4 relative">
                <div className="mt-1.5 w-5 h-5 rounded-full bg-white border-[3px] border-neutral-300 z-10 shrink-0" />
                <div className="flex flex-col bg-neutral-50 border border-neutral-100 p-3 w-full group hover:border-neutral-200 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-bold text-sm text-neutral-900 capitalize">
                      {event.status.toLowerCase().replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] font-bold text-neutral-500 uppercase shrink-0 whitespace-nowrap bg-white px-2 py-0.5 border border-neutral-200">
                      {format(new Date(event.timestamp), "dd MMM, hh:mm a")}
                    </span>
                  </div>
                  {(event.activity || event.description) && (
                    <p className="text-xs text-neutral-600 mt-1 font-medium">{event.activity || event.description}</p>
                  )}
                  {event.location && (
                    <p className="text-[11px] text-neutral-500 mt-1 uppercase flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3" /> {event.location}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
