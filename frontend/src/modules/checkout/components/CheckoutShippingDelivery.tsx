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
      
      {/* Section 1: Contact Information (Clay Card) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.05),0_4px_16px_-2px_rgba(15,23,42,0.02),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-2px_4px_rgba(0,0,0,0.015)] border border-slate-100/90 ring-1 ring-slate-900/[0.02] flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white text-xs font-black shadow-[0_4px_10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.3)] flex items-center justify-center">1</span>
              <span>CONTACT INFORMATION</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Enter your contact details so we can send you order confirmation and updates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
              className={`w-full border ${fieldErrors.name ? 'border-red-400 bg-red-50/30 ring-2 ring-red-400/20' : 'border-slate-200/90 bg-slate-50/80 hover:bg-white focus:bg-white focus:border-banner focus:ring-4 focus:ring-banner/10'} rounded-xl px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-all duration-200 shadow-[inset_0_2px_4px_rgba(15,23,42,0.03)]`}
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
                className={`w-full border ${fieldErrors.phone ? 'border-red-400 bg-red-50/30 ring-2 ring-red-400/20' : 'border-slate-200/90 bg-slate-50/80 hover:bg-white focus:bg-white focus:border-banner focus:ring-4 focus:ring-banner/10'} rounded-r-xl px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-all duration-200 shadow-[inset_0_2px_4px_rgba(15,23,42,0.03)] border-l-0`}
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
              className={`w-full border ${fieldErrors.altPhone ? 'border-red-400 bg-red-50/30 ring-2 ring-red-400/20' : 'border-slate-200/90 bg-slate-50/80 hover:bg-white focus:bg-white focus:border-banner focus:ring-4 focus:ring-banner/10'} rounded-xl px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-all duration-200 shadow-[inset_0_2px_4px_rgba(15,23,42,0.03)]`}
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
              className={`w-full border ${fieldErrors.email ? 'border-red-400 bg-red-50/30 ring-2 ring-red-400/20' : 'border-slate-200/90 bg-slate-50/80 hover:bg-white focus:bg-white focus:border-banner focus:ring-4 focus:ring-banner/10'} rounded-xl px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-all duration-200 shadow-[inset_0_2px_4px_rgba(15,23,42,0.03)]`}
            />
            {fieldErrors.email && <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.email}</span>}
          </div>

          {/* Optional B2B Business & GSTIN Information */}
          <div className="sm:col-span-2 pt-2 border-t border-dashed border-slate-200">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isB2b"
                checked={Boolean(formData.isB2b)}
                onChange={(e) => {
                  handleInputChange({
                    target: { name: "isB2b", value: e.target.checked }
                  } as any);
                }}
                className="w-4 h-4 text-banner rounded-md border-slate-300 focus:ring-banner cursor-pointer accent-orange-600"
              />
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                Buying for business? Add GST details for Tax Invoice / Input Tax Credit (ITC)
              </span>
            </label>

            {formData.isB2b && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl shadow-[inset_0_2px_4px_rgba(15,23,42,0.02)] animate-in fade-in duration-200">
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
                    className={`w-full border ${fieldErrors?.businessName ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200/90'} bg-white rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:border-banner focus:ring-4 focus:ring-banner/10 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]`}
                  />
                  {fieldErrors?.businessName && (
                    <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.businessName}</span>
                  )}
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
                    className={`w-full border ${fieldErrors?.customerGstin ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200/90'} bg-white rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 font-mono uppercase tracking-wider focus:border-banner focus:ring-4 focus:ring-banner/10 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]`}
                  />
                  {fieldErrors?.customerGstin && (
                    <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.customerGstin}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Address Detail (Clay Card) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.05),0_4px_16px_-2px_rgba(15,23,42,0.02),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-2px_4px_rgba(0,0,0,0.015)] border border-slate-100/90 ring-1 ring-slate-900/[0.02] flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white text-xs font-black shadow-[0_4px_10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.3)] flex items-center justify-center">2</span>
              <span>DELIVERY ADDRESS</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
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
              className="rounded-xl bg-white border border-banner/40 text-banner hover:bg-orange-50/60 text-xs font-bold uppercase px-3.5 py-1.5 transition-all flex items-center gap-1.5 shadow-[0_2px_6px_rgba(255,84,41,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5"
            >
              <span>+</span> ADD A NEW ADDRESS
            </button>
          )}
        </div>

        {!showAddressForm && savedAddresses.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {savedAddresses.map((addr) => {
              const id = addr.id || String((addr as any)._id);
              const isSelected = selectedAddressId === id;
              return (
                <div 
                  key={id}
                  className={`rounded-2xl transition-all duration-200 ${
                    isSelected 
                      ? 'border-2 border-banner bg-gradient-to-br from-[#fff7f4] via-white to-white shadow-[0_12px_28px_-6px_rgba(255,84,41,0.18),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-2px_4px_rgba(255,84,41,0.04)]' 
                      : 'border border-slate-200/80 bg-white hover:bg-slate-50/50 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.04),inset_0_1.5px_0_rgba(255,255,255,1)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5'
                  } p-4 sm:p-5 flex flex-col gap-3 relative`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      className="flex items-start gap-3.5 flex-1 cursor-pointer"
                      onClick={() => onSelectAddress(id)}
                    >
                      <div className="mt-1 shrink-0">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-banner bg-banner shadow-[0_2px_6px_rgba(255,84,41,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]' : 'border-slate-300 bg-slate-50 shadow-inner'}`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-sm text-neutral-900">{formData.name || "Customer"}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-extrabold uppercase shadow-2xs border border-slate-200/60">
                            {addr.isDefault ? "DEFAULT" : "HOME"}
                          </span>
                          {formData.phone && (
                            <span className="text-xs text-neutral-600 font-semibold">{formData.countryCode || "+91"} {formData.phone}</span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                          {addr.street}, {addr.city}, {addr.state} - <span className="font-bold text-neutral-800">{addr.pincode}</span>
                        </p>
                        {isSelected && (
                          <div className="mt-2 flex items-center gap-2">
                            {isCheckingServiceability ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium">
                                <span className="w-2.5 h-2.5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                                Checking courier coverage...
                              </span>
                            ) : serviceabilityData?.serviceable ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 shadow-2xs">
                                <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                Deliverable to {addr.pincode} {serviceabilityData.estimatedDays ? `(~${serviceabilityData.estimatedDays} days)` : ""}
                              </span>
                            ) : isNotServiceable ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200/80 shadow-2xs">
                                <svg className="w-3.5 h-3.5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Delivery Not Available to {addr.pincode}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Edit & Delete Buttons */}
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
                        className="text-xs font-bold text-banner hover:text-orange-700 uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors"
                      >
                        EDIT
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAddress?.(id);
                        }}
                        className="text-xs font-bold text-slate-400 hover:text-red-600 uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
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
          <div className="flex flex-col gap-4 border border-slate-200/80 bg-slate-50/50 rounded-2xl p-4 sm:p-6 shadow-[inset_0_2px_4px_rgba(15,23,42,0.02)]">
            {/* Header when editing or adding address */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
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
                  className="rounded-xl border border-slate-200 hover:border-slate-800 bg-white text-neutral-700 hover:text-neutral-900 text-xs font-bold uppercase px-3.5 py-1.5 transition-all flex items-center gap-1 shadow-2xs"
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
                className={`w-full border ${fieldErrors.address ? 'border-red-400 bg-red-50/30 ring-2 ring-red-400/20' : 'border-slate-200/90 bg-white focus:border-banner focus:ring-4 focus:ring-banner/10'} rounded-xl px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-all duration-200 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]`}
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
                  className={`w-full border ${fieldErrors.pinCode ? 'border-red-400 bg-red-50/30 ring-2 ring-red-400/20' : 'border-slate-200/90 bg-white focus:border-banner focus:ring-4 focus:ring-banner/10'} rounded-xl px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-all duration-200 font-mono tracking-wider shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]`}
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
                    <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 font-bold uppercase tracking-wider">
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
                  className="w-full border border-slate-200/70 bg-slate-100/90 text-slate-800 font-semibold cursor-not-allowed rounded-xl px-4 py-3 text-base md:text-sm select-none shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
                />
                {fieldErrors.city && <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.city}</span>}
              </div>

              {/* State (Auto-filled from DB & Disabled) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="state" className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                  <span>STATE *</span>
                  {formData.state && (
                    <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 font-bold uppercase tracking-wider">
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
                  className="w-full border border-slate-200/70 bg-slate-100/90 text-slate-800 font-semibold cursor-not-allowed rounded-xl px-4 py-3 text-base md:text-sm select-none shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
                />
                {fieldErrors.state && <span className="text-red-500 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">{fieldErrors.state}</span>}
              </div>
            </div>

            {/* SAVE AND DELIVER HERE & CANCEL buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-200/80">
              <button
                type="button"
                onClick={handleContinueToPayment}
                disabled={isAddingAddress || isNotServiceable || isCheckingServiceability}
                className="bg-gradient-to-r from-banner to-[#ea4719] hover:from-[#f04f25] hover:to-[#d83c12] text-white font-extrabold text-xs uppercase px-7 py-3.5 rounded-xl shadow-[0_8px_20px_-4px_rgba(255,84,41,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15)] transition-all active:translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{isAddingAddress ? "SAVING..." : (isCheckingServiceability ? "CHECKING..." : (editingAddressId ? "UPDATE ADDRESS & CONTINUE" : "SAVE ADDRESS & CONTINUE"))}</span>
                <span className="text-sm">→</span>
              </button>
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleAddressForm(false);
                    setEditingAddressId?.(null);
                  }}
                  className="rounded-xl border border-slate-200 hover:border-slate-800 bg-white text-neutral-700 hover:text-neutral-900 text-xs font-bold uppercase px-5 py-3.5 transition-all text-center shadow-2xs"
                >
                  CANCEL
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Delivery Method (Clay Card) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.05),0_4px_16px_-2px_rgba(15,23,42,0.02),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-2px_4px_rgba(0,0,0,0.015)] border border-slate-100/90 ring-1 ring-slate-900/[0.02] flex flex-col gap-5">
        <div>
          <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white text-xs font-black shadow-[0_4px_10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.3)] flex items-center justify-center">3</span>
            <span>DELIVERY METHOD</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Standard delivery across India.{freeShippingThreshold > 0 ? ` Free shipping on orders above ${formatPrice(freeShippingThreshold)}.` : ""}
          </p>
        </div>

        {/* Live Serviceability Status Banner */}
        {activePincode && activePincode.length === 6 && (
          <div>
            {isCheckingServiceability ? (
              <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-neutral-600 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]">
                <div className="w-3.5 h-3.5 border-2 border-banner border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Checking courier network (Shiprocket, Delhivery, Xpressbees) for PIN code <strong>{activePincode}</strong>...</span>
              </div>
            ) : serviceabilityData?.serviceable ? (
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs text-emerald-800 shadow-[inset_0_1px_2px_rgba(16,185,129,0.03)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-2xs" />
                  <span>
                    ✓ PIN code <strong>{activePincode}</strong> is serviceable for delivery. 
                    {serviceabilityData.estimatedDays ? ` Estimated in ${serviceabilityData.estimatedDays} business days.` : " Fast delivery across India."}
                  </span>
                </div>
                {serviceabilityData.codAvailable && (
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300/80 shadow-2xs">
                    COD Available
                  </span>
                )}
              </div>
            ) : isNotServiceable ? (
              <div className="p-4 bg-red-50 border border-red-200/80 rounded-2xl text-xs text-red-800 space-y-1 shadow-[inset_0_1px_2px_rgba(220,38,38,0.03)]">
                <div className="flex items-center gap-2 font-bold text-red-900">
                  <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Delivery Unavailable to PIN Code {activePincode}</span>
                </div>
                <p className="text-[11px] text-red-700 pl-6 leading-relaxed">
                  Our courier partners (Shiprocket, Delhivery, Xpressbees) do not currently service this pincode. Please select an alternate saved address or enter a different pincode to continue.
                </p>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className={`border-2 ${isNotServiceable ? 'border-red-300 bg-red-50/20' : 'border-banner bg-gradient-to-br from-[#fff7f4] via-white to-white shadow-[0_10px_24px_-4px_rgba(255,84,41,0.16),inset_0_1.5px_0_rgba(255,255,255,1)]'} rounded-2xl p-4 sm:p-5 transition-all flex items-center justify-between`}>
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-2xl ${isNotServiceable ? 'bg-red-100 text-red-600 shadow-[inset_0_1px_2px_rgba(220,38,38,0.2)]' : 'bg-orange-100 text-banner shadow-[inset_0_1px_2px_rgba(255,84,41,0.2)]'} flex items-center justify-center shrink-0`}>
                <TruckIcon className="w-5 h-5" />
              </div>

              <div className="flex flex-col">
                <span className="font-sans font-bold text-sm text-neutral-900">
                  Standard Delivery
                </span>
                <span className="text-xs text-neutral-500 mt-0.5">
                  {cartWeightKg > 0 && <span>Total weight: {cartWeightKg.toFixed(2)} kg • </span>}
                  {isNotServiceable
                    ? "Service unavailable to selected pincode"
                    : serviceabilityData?.estimatedDays
                      ? `Estimated delivery in ${serviceabilityData.estimatedDays} business days`
                      : "Estimated delivery in 3-5 business days"}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className={`font-sans font-black text-sm ${shippingCost === 0 ? "text-emerald-600 uppercase" : "text-neutral-900"}`}>
                {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-red-400 hover:text-red-600 p-1 transition-colors rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-[60] flex items-center justify-between gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] lg:relative lg:p-0 lg:pb-0 lg:border-t-0 lg:z-auto lg:shadow-none lg:bg-transparent">
        {/* Mobile Total Display */}
        <div className="flex flex-col lg:hidden min-w-0">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total</span>
          <span className="text-xl font-black text-banner leading-none line-clamp-1">
            {total !== undefined ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(total) : "₹0.00"}
          </span>
        </div>

        {/* Back Button (Desktop Only) */}
        <Link
          href="/cart"
          className="hidden lg:flex border border-slate-200 hover:border-slate-800 bg-white text-slate-700 hover:text-slate-900 text-xs uppercase font-bold px-6 py-4 rounded-xl transition-all items-center gap-2 shadow-[0_2px_6px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] active:translate-y-0.5"
        >
          ← Back to Cart
        </Link>

        {/* Continue Button */}
        <button
          type="button"
          onClick={handleContinueToPayment}
          disabled={isAddingAddress || isNotServiceable || isCheckingServiceability}
          className={`flex-1 lg:flex-none lg:w-auto ${
            isNotServiceable 
              ? 'bg-slate-300 hover:bg-slate-300 text-slate-600 cursor-not-allowed shadow-none' 
              : 'bg-gradient-to-r from-banner to-[#ea4719] hover:from-[#f04f25] hover:to-[#d83c12] text-white shadow-[0_10px_24px_-4px_rgba(255,84,41,0.45),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15)] active:translate-y-0.5'
          } font-black tracking-wider text-xs uppercase py-3.5 lg:py-4 px-6 md:px-9 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer`}
        >
          <span>
            {isAddingAddress 
              ? "SAVING..." 
              : isCheckingServiceability 
                ? "CHECKING SERVICEABILITY..." 
                : isNotServiceable 
                  ? "DELIVERY UNAVAILABLE TO THIS PINCODE" 
                  : "CONTINUE TO PAYMENT"}
          </span>
          {!isAddingAddress && !isCheckingServiceability && !isNotServiceable && (
            <span className="text-base leading-none">→</span>
          )}
        </button>
      </div>

    </div>
  );
};
