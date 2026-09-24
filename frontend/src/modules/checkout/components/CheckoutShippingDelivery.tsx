import React from "react";
import { formatPrice } from "@store4riders/shared-utils";
import { ChevronDownIcon, TruckIcon } from "@heroicons/react/24/outline";

export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi NCR", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", 
  "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

interface CheckoutShippingDeliveryProps {
  formData: {
    address: string;
    state: string;
    city: string;
    pinCode: string;
    [key: string]: any;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setErrorMessage: (msg: string) => void;
  errorMessage: string;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  handleContinueToPayment: () => void;
  shippingCost: number;
  freeShippingThreshold: number;
}

export const CheckoutShippingDelivery = ({
  formData,
  handleInputChange,
  setErrorMessage,
  errorMessage,
  setCurrentStep,
  handleContinueToPayment,
  shippingCost,
  freeShippingThreshold
}: CheckoutShippingDeliveryProps) => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Section 1: Address Detail */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase">
            SHIPPING ADDRESS
          </h2>
          <p className="text-xs text-neutral-500">
            Where should we ship your gear?
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            DETAILED ADDRESS (HOUSE / FLAT / STREET) *
          </label>
          <input
            id="address"
            name="address"
            type="text"
            required
            placeholder="Flat 402, Building 4, Sector 18"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* State */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="state" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              STATE *
            </label>
            <div className="relative">
              <select
                id="state"
                name="state"
                required
                value={formData.state}
                onChange={handleInputChange}
                className="appearance-none w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-3 py-3 text-sm text-neutral-900 bg-white focus:outline-none transition-colors"
              >
                <option value="" disabled>Select State</option>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDownIcon className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* City */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              CITY *
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              placeholder="Mumbai"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Pin Code */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pinCode" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              PIN CODE *
            </label>
            <input
              id="pinCode"
              name="pinCode"
              type="text"
              required
              placeholder="400001"
              value={formData.pinCode}
              onChange={handleInputChange}
              className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-neutral-200 my-1" />

      {/* Section 2: Courier Method */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase">
            DELIVERY METHOD
          </h2>
          <p className="text-xs text-neutral-500">
            Standard delivery across India. Free shipping on orders above {formatPrice(freeShippingThreshold)}.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="border border-[#78350F] bg-amber-50/20 ring-1 ring-[#78350F] rounded-none p-4 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#78350F]/10 flex items-center justify-center shrink-0">
                <TruckIcon className="w-4 h-4 text-[#78350F]" />
              </div>

              <div className="flex flex-col">
                <span className="font-sans font-bold text-sm text-neutral-900">
                  Standard Delivery
                </span>
                <span className="text-xs text-neutral-500">
                  Reliable tracking with top couriers
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className={`font-sans font-bold text-sm ${shippingCost === 0 ? "text-green-600" : "text-neutral-900"}`}>
                {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="text-xs uppercase font-bold text-neutral-500 hover:text-neutral-900 px-2 py-3 transition-colors"
        >
          ← Back to Personal Info
        </button>
        <button
          type="button"
          onClick={handleContinueToPayment}
          className="bg-brand hover:bg-red-800 text-white font-bold tracking-widest text-xs uppercase px-8 py-4 rounded-none shadow-md transition-all active:scale-[0.99] flex items-center gap-2"
        >
          CONTINUE TO PAYMENT
          <span className="text-base leading-none">→</span>
        </button>
      </div>

    </div>
  );
};
