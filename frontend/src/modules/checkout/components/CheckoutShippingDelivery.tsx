import React from "react";
import Link from "next/link";
import { formatPrice } from "@store4riders/shared-utils";
import { ChevronDownIcon, TruckIcon, UserIcon } from "@heroicons/react/24/outline";
import { IUserAddress } from "@store4riders/shared-types";
import { useShippingServiceability } from "@/core/hooks/useShippingServiceability";
import { useIndianStates } from "@/core/hooks/useIndianStates";
import { usePincodeLookup } from "@/core/hooks/usePincodeLookup";
import { DialCodeSelect } from "./DialCodeSelect";
import { COUNTRIES } from "@/core/utils/countries";

interface CheckoutShippingDeliveryProps {
  formData: {
    name?: string;
    countryCode?: string;
    phone?: string;
    altPhone?: string;
    email?: string;
    isB2b?: boolean;
    businessName?: string;
    customerGstin?: string;
    address: string;
    state: string;
    city: string;
    pinCode: string;
    country?: string;
    [key: string]: any;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setErrorMessage: (msg: string) => void;
  errorMessage: string;
  fieldErrors?: Record<string, string>;
  setCurrentStep: (step: 1 | 2) => void;
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
  total?: number;
}

export const CheckoutShippingDelivery = ({
  formData,
  handleInputChange,
  setErrorMessage,
  errorMessage,
  fieldErrors = {},
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
  total
}: CheckoutShippingDeliveryProps) => {
  const { data: indianStates = [] } = useIndianStates();
  const { data: pincodeData, isFetching: isPincodeLoading } = usePincodeLookup(
    formData.pinCode && formData.pinCode.length === 6 ? formData.pinCode : ""
  );

  const activePincode = React.useMemo(() => {
    if (!showAddressForm && selectedAddressId) {
      const addr = savedAddresses.find(a => (a.id || String((a as any)._id)) === selectedAddressId);
      return addr?.pincode || "";
    }
    if (showAddressForm) {
      return formData.pinCode;
    }
    return "";
  }, [showAddressForm, selectedAddressId, savedAddresses, formData.pinCode]);

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

  const currentCountry = COUNTRIES.find((c) => c.code === (formData.countryCode || "IN"));
  const maxPhoneLength = currentCountry?.phoneLength ? Math.max(...currentCountry.phoneLength) : 15;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Section 1: Contact Information (Profile) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
          <div>
            <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-black flex items-center justify-center">1</span>
              <span>CONTACT INFORMATION</span>
            </h2>
            <p className="text-xs text-neutral-500">
              Enter your contact details so we can send you order confirmation and updates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              NAME *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={50}
              placeholder="Enter your full name"
              value={formData.name || ""}
              onChange={handleInputChange}
              className={`w-full border ${fieldErrors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-300 focus:border-banner'} rounded-none px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-colors`}
            />
            {fieldErrors.name && <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.name}</span>}
          </div>

          {/* Phone Number with Flag selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              MOBILE NUMBER *
            </label>
            <div className="flex items-center gap-0">
              <DialCodeSelect
                value={formData.countryCode || "IN"}
                onChange={(val) => handleInputChange({ target: { name: "countryCode", value: val } } as any)}
              />
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                maxLength={maxPhoneLength}
                placeholder="Enter your mobile number"
                value={formData.phone || ""}
                onChange={handleInputChange}
                className={`w-full border ${fieldErrors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-300 focus:border-banner'} rounded-none px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-colors border-l-0`}
              />
            </div>
            {fieldErrors.phone && <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.phone}</span>}
          </div>

          {/* Alternate Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="altPhone" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              ALTERNATE PHONE NUMBER
            </label>
            <input
              id="altPhone"
              name="altPhone"
              type="tel"
              maxLength={maxPhoneLength}
              placeholder="Enter alternate number (optional)"
              value={formData.altPhone || ""}
              onChange={handleInputChange}
              className={`w-full border ${fieldErrors.altPhone ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-300 focus:border-banner'} rounded-none px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-colors`}
            />
            {fieldErrors.altPhone && <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.altPhone}</span>}
          </div>

          {/* Email Address */}
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              EMAIL ADDRESS *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={100}
              placeholder="Enter your email address"
              value={formData.email || ""}
              onChange={handleInputChange}
              className={`w-full border ${fieldErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-300 focus:border-banner'} rounded-none px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-colors`}
            />
            {fieldErrors.email && <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.email}</span>}
          </div>

          {/* Optional B2B Business & GSTIN Information */}
          <div className="sm:col-span-2 pt-2 border-t border-dashed border-neutral-200">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isB2b"
                checked={Boolean(formData.isB2b)}
                onChange={(e) => {
                  handleInputChange({
                    target: { name: "isB2b", value: e.target.checked }
                  } as any);
                }}
                className="w-4 h-4 text-banner rounded border-neutral-300 focus:ring-banner cursor-pointer"
              />
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                Buying for business? Add GST details for Tax Invoice / Input Tax Credit (ITC)
              </span>
            </label>

            {formData.isB2b && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 bg-neutral-50 border border-neutral-200 rounded-none animate-in fade-in duration-200">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="businessName" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    COMPANY / BUSINESS NAME *
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required={Boolean(formData.isB2b)}
                    placeholder="e.g. Acme Motors Pvt Ltd"
                    value={formData.businessName || ""}
                    onChange={handleInputChange}
                    className="w-full border border-neutral-300 bg-white rounded-none px-3.5 py-2.5 text-sm text-neutral-900 focus:border-banner focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="customerGstin" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    COMPANY GSTIN (15 DIGITS) *
                  </label>
                  <input
                    id="customerGstin"
                    name="customerGstin"
                    type="text"
                    maxLength={15}
                    required={Boolean(formData.isB2b)}
                    placeholder="e.g. 27AAPCS1234F1Z5"
                    value={formData.customerGstin || ""}
                    onChange={(e) => {
                      handleInputChange({
                        target: { name: "customerGstin", value: e.target.value.toUpperCase() }
                      } as any);
                    }}
                    className="w-full border border-neutral-300 bg-white rounded-none px-3.5 py-2.5 text-sm text-neutral-900 font-mono uppercase tracking-wider focus:border-banner focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-neutral-200 my-1" />

      {/* Section 2: Address Detail */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
          <div>
            <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-black flex items-center justify-center">2</span>
              <span>DELIVERY ADDRESS</span>
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
                handleInputChange({ target: { name: "country", value: "IN" } } as any);
                setEditingAddressId?.(null);
                onToggleAddressForm(true);
              }}
              className="border border-banner text-banner hover:bg-banner hover:text-white text-xs font-bold uppercase px-3 py-1.5 transition-colors flex items-center gap-1 shadow-xs"
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
                          handleInputChange({ target: { name: "address", value: addr.street } } as any);
                          handleInputChange({ target: { name: "city", value: addr.city } } as any);
                          handleInputChange({ target: { name: "state", value: addr.state } } as any);
                          handleInputChange({ target: { name: "pinCode", value: addr.pincode } } as any);
                          handleInputChange({ target: { name: "country", value: "IN" } } as any);
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
                className={`w-full border ${fieldErrors.address ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-300 focus:border-banner'} rounded-none px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-colors`}
              />
              {fieldErrors.address && <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.address}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Pin Code (FIRST) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pinCode" className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                  <span>PIN CODE *</span>
                  {isPincodeLoading && (
                    <span className="text-[10px] text-banner font-semibold flex items-center gap-1">
                      <span className="w-2.5 h-2.5 border-2 border-banner border-t-transparent rounded-full animate-spin inline-block" />
                      Checking DB...
                    </span>
                  )}
                </label>
                <input
                  id="pinCode"
                  name="pinCode"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6 digits [0-9] PIN code"
                  value={formData.pinCode}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 6);
                    handleInputChange({ target: { name: "pinCode", value: digitsOnly } } as any);
                  }}
                  className={`w-full border ${fieldErrors.pinCode ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-300 focus:border-banner'} rounded-none px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-colors font-mono tracking-wider`}
                />
                {fieldErrors.pinCode ? (
                  <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.pinCode}</span>
                ) : formData.pinCode.length === 6 ? (
                  isPincodeLoading ? (
                    <span className="text-xs text-blue-600 font-semibold animate-in fade-in duration-150">Checking Indian postal database...</span>
                  ) : pincodeData ? (
                    <span className="text-xs text-green-600 font-semibold animate-in fade-in duration-150 flex items-center gap-1">
                      <span>✓</span> Verified PIN ({pincodeData.district}, {pincodeData.state})
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 font-semibold animate-in fade-in duration-150">
                      Please enter valid Indian PIN code
                    </span>
                  )
                ) : (
                  <span className="text-[11px] text-neutral-500">
                    Enter 6-digit PIN to auto-detect City & State
                  </span>
                )}
              </div>

              {/* City (Auto-filled from DB & Disabled) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                  <span>CITY *</span>
                  {formData.city && (
                    <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.2 border border-green-200 font-bold uppercase tracking-wider">
                      Auto-filled
                    </span>
                  )}
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  disabled
                  readOnly
                  placeholder={formData.pinCode.length === 6 && isPincodeLoading ? "Detecting city..." : "Auto-detected from PIN code"}
                  value={formData.city}
                  className="w-full border border-neutral-200 bg-neutral-100 text-neutral-800 font-semibold cursor-not-allowed rounded-none px-4 py-3 text-base md:text-sm select-none"
                />
                {fieldErrors.city && <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.city}</span>}
              </div>

              {/* State (Auto-filled from DB & Disabled) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="state" className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                  <span>STATE *</span>
                  {formData.state && (
                    <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.2 border border-green-200 font-bold uppercase tracking-wider">
                      Auto-filled
                    </span>
                  )}
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  disabled
                  readOnly
                  placeholder={formData.pinCode.length === 6 && isPincodeLoading ? "Detecting state..." : "Auto-detected from PIN code"}
                  value={formData.state}
                  className="w-full border border-neutral-200 bg-neutral-100 text-neutral-800 font-semibold cursor-not-allowed rounded-none px-4 py-3 text-base md:text-sm select-none"
                />
                {fieldErrors.state && <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.state}</span>}
              </div>
            </div>

            {/* Flipkart-style SAVE AND DELIVER HERE & CANCEL buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={handleContinueToPayment}
                disabled={isAddingAddress || isNotServiceable || isCheckingServiceability}
                className="bg-banner hover:bg-orange-600 text-white font-extrabold text-xs uppercase px-7 py-3 rounded-none shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="border border-neutral-300 hover:border-neutral-900 bg-white text-neutral-700 hover:text-neutral-900 text-xs font-bold uppercase px-5 py-3 transition-colors text-center"
                >
                  CANCEL
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-neutral-200 my-1" />

      {/* Section 3: Delivery Method */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-black flex items-center justify-center">3</span>
            <span>DELIVERY METHOD</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Standard delivery across India. Free shipping on orders above {formatPrice(freeShippingThreshold)}.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="border border-banner bg-orange-50/20 ring-1 ring-banner rounded-none p-4 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-banner/10 flex items-center justify-center shrink-0">
                <TruckIcon className="w-4 h-4 text-banner" />
              </div>

              <div className="flex flex-col">
                <span className="font-sans font-bold text-sm text-neutral-900">
                  Standard Delivery
                </span>
                <span className="text-xs text-neutral-500">
                  {cartWeightKg > 0 && <span>Total weight: {cartWeightKg.toFixed(2)} kg • </span>}
                  Estimated delivery in 3-5 business days
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className={`font-sans font-bold text-sm ${shippingCost === 0 ? "text-green-600 font-extrabold uppercase" : "text-neutral-900"}`}>
                {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
              </span>
            </div>
          </div>
        </div>
      </div>



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
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white border-t border-neutral-200 z-[60] flex items-center justify-between gap-4 shadow-[0_-8px_16px_-6px_rgba(0,0,0,0.15)] lg:relative lg:p-0 lg:pb-0 lg:border-t-0 lg:z-auto lg:shadow-none lg:bg-transparent">
        {/* Mobile Total Display */}
        <div className="flex flex-col lg:hidden min-w-0">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total</span>
          <span className="text-lg font-black text-banner leading-none line-clamp-1">
            {total !== undefined ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(total) : "₹0.00"}
          </span>
        </div>

        {/* Back Button (Desktop Only) */}
        <Link
          href="/cart"
          className="hidden lg:flex border border-neutral-300 hover:border-neutral-900 text-neutral-700 hover:text-neutral-900 text-xs uppercase font-bold px-5 py-3.5 transition-colors items-center gap-1.5"
        >
          ← Back to Cart
        </Link>

        {/* Continue Button */}
        <button
          type="button"
          onClick={handleContinueToPayment}
          disabled={isAddingAddress || isNotServiceable || isCheckingServiceability}
          className="flex-1 lg:flex-none lg:w-auto bg-banner hover:bg-orange-600 text-white font-bold tracking-wider text-xs uppercase py-3.5 lg:py-4 px-4 md:px-8 rounded-none shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <span>
            {isAddingAddress ? "SAVING..." : (isCheckingServiceability ? "CHECKING..." : "CONTINUE TO PAYMENT")}
          </span>
          {!isAddingAddress && !isCheckingServiceability && <span className="text-base leading-none">→</span>}
        </button>
      </div>

    </div>
  );
};
