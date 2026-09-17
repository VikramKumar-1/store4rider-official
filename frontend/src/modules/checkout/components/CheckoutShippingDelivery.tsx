import React from "react";
import { formatPrice } from "@store4riders/shared-utils";

export interface CourierOption {
  id: string;
  name: string;
  logoText: string;
  badgeBg?: string;
  badgeText?: string;
  cost: number;
}

export const COURIER_OPTIONS: CourierOption[] = [
  {
    id: "delhivery",
    name: "JNE / Delhivery Surface",
    logoText: "DELHIVERY",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    cost: 49,
  },
  {
    id: "bluedart",
    name: "TIKI / BlueDart Express Air",
    logoText: "BLUEDART",
    badgeBg: "bg-blue-700",
    badgeText: "text-white",
    cost: 149,
  },
  {
    id: "dhl",
    name: "DHL Express Delivery",
    logoText: "DHL",
    badgeBg: "bg-yellow-400",
    badgeText: "text-red-700",
    cost: 299,
  },
];

interface CheckoutShippingDeliveryProps {
  selectedCourier: CourierOption | null;
  setSelectedCourier: (courier: CourierOption) => void;
  setErrorMessage: (msg: string) => void;
  errorMessage: string;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  handleContinueToConfirmation: () => void;
}

export const CheckoutShippingDelivery = ({
  selectedCourier,
  setSelectedCourier,
  setErrorMessage,
  errorMessage,
  setCurrentStep,
  handleContinueToConfirmation,
}: CheckoutShippingDeliveryProps) => {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase">
        SHIPPING DELIVERY
      </h2>

      <div className="flex flex-col gap-4">
        {COURIER_OPTIONS.map((courier) => {
          const isSelected = selectedCourier?.id === courier.id;

          return (
            <div
              key={courier.id}
              onClick={() => {
                setSelectedCourier(courier);
                if (errorMessage) setErrorMessage("");
              }}
              className={`border rounded-none p-5 cursor-pointer transition-all flex items-center justify-between ${
                isSelected
                  ? "border-[#78350F] bg-amber-50/20 ring-1 ring-[#78350F]"
                  : "border-neutral-300 hover:border-neutral-400 bg-white"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-[#78350F]" : "border-neutral-300"
                  }`}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#78350F]" />}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 text-[11px] font-black tracking-wider rounded-xs uppercase ${courier.badgeBg} ${courier.badgeText}`}
                  >
                    {courier.logoText}
                  </span>
                  <span className="font-sans font-bold text-sm text-neutral-900">
                    {courier.name}
                  </span>
                </div>
              </div>

              <span className="font-sans font-medium text-sm text-neutral-900">
                {formatPrice(courier.cost)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="text-xs uppercase font-bold text-neutral-500 hover:text-neutral-900 px-2 py-3"
        >
          ← Back to Personal Info
        </button>
        <button
          type="button"
          onClick={handleContinueToConfirmation}
          className="bg-[#78350F] hover:bg-[#5E2B0C] text-white font-bold tracking-widest text-xs uppercase px-10 py-4 rounded-none shadow-md transition-all ml-auto"
        >
          CONTINUE TO PAYMENT
        </button>
      </div>
    </div>
  );
};
