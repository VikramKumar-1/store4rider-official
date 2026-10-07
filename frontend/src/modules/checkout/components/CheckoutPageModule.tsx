"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/stores/useCartStore";
import { formatPrice } from "@store4riders/shared-utils";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";
import Footer from "@/modules/homepage/components/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CheckoutPersonalInfo } from "./CheckoutPersonalInfo";
import { CheckoutStepper } from "./CheckoutStepper";
import { CheckoutShippingDelivery } from "./CheckoutShippingDelivery";
import { CheckoutPaymentStep } from "./CheckoutPaymentStep";
import { PostCheckoutRegisterForm } from "./PostCheckoutRegisterForm";
import { useCheckout } from "@/core/hooks/useCheckout";
import { useUserAddresses, useAddAddress, useUpdateAddress, useDeleteAddress } from "@/core/hooks/useAddresses";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";
import { usePincodeLookup } from "@/core/hooks/usePincodeLookup";
import { PaymentMethodType, IUserAddress } from "@store4riders/shared-types";
import { 
  UserIcon, 
  TruckIcon, 
  CreditCardIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  ShieldCheckIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import { COUNTRIES } from "@/core/utils/countries";

import { useAuthStore } from "@/stores/useAuthStore";

const FALLBACK_IMAGE = "/no-image.svg";



declare global {
  interface Window {}
}

export const CheckoutPageModule = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { items, clearCart, isLoaded } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const { mutate: placeOrder, isPending: isPlacingOrder } = useCheckout();
  const { data: settings } = usePublicSettings();
  const { data: savedAddresses = [] } = useUserAddresses();
  const { mutateAsync: addAddressAsync, isPending: isAddingAddress } = useAddAddress();
  const { mutateAsync: updateAddressAsync, isPending: isUpdatingAddress } = useUpdateAddress();
  const { mutateAsync: deleteAddressAsync } = useDeleteAddress();

  const isSuccessParam = searchParams?.get("success") === "true";
  const isFailedParam = searchParams?.get("failed") === "true";
  const orderIdParam = searchParams?.get("orderId");
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  
  // 4 Figma Steps: 1: Checkout Form, 2: Shipping, 3: Confirmation, 4: Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(isSuccessParam ? 4 : 1);
  
  // Validation error alert
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState<boolean>(!user);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Keep register form mounted on success screen even after user auth state changes
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  useEffect(() => {
    if (currentStep === 4 && !user) {
      setShowRegisterForm(true);
    }
  }, [currentStep]);

  const handleDeleteAddress = async (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      try {
        await deleteAddressAsync(id);
        toast.success("Address deleted successfully");
        if (selectedAddressId === id) {
          setSelectedAddressId(null);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to delete address");
      }
    }
  };
  
  // Parse user's phone if they have one (e.g. +919876543210 -> +91, 9876543210)
  const userPhoneRaw = user?.phone || "";
  let defaultPhone = userPhoneRaw;
  if (userPhoneRaw.startsWith("+91")) defaultPhone = userPhoneRaw.slice(3);

  // Form State matching Figma Screen 1
  const [formData, setFormData] = useState({
    name: user?.name || (user?.firstName ? (user.firstName + " " + (user.lastName || "")).trim() : ""),
    countryCode: "IN",
    phone: defaultPhone,
    altPhone: "",
    email: user?.email || "",
    address: "",
    state: "",
    city: "",
    pinCode: "",
    country: "",
  });

  // Sync contact info whenever user profile loads or changes, or from localStorage
  useEffect(() => {
    let savedContact: any = null;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("s4r_checkout_contact");
        if (raw) savedContact = JSON.parse(raw);
      } catch (e) {}
    }

    const userName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "");
    const userEmail = user?.email || "";
    let userPhone = user?.phone || "";
    if (userPhone.startsWith("+91")) userPhone = userPhone.slice(3);

    setFormData((prev) => {
      const nextName = prev.name || userName || savedContact?.name || "";
      const nextEmail = prev.email || userEmail || savedContact?.email || "";
      const nextPhone = prev.phone || userPhone || savedContact?.phone || "";
      const nextAltPhone = prev.altPhone || savedContact?.altPhone || "";
      const nextCountryCode = prev.countryCode && prev.countryCode !== "IN" ? prev.countryCode : (savedContact?.countryCode || "IN");

      if (
        nextName === prev.name &&
        nextEmail === prev.email &&
        nextPhone === prev.phone &&
        nextAltPhone === prev.altPhone
      ) {
        return prev;
      }

      return {
        ...prev,
        name: nextName,
        email: nextEmail,
        phone: nextPhone,
        altPhone: nextAltPhone,
        countryCode: nextCountryCode,
      };
    });
  }, [user]);

  // Pincode Auto-fill Logic
  const { data: pincodeData } = usePincodeLookup(formData.country === "IN" || !formData.country ? formData.pinCode : "");

  useEffect(() => {
    if (pincodeData) {
      setFormData(prev => {
        const rawCity = pincodeData.district || pincodeData.divisionName || pincodeData.regionName || "";
        const titleCaseCity = rawCity ? rawCity.toLowerCase().replace(/\b\w/g, (s: string) => s.toUpperCase()) : prev.city;
        
        let mappedState = prev.state;
        if (pincodeData.state) {
          mappedState = pincodeData.state.trim().toLowerCase().replace(/\b\w/g, (s: string) => s.toUpperCase());
        }

        return {
          ...prev,
          city: titleCaseCity,
          state: mappedState
        };
      });
    }
  }, [pincodeData]);

  // Shipping & Payment Options
  const [paymentOption, setPaymentOption] = useState<PaymentMethodType>("payu");
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState("12345678910");
  const [isCodAvailable, setIsCodAvailable] = useState(true);

  useEffect(() => {
    setMounted(true);
    setGeneratedOrderNumber(`ORD-${Math.floor(1000000000 + Math.random() * 9000000000)}`);

    // Auto-detect country based on IP
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.country) { // ipapi.co returns ISO2 in 'country'
          setFormData((prev) => ({
            ...prev,
            country: data.country,
            countryCode: data.country,
          }));
        }
      })
      .catch((err) => {
        // Silently fail if adblocker or network issue prevents detection
      });
  }, []);

  useEffect(() => {
    if (user && savedAddresses && savedAddresses.length > 0) {
      const defaultAddr = savedAddresses.find((a: IUserAddress) => a.isDefault) || savedAddresses[0];
      if (!selectedAddressId) {
         setSelectedAddressId(defaultAddr.id || String((defaultAddr as any)._id));
      }
      if (showAddressForm && savedAddresses.length > 0) {
        setShowAddressForm(false);
      }
    } else if (!user || (savedAddresses && savedAddresses.length === 0)) {
      if (!showAddressForm) {
        setShowAddressForm(true);
      }
    }
  }, [user, savedAddresses, selectedAddressId, showAddressForm]);

  // Handle successful payment redirect
  useEffect(() => {
    if (isSuccessParam) {
      setCurrentStep(4);
      clearCart();
    }
  }, [isSuccessParam, clearCart]);

  // Handle failed or cancelled payment redirect
  useEffect(() => {
    if (isFailedParam) {
      toast.error("Payment was cancelled or unsuccessful. Your items are still safely in your cart.");
      setCurrentStep(3);
    }
  }, [isFailedParam]);

  // If orderId is provided in URL, update generatedOrderNumber
  useEffect(() => {
    if (orderIdParam) {
      setGeneratedOrderNumber(orderIdParam);
    }
  }, [orderIdParam]);

  // Redirect to cart ONLY if mounted, cart storage has loaded, cart is truly empty, and not on success or completed order
  useEffect(() => {
    if (mounted && isLoaded && items.length === 0 && currentStep !== 4 && !isSuccessParam && !isOrderCompleted) {
      router.push("/cart");
    }
  }, [mounted, isLoaded, items.length, currentStep, isSuccessParam, isOrderCompleted, router]);

  if (!mounted) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col font-sans">
        <TopBanner message="Discount 20% For New Member," highlightText="ONLY FOR TODAY!!" />
        <div className="bg-white border-b border-neutral-200">
          <Navbar logoText="Store4Riders" theme="light"  />
        </div>
        <div className="max-w-[1400px] w-full mx-auto px-4 py-16 animate-pulse">
          <div className="h-12 w-64 bg-neutral-100 rounded mb-8" />
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((total, item) => {
    const itemPrice = item.product?.basePrice || (item as any).price || 0;
    return total + itemPrice * item.quantity;
  }, 0);

  const cartWeightKg = items.reduce((total, item) => {
    const itemWeight = item.product?.weight || 0.5; // fallback 0.5kg
    return total + itemWeight * item.quantity;
  }, 0);

  const shippingCost = settings ? (subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingCost) : 0;
  const voucherDiscount = subtotal >= 3000 ? 500 : 0; // Voucher 50KDISCOUNT
  const total = Math.max(0, subtotal - voucherDiscount + shippingCost);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage("");
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Please provide your name.";
    else if (formData.name.trim().length < 2 || formData.name.trim().length > 50 || !/^[a-zA-Z0-9\s.-]+$/.test(formData.name.trim())) {
      errors.name = "Please enter a valid full name (2-50 characters, special symbols not allowed).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) errors.email = "Please provide your email address.";
    else if (formData.email.trim().length > 100 || !emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.phone.trim()) errors.phone = "Please provide your phone number.";
    else {
      const phoneClean = formData.phone.replace(/[\s-]/g, "");
      if (!/^\d+$/.test(phoneClean)) {
        errors.phone = "Phone number must contain only digits.";
      } else {
        const currentCountryInfo = COUNTRIES.find(c => c.code === formData.countryCode);
        const validLengths = currentCountryInfo?.phoneLength || [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        if (!validLengths.includes(phoneClean.length)) {
          errors.phone = `Phone numbers for ${currentCountryInfo?.name || "this country"} must be ${validLengths.length === 1 ? 'exactly ' + validLengths[0] : validLengths.join(' or ')} digits.`;
        }
      }
    }

    if (formData.altPhone.trim()) {
      const altPhoneClean = formData.altPhone.trim().replace(/[\s-]/g, "");
      if (!/^\d+$/.test(altPhoneClean)) {
        errors.altPhone = "Alternate phone number must contain only digits.";
      } else {
        const currentCountryInfo = COUNTRIES.find(c => c.code === formData.countryCode);
        const validLengths = currentCountryInfo?.phoneLength || [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        if (!validLengths.includes(altPhoneClean.length)) {
          errors.altPhone = `Alternate phone number for ${currentCountryInfo?.name || "this country"} has an invalid length.`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage("Please fix the errors below to continue.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }

    setFieldErrors({});
    setErrorMessage("");
    return true;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};

    if (!formData.country) errors.country = "Please select a country.";
    
    if (!formData.address.trim()) errors.address = "Please provide your shipping address.";
    else if (formData.address.trim().length > 200) {
      errors.address = "Address is too long. Please keep it under 200 characters.";
    }

    if (!formData.state.trim()) errors.state = "Please provide your state.";
    if (!formData.city.trim()) errors.city = "Please provide your city.";
    
    if (!formData.pinCode.trim()) errors.pinCode = "Please provide your PIN/postal code.";
    else if (formData.country === "IN") {
      if (!/^\d{6}$/.test(formData.pinCode.trim())) {
        errors.pinCode = "Indian PIN codes must be exactly 6 digits.";
      }
    } else {
      const zipRegex = /^[a-zA-Z0-9\s-]{3,10}$/;
      if (!zipRegex.test(formData.pinCode.trim())) {
        errors.pinCode = "Please enter a valid postal/zip code for your country.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage("Please fix the errors below to continue.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }

    setFieldErrors({});
    setErrorMessage("");
    return true;
  };

  const handleContinueToShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("s4r_checkout_contact", JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            altPhone: formData.altPhone,
            countryCode: formData.countryCode,
          }));
        } catch (e) {}
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleContinueToPayment = async () => {
    if (showAddressForm || !selectedAddressId || !user) {
      if (validateStep2()) {
        try {
          const { COUNTRIES } = await import("@/core/utils/countries");
          const selectedCountryObj = COUNTRIES.find(c => c.code.toUpperCase() === (formData.country || "").toUpperCase() || c.name.toLowerCase() === (formData.country || "").toLowerCase());
          const selectedCountryName = selectedCountryObj?.name || formData.country;
          
          if (user) {
            let targetAddressId: string | null = null;

            if (editingAddressId) {
              await updateAddressAsync({
                addressId: editingAddressId,
                addressData: {
                  street: formData.address,
                  city: formData.city,
                  state: formData.state,
                  pincode: formData.pinCode,
                  country: selectedCountryName,
                  isDefault: true,
                }
              });
              targetAddressId = editingAddressId;
              setEditingAddressId(null);
              toast.success("Address updated successfully");
            } else {
              const updatedUser = await addAddressAsync({
                street: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pinCode,
                country: selectedCountryName,
                isDefault: true,
              });
              const newAddress = updatedUser.addresses[updatedUser.addresses.length - 1];
              targetAddressId = newAddress.id || String(newAddress._id);
              toast.success("Address saved successfully");
            }

            if (targetAddressId) {
              setSelectedAddressId(targetAddressId);
            }
            setShowAddressForm(false);
          }
          setCurrentStep(3);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error: any) {
          toast.error(error.message || "Failed to save address");
        }
      }
    } else {
      if (!selectedAddressId) {
        toast.error("Please select a shipping address");
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAgreeToPay = async () => {
    if (isProcessing || isPlacingOrder) return;

    if (user && !selectedAddressId) {
      toast.error("Please select a shipping address");
      setCurrentStep(2);
      return;
    }

    if (!user) {
      if (!formData.address?.trim()) {
        toast.error("Please provide your delivery address (street / flat / building)");
        setCurrentStep(2);
        return;
      }
      if (!formData.city?.trim() || !formData.state?.trim() || !formData.pinCode?.trim()) {
        toast.error("Please complete your delivery address details");
        setCurrentStep(2);
        return;
      }
    }

    setIsProcessing(true);
    
    // Look up the dial code to construct the full phone number
    const { COUNTRIES } = await import("@/core/utils/countries");
    const dialCode = COUNTRIES.find(c => c.code === formData.countryCode)?.dialCode || "+91";
    const selectedCountryObj = COUNTRIES.find(c => c.code.toUpperCase() === (formData.country || "").toUpperCase() || c.name.toLowerCase() === (formData.country || "").toLowerCase());
    const selectedCountryName = selectedCountryObj?.name || formData.country;
    
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("s4r_checkout_contact", JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          altPhone: formData.altPhone,
          countryCode: formData.countryCode,
        }));
      } catch (e) {}
    }

    const shippingAddress = user && selectedAddressId ? undefined : {
      fullName: formData.name,
      phone: dialCode + formData.phone,
      street: formData.address,
      addressLine1: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pinCode,
      country: selectedCountryName
    };

    placeOrder({ 
      shippingAddressId: user ? (selectedAddressId || undefined) : undefined, 
      shippingAddress,
      guestEmail: user ? undefined : formData.email,
      paymentMethod: paymentOption,
      phone: dialCode + formData.phone,
      fullName: formData.name
    }, {
      onError: () => {
        setIsProcessing(false);
      },
      onSuccess: (data: any) => {
        setIsProcessing(false);
        const method = data?.paymentMethod || paymentOption;
        const gatewayOrderId = data?.data?.gatewayOrderId;

        // Pure COD order completed
        if (method === "cod" && !gatewayOrderId) {
          setIsOrderCompleted(true);
          const ordId = data?.data?.orderNumber || data?.data?.orderId || generatedOrderNumber;
          setGeneratedOrderNumber(ordId);
          setCurrentStep(4);
          clearCart();
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `/checkout?success=true&orderId=${ordId}`);
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    });
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col font-sans relative">
      
      {/* Top Banner */}
      <TopBanner
        message="Discount 20% For New Member,"
        highlightText="ONLY FOR TODAY!!"
      />

      {/* Navbar with Brand Logo */}
      <div className="bg-white border-b border-neutral-200 relative z-40">
        <Navbar
          logoText="Store4Riders"
          theme="light"
          
        />
      </div>

      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: "HOME", href: "/" },
        { label: "CART", href: "/cart" },
        { label: "CHECKOUT" }
      ]} />

      {/* Main Content */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-24 md:pt-4 md:pb-32 flex-1">
        
        {/* ========================================================================= */}
        {/* SCREEN 4: SUCCESS (matching Figma Screen 4) */}
        {/* ========================================================================= */}
        {currentStep === 4 ? (
          <div className="max-w-2xl mx-auto py-16 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-400">
            {/* Green Checkmark Circle */}
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-md">
              <CheckIcon className="w-9 h-9 stroke-[3]" />
            </div>

            {/* Modern Heading: ORDER CONFIRMED! / PAYMENT SUCCESS! */}
            <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-wide uppercase mb-4">
              {paymentOption === "cod" ? "ORDER CONFIRMED!" : "PAYMENT SUCCESS!"}
            </h1>

            <p className="text-neutral-500 text-xs sm:text-sm max-w-lg mb-8 leading-relaxed font-sans">
              Thank you for shopping with Store4Riders. Your order <strong>#{generatedOrderNumber}</strong> has been confirmed. A receipt and tracking details have been sent to {formData.email || user?.email ? <strong>{formData.email || user?.email}</strong> : "your registered email address"}.
            </p>
            
            {showRegisterForm && formData.email && (
              <PostCheckoutRegisterForm email={formData.email} name={formData.name || ""} />
            )}
            
            <Link
              href="/"
              className="bg-banner hover:bg-orange-600 text-white font-bold tracking-widest text-xs uppercase px-12 py-4 rounded-none shadow-md transition-all active:scale-[0.99]"
            >
              BACK TO HOME
            </Link>
          </div>
        ) : (
          /* ========================================================================= */
          /* SCREENS 1, 2, 3: CHECKOUT FLOW */
          /* ========================================================================= */
          <>
            {/* Two Column Layout */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
              
              {/* Left Column: Form Steps */}
              <div className="w-full lg:w-[62%]">
                
                {/* Stepper Progress Bar - Moved inside left column to save vertical space */}
                <CheckoutStepper 
                  currentStep={currentStep} 
                  setCurrentStep={setCurrentStep as (step: 1 | 2 | 3) => void} 
                  validateStep1={validateStep1} 
                  validateStep2={validateStep2}
                />
                
                {/* ------------------------------------------------------------- */}
                {/* STEP 1: PERSONAL INFO (Contact Person) */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 1 && (
                  <CheckoutPersonalInfo 
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleContinueToShipping={handleContinueToShipping}
                    errorMessage={errorMessage}
                    setErrorMessage={setErrorMessage}
                    fieldErrors={fieldErrors}
                    total={total}
                  />
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 2: SHIPPING & ADDRESS (Address Detail + Delivery Method) */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 2 && (
                  <CheckoutShippingDelivery
                    formData={formData}
                    handleInputChange={handleInputChange}
                    setErrorMessage={setErrorMessage}
                    errorMessage={errorMessage}
                    fieldErrors={fieldErrors}
                    setCurrentStep={setCurrentStep as (step: 1 | 2 | 3) => void}
                    handleContinueToPayment={handleContinueToPayment}
                    shippingCost={shippingCost}
                    freeShippingThreshold={settings?.freeShippingThreshold || 999}
                    savedAddresses={savedAddresses}
                    selectedAddressId={selectedAddressId}
                    onSelectAddress={setSelectedAddressId}
                    showAddressForm={showAddressForm}
                    onToggleAddressForm={setShowAddressForm}
                    isAddingAddress={isAddingAddress || isUpdatingAddress}
                    onDeleteAddress={handleDeleteAddress}
                    editingAddressId={editingAddressId}
                    setEditingAddressId={setEditingAddressId}
                    cartWeightKg={cartWeightKg}
                    setIsCodAvailable={setIsCodAvailable}
                    total={total}
                  />
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 3: PAYMENT METHOD */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 3 && (
                  <CheckoutPaymentStep
                    generatedOrderNumber={generatedOrderNumber}
                    paymentOption={paymentOption}
                    setPaymentOption={setPaymentOption}
                    setCurrentStep={setCurrentStep as (step: 1 | 2 | 3) => void}
                    handleAgreeToPay={handleAgreeToPay}
                    isProcessing={isProcessing}
                    isFailedParam={isFailedParam}
                    shippingAddressSummary={
                      savedAddresses.find((a) => (a.id || String((a as any)._id)) === selectedAddressId)
                        ? (() => {
                            const a = savedAddresses.find((a) => (a.id || String((a as any)._id)) === selectedAddressId)!;
                            return `${a.street}, ${a.city}, ${a.state} - ${a.pincode}`;
                          })()
                        : formData.address
                        ? `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pinCode}`
                        : ""
                    }
                    isCodAvailable={isCodAvailable}
                    total={total}
                  />
                )}

              </div>

              {/* Right Column: ORDER SUMMARY (Sticky on desktop) */}
              <div className="w-full lg:w-[38%] lg:sticky lg:top-4 z-20">
                <div className="flex flex-col bg-white border border-neutral-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-5 sm:p-6">
                  
                  {/* Promo Applied Banner in Order Summary */}
                  {voucherDiscount > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-[11px] font-bold flex items-center justify-between mb-4">
                      <span className="flex items-center gap-1.5">
                        <CheckCircleIcon className="w-4 h-4" />
                        Voucher "50KDISCOUNT" Applied!
                      </span>
                      <button className="text-emerald-500 hover:text-emerald-700">
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Heading */}
                  <h2 className="font-sans font-bold text-lg text-neutral-900 tracking-tight mb-4">
                    Order Summary
                  </h2>

                  {/* Items Mini List */}
                  <div className="flex flex-col gap-3 mb-5 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => {
                      const product = item.product || {};
                      const name = product.name || "Riding Gear";
                      const price = product.basePrice || (item as any).price || 0;
                      const rawImg = product.images?.[0]?.url || product.image || FALLBACK_IMAGE;

                      return (
                        <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 group">
                          <div className="relative w-12 h-12 bg-neutral-50 rounded-lg overflow-hidden shrink-0 border border-neutral-100 group-hover:border-neutral-200 transition-colors">
                            <Image
                              src={rawImg}
                              alt={name}
                              fill
                              className="object-contain p-1"
                              sizes="48px"
                            />
                          </div>

                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-[11px] text-neutral-900 uppercase line-clamp-1 leading-tight">
                              {name}
                            </span>
                            <span className="text-[11px] text-neutral-500 font-medium mt-0.5">
                              Qty: {item.quantity}
                            </span>
                          </div>
                          
                          <div className="text-[13px] font-bold text-neutral-900">
                            {formatPrice(price * item.quantity)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cost Breakdown */}
                  <div className="flex flex-col gap-2.5 pt-4 border-t border-dashed border-neutral-200">
                    <div className="flex items-center justify-between text-sm text-neutral-500 font-medium">
                      <span>Subtotal</span>
                      <span className="text-neutral-900">{formatPrice(subtotal)}</span>
                    </div>

                    {voucherDiscount > 0 && (
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="text-emerald-600">Discount</span>
                        <span className="text-emerald-600 font-bold">-{formatPrice(voucherDiscount)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm font-medium text-neutral-500">
                      <span>Shipping</span>
                      <span className={shippingCost === 0 ? 'text-emerald-600 font-bold' : 'text-neutral-900'}>
                        {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-200">
                    <span className="text-base font-bold text-neutral-900">Total</span>
                    <span className="text-2xl font-black text-[#AB1509] tracking-tight">
                      {formatPrice(total)}
                    </span>
                  </div>

                  {/* Trust Badges */}
                  <div className="flex items-center justify-center gap-3 mt-6 text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><ShieldCheckIcon className="w-3.5 h-3.5"/> Secure</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><LockClosedIcon className="w-3.5 h-3.5"/> Encrypted</span>
                  </div>

                </div>
              </div>

            </div>
          </>
        )}

      </main>

      {/* Global Footer */}
      <div className="hidden lg:block">
        <Footer />
      </div>

    </div>
  );
};



