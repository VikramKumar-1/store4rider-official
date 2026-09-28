import React from "react";
import { formatPrice } from "@store4riders/shared-utils";
import { ChevronDownIcon, TruckIcon } from "@heroicons/react/24/outline";
import { IUserAddress } from "@store4riders/shared-types";
import { CountrySelect } from "./CountrySelect";
import { COUNTRIES } from "@/core/utils/countries";
import { useShippingServiceability } from "@/core/hooks/useShippingServiceability";

export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi NCR", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", 
  "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

interface CheckoutShippingDeliveryProps {
  formData: {
    name?: string;
    phone?: string;
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
  savedAddresses: IUserAddress[];
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  showAddressForm: boolean;
  onToggleAddressForm: (show: boolean) => void;
  isAddingAddress?: boolean;
  onDeleteAddress?: (id: string) => void;
  editingAddressId?: string | null;
  setEditingAddressId?: (id: string | null) => void;
  cartWeightKg: number;
  setIsCodAvailable: (avail: boolean) => void;
}

export const CheckoutShippingDelivery = ({
  formData,
  handleInputChange,
  setErrorMessage,
  errorMessage,
  setCurrentStep,
  handleContinueToPayment,
  shippingCost,
  freeShippingThreshold,
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  showAddressForm,
  onToggleAddressForm,
  isAddingAddress,
  onDeleteAddress,
  editingAddressId,
  setEditingAddressId,
  cartWeightKg,
  setIsCodAvailable,
}: CheckoutShippingDeliveryProps) => {
  const activePincode = React.useMemo(() => {
    if (!showAddressForm && selectedAddressId) {
      const addr = savedAddresses.find(a => (a.id || String((a as any)._id)) === selectedAddressId);
      return addr?.pincode || "";
    }
    if (showAddressForm && formData.country === "IN") {
      return formData.pinCode;
    }
    return "";
  }, [showAddressForm, selectedAddressId, savedAddresses, formData.country, formData.pinCode]);

  const { data: serviceabilityData, isLoading: isCheckingServiceability } = useShippingServiceability({
    pincode: activePincode,
    weightKg: cartWeightKg,
    isCod: false // We check general serviceability here
  });

  React.useEffect(() => {
    if (serviceabilityData) {
      setIsCodAvailable(serviceabilityData.codAvailable);
    } else {
      setIsCodAvailable(true); // Default to true if not checked or error
    }
  }, [serviceabilityData, setIsCodAvailable]);

  const isNotServiceable = activePincode.length === 6 && serviceabilityData && !serviceabilityData.serviceable;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Section 1: Address Detail */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
          <div>
            <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase">
              DELIVERY ADDRESS
            </h2>
            <p className="text-xs text-neutral-500">
              Where should we deliver your order?
            </p>
          </div>
          {!showAddressForm && (
            <button
              type="button"
              onClick={() => {
                // Clear address form for new entry
                handleInputChange({ target: { name: "address", value: "" } } as any);
                handleInputChange({ target: { name: "city", value: "" } } as any);
                handleInputChange({ target: { name: "state", value: "" } } as any);
                handleInputChange({ target: { name: "pinCode", value: "" } } as any);
                handleInputChange({ target: { name: "country", value: "" } } as any);
                setEditingAddressId?.(null);
                onToggleAddressForm(true);
              }}
              className="border border-brand text-brand hover:bg-brand hover:text-white text-xs font-bold uppercase px-3 py-1.5 transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>+</span> ADD A NEW ADDRESS
            </button>
          )}
        </div>

        {!showAddressForm && savedAddresses.length > 0 ? (
          <div className="flex flex-col gap-3">
            {savedAddresses.map((addr) => {
              const id = addr.id || String((addr as any)._id);
              const isSelected = selectedAddressId === id;
              return (
                <div 
                  key={id}
                  className={`border transition-all ${
                    isSelected 
                      ? 'border-banner bg-orange-50/15 ring-1 ring-banner shadow-xs' 
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  } p-4 flex flex-col gap-3 relative`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      className="flex items-start gap-3 flex-1 cursor-pointer"
                      onClick={() => onSelectAddress(id)}
                    >
                      <div className="mt-1 shrink-0">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-banner bg-white' : 'border-neutral-300'}`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-banner" />}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-sm text-neutral-900">{formData.name || "Customer"}</span>
                          <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-extrabold uppercase">
                            {addr.isDefault ? "DEFAULT" : "HOME"}
                          </span>
                          {formData.phone && (
                            <span className="text-xs text-neutral-600 font-semibold">{formData.countryCode || "+91"} {formData.phone}</span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                          {addr.street}, {addr.city}, {addr.state} - <span className="font-bold text-neutral-800">{addr.pincode}</span>
                        </p>
                      </div>
                    </div>

                    {/* Edit & Delete Buttons (Flipkart style) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rawCountry = addr.country || "";
                          const countryCode = rawCountry.toLowerCase() === "india" || rawCountry.toUpperCase() === "IN"
                            ? "IN"
                            : (COUNTRIES.find(c => c.name.toLowerCase() === rawCountry.toLowerCase() || c.code.toUpperCase() === rawCountry.toUpperCase())?.code || "");

                          handleInputChange({ target: { name: "address", value: addr.street } } as any);
                          handleInputChange({ target: { name: "city", value: addr.city } } as any);
                          handleInputChange({ target: { name: "state", value: addr.state } } as any);
                          handleInputChange({ target: { name: "pinCode", value: addr.pincode } } as any);
                          handleInputChange({ target: { name: "country", value: countryCode } } as any);
                          onSelectAddress(id);
                          setEditingAddressId?.(id);
                          onToggleAddressForm(true);
                        }}
                        className="text-xs font-bold text-banner hover:text-orange-700 uppercase tracking-wider px-2 py-1 transition-colors"
                      >
                        EDIT
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAddress?.(id);
                        }}
                        className="text-xs font-bold text-neutral-400 hover:text-red-600 uppercase tracking-wider px-2 py-1 transition-colors"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-4 border border-neutral-200 bg-neutral-50/40 p-4 sm:p-5">
            {/* Header when editing or adding address */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <span className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
                {editingAddressId ? "EDIT ADDRESS" : "ADD A NEW ADDRESS"}
              </span>
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleAddressForm(false);
                    setEditingAddressId?.(null);
                  }}
                  className="border border-neutral-300 hover:border-neutral-900 bg-white text-neutral-700 hover:text-neutral-900 text-xs font-bold uppercase px-3 py-1.5 transition-colors flex items-center gap-1"
                >
                  ✕ CANCEL
                </button>
              )}
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
                maxLength={200}
                placeholder="House/Flat No., Building Name, Street"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Country */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  COUNTRY *
                </label>
                <CountrySelect
                  value={formData.country}
                  onChange={(val) => handleInputChange({ target: { name: "country", value: val } } as any)}
                />
              </div>

              {/* State */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="state" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  STATE *
                </label>
                {formData.country === "IN" ? (
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
                ) : (
                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    maxLength={50}
                    placeholder="Enter your state or province"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 focus:outline-none transition-colors"
                  />
                )}
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
                  maxLength={50}
                  placeholder="Enter your city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 focus:outline-none transition-colors"
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
                  maxLength={formData.country === "IN" ? 6 : 10}
                  placeholder="Enter postal / zip code"
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Flipkart-style SAVE AND DELIVER HERE & CANCEL buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={handleContinueToPayment}
                disabled={isAddingAddress || isNotServiceable || isCheckingServiceability}
                className="bg-banner hover:bg-orange-600 text-white font-extrabold text-xs uppercase px-7 py-3 rounded-none shadow-xs transition-all active:scale-[0.99] flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingAddress ? "SAVING..." : (isCheckingServiceability ? "CHECKING..." : (editingAddressId ? "UPDATE ADDRESS & CONTINUE" : "SAVE ADDRESS & CONTINUE"))}
                <span className="text-sm">→</span>
              </button>
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleAddressForm(false);
                    setEditingAddressId?.(null);
                  }}
                  className="border border-neutral-300 hover:border-neutral-900 bg-white text-neutral-700 hover:text-neutral-900 text-xs font-bold uppercase px-5 py-3 transition-colors"
                >
                  CANCEL
                </button>
              )}
            </div>
          </div>
        )}
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

      {/* Serviceability Banner */}
      {activePincode.length === 6 && (
        <div className="mt-2">
          {isCheckingServiceability ? (
            <div className="bg-blue-50 border border-blue-100 text-blue-600 px-4 py-3 rounded-none text-xs font-semibold flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Checking delivery availability for {activePincode}...
            </div>
          ) : isNotServiceable ? (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-none text-xs font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Delivery is not available for pincode {activePincode}. Please try a different address.
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-none text-xs font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Delivery available for {activePincode}.
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-none text-xs font-semibold flex items-center justify-between mt-2">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-red-400 hover:text-red-600 p-0.5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-neutral-200 mt-2">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="border border-neutral-300 hover:border-neutral-900 text-neutral-700 hover:text-neutral-900 text-xs uppercase font-bold px-5 py-3.5 transition-colors flex items-center gap-1.5"
        >
          ← Back to Personal Info
        </button>
        <button
          type="button"
          onClick={handleContinueToPayment}
          disabled={isAddingAddress || isNotServiceable || isCheckingServiceability}
          className="bg-brand hover:bg-red-800 text-white font-bold tracking-widest text-xs uppercase px-8 py-4 rounded-none shadow-md transition-all active:scale-[0.99] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isAddingAddress ? "SAVING..." : (isCheckingServiceability ? "CHECKING PINCODE..." : "CONTINUE TO PAYMENT")}
          {!isAddingAddress && !isCheckingServiceability && <span className="text-base leading-none">→</span>}
        </button>
      </div>

    </div>
  );
};
