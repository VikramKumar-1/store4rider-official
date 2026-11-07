"use client";

import React, { useState, useEffect, useRef } from "react";
import { preload } from "react-dom";
import Link from "next/link";
import Image from "next/image";

// Permanent payment gateway vector icons - preloaded into browser memory cache on checkout entry
const PAYMENT_GATEWAY_ICONS = [
  "/icons/payment/payu.svg",
  "/icons/payment/upi.svg",
  "/icons/payment/gpay.svg",
  "/icons/payment/phonepe.svg",
  "/icons/payment/paytm.svg",
  "/icons/payment/visa.svg",
  "/icons/payment/mastercard.svg",
  "/icons/payment/rupay.svg",
];

if (typeof window !== "undefined") {
  PAYMENT_GATEWAY_ICONS.forEach((src) => {
    preload(src, { as: "image", type: "image/svg+xml" });
  });
}
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
import { DirectUpiModal } from "./DirectUpiModal";
import { PostCheckoutRegisterForm } from "./PostCheckoutRegisterForm";
import { useCheckout } from "@/core/hooks/useCheckout";
import { useValidateCoupon, usePublicCoupons } from "@/core/hooks/useCoupons";
import { useUserAddresses, useAddAddress, useUpdateAddress, useDeleteAddress } from "@/core/hooks/useAddresses";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";
import { usePincodeLookup } from "@/core/hooks/usePincodeLookup";
import { PaymentMethodType, IUserAddress } from "@store4riders/shared-types";
import { getCartItemImage } from "@/core/utils/mediaUrlHelper";
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
  LockClosedIcon,
  TagIcon
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
  const { mutate: placeOrder, mutateAsync: placeOrderAsync, isPending: isPlacingOrder } = useCheckout();
  const { data: settings } = usePublicSettings();
  const { data: savedAddresses = [] } = useUserAddresses();
  const { mutateAsync: addAddressAsync, isPending: isAddingAddress } = useAddAddress();
  const { mutateAsync: updateAddressAsync, isPending: isUpdatingAddress } = useUpdateAddress();
  const { mutateAsync: deleteAddressAsync } = useDeleteAddress();

  // Compute active cart subtotal with exact price resolution
  const subtotal = items.reduce((total, item) => {
    const itemPrice = item.price ?? item.product?.price ?? item.product?.specialPrice ?? item.product?.basePrice ?? 0;
    return total + itemPrice * item.quantity;
  }, 0);

  // Promo Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const validateCouponMutation = useValidateCoupon();
  const { data: publicCoupons = [] } = usePublicCoupons();

  // Direct UPI / Google Pay Modal State
  const [upiModalData, setUpiModalData] = useState<{
    isOpen: boolean;
    orderNumber: string;
    amount: number;
    upiUri: string;
    payeeName?: string;
    payeeVpa?: string;
  }>({
    isOpen: false,
    orderNumber: "",
    amount: 0,
    upiUri: "",
  });

  // Restore applied coupon from Cart / localStorage if user is authenticated
  useEffect(() => {
    if (!mounted || !user || appliedCoupon) return;
    try {
      const saved = localStorage.getItem("s4r_checkout_coupon");
      if (saved && items.length > 0 && subtotal > 0) {
        const parsed = JSON.parse(saved);
        const code = typeof parsed === "string" ? parsed : parsed?.code;
        if (code && !validateCouponMutation.isPending) {
          const itemsPayload = items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId || null,
            quantity: it.quantity,
          }));
          validateCouponMutation.mutateAsync({
            code,
            items: itemsPayload,
            cartTotal: subtotal,
          }).then((res) => {
            setAppliedCoupon({
              code: res.code,
              discountAmount: res.discountAmount,
            });
            toast.success(`Coupon "${res.code}" applied from your cart!`);
          }).catch(() => {
            localStorage.removeItem("s4r_checkout_coupon");
          });
        }
      }
    } catch {}
  }, [mounted, user, items, subtotal]);

  // Invalidate applied coupon if subtotal changes (prevents cart tampering)
  const prevSubtotalRef = useRef(subtotal);
  useEffect(() => {
    if (prevSubtotalRef.current !== subtotal) {
      prevSubtotalRef.current = subtotal;
      if (appliedCoupon) {
        setAppliedCoupon(null);
        localStorage.removeItem("s4r_checkout_coupon");
        toast.info("Cart updated. Please re-apply your promo coupon.");
      }
    }
  }, [subtotal, appliedCoupon]);

  // Combine query savedAddresses with cached user.addresses for instant zero-latency address availability
  const effectiveAddresses: IUserAddress[] = React.useMemo(() => {
    if (savedAddresses && savedAddresses.length > 0) return savedAddresses;
    if (user?.addresses && user.addresses.length > 0) return user.addresses;
    return [];
  }, [savedAddresses, user?.addresses]);

  const isSuccessParam = searchParams?.get("success") === "true";
  const isFailedParam = searchParams?.get("failed") === "true";
  const isCancelledParam = searchParams?.get("cancelled") === "true";
  const hasPaymentIssue = isFailedParam || isCancelledParam;
  const orderIdParam = searchParams?.get("orderId");
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  
  // 2-Step Checkout: 1: Details & Shipping (Scrollable), 2: Payment, 3: Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(isSuccessParam ? 3 : 1);
  
  // Validation error alert
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isManualNewAddress, setIsManualNewAddress] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const handleToggleAddressForm = (show: boolean) => {
    setIsManualNewAddress(show);
    setShowAddressForm(show);
    if (!show) {
      setEditingAddressId(null);
    }
  };

  // Keep register form mounted on success screen even after user auth state changes
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  useEffect(() => {
    if (currentStep === 3 && !user) {
      setShowRegisterForm(true);
    }
  }, [currentStep, user]);

  const handleDeleteAddress = async (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      try {
        await deleteAddressAsync(id);
        toast.success("Address deleted successfully");
        const remaining = effectiveAddresses.filter(a => (a.id || String((a as any)?._id || "")) !== id);
        if (selectedAddressId === id) {
          if (remaining.length > 0) {
            const nextAddr = remaining.find(a => a.isDefault) || remaining[0];
            setSelectedAddressId(nextAddr?.id || String((nextAddr as any)?._id || ""));
          } else {
            setSelectedAddressId(null);
            setShowAddressForm(true);
          }
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
    country: "IN",
    isB2b: false,
    businessName: "",
    customerGstin: "",
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
  const { data: pincodeData } = usePincodeLookup(
    formData.pinCode && formData.pinCode.length === 6 ? formData.pinCode : ""
  );

  useEffect(() => {
    if (pincodeData) {
      const rawCity = pincodeData.district || pincodeData.divisionName || pincodeData.regionName || "";
      const titleCaseCity = rawCity ? rawCity.toLowerCase().replace(/\b\w/g, (s: string) => s.toUpperCase()) : "";
      
      let mappedState = "";
      if (pincodeData.state) {
        mappedState = pincodeData.state.trim().toLowerCase().replace(/\b\w/g, (s: string) => s.toUpperCase());
      }

      setFormData(prev => ({
        ...prev,
        city: titleCaseCity,
        state: mappedState
      }));

      // Clear any errors on pinCode, city, state
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.city;
        delete next.state;
        delete next.pinCode;
        return next;
      });
    } else if (pincodeData === null && formData.pinCode.length === 6) {
      // 6-digit PIN code queried but not in DB
      setFormData(prev => ({
        ...prev,
        city: "",
        state: ""
      }));
      setFieldErrors(prev => ({
        ...prev,
        pinCode: "Please enter valid Indian PIN code"
      }));
    }
  }, [pincodeData]);

  // Clear city and state when user is editing pinCode and it is less than 6 digits
  useEffect(() => {
    if (formData.pinCode.length < 6 && (formData.city || formData.state)) {
      setFormData(prev => ({
        ...prev,
        city: "",
        state: ""
      }));
    }
  }, [formData.pinCode]);

  // Shipping & Payment Options
  const [paymentOption, setPaymentOption] = useState<PaymentMethodType>("payu");
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState("12345678910");
  const [isCodAvailable, setIsCodAvailable] = useState(true);

  useEffect(() => {
    setMounted(true);
    setGeneratedOrderNumber(`ORD-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  }, []);

  // Initialize default address and address view mode when addresses are loaded
  useEffect(() => {
    if (user && effectiveAddresses.length > 0) {
      if (!selectedAddressId || !effectiveAddresses.some(a => (a.id || String((a as any)?._id || "")) === selectedAddressId)) {
        const defaultAddr = effectiveAddresses.find((a: IUserAddress) => a.isDefault) || effectiveAddresses[0];
        const defaultId = defaultAddr?.id || String((defaultAddr as any)?._id || "");
        if (defaultId) {
          setSelectedAddressId(defaultId);
        }
      }
      // If user has saved addresses and is NOT currently manually adding or editing, show saved addresses list
      if (!isManualNewAddress && !editingAddressId) {
        setShowAddressForm(false);
      }
    } else if (mounted && (!user || effectiveAddresses.length === 0)) {
      setShowAddressForm(true);
    }
  }, [user, effectiveAddresses, selectedAddressId, isManualNewAddress, editingAddressId, mounted]);

  // Sync formData with selected address so delivery summary and active calculations stay in sync
  useEffect(() => {
    if (selectedAddressId && effectiveAddresses.length > 0 && !showAddressForm) {
      const selected = effectiveAddresses.find(
        (a: IUserAddress) => (a.id || String((a as any)?._id || "")) === selectedAddressId
      );
      if (selected) {
        setFormData(prev => ({
          ...prev,
          address: selected.street || prev.address,
          city: selected.city || prev.city,
          state: selected.state || prev.state,
          pinCode: selected.pincode || prev.pinCode,
          country: selected.country || prev.country || "IN",
        }));
      }
    }
  }, [selectedAddressId, effectiveAddresses, showAddressForm]);

  // Handle successful payment redirect
  useEffect(() => {
    if (isSuccessParam) {
      setCurrentStep(3);
      clearCart();
      localStorage.removeItem("s4r_checkout_coupon");
    }
  }, [isSuccessParam, clearCart]);

  // Handle failed or cancelled payment redirect
  useEffect(() => {
    if (hasPaymentIssue) {
      if (!orderIdParam) {
        toast.info(isCancelledParam ? "Payment cancelled. Your items are still safely in your cart." : "Payment session ended. Your items are still safely in your cart.");
      }
      setCurrentStep(2);
    }
  }, [hasPaymentIssue, isCancelledParam, orderIdParam]);

  // If orderId is provided in URL, update generatedOrderNumber
  useEffect(() => {
    if (orderIdParam) {
      setGeneratedOrderNumber(orderIdParam);
    }
  }, [orderIdParam]);

  // Redirect to cart ONLY if mounted, cart storage has loaded, cart is truly empty, and not on success or completed order
  useEffect(() => {
    if (mounted && isLoaded && items.length === 0 && currentStep !== 3 && !isSuccessParam && !isOrderCompleted) {
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

  const cartWeightKg = items.reduce((total, item) => {
    const itemWeight = item.product?.weight || 0.5; // fallback 0.5kg
    return total + itemWeight * item.quantity;
  }, 0);

  const isAllFreeShipping = items.length > 0 && items.every(item => Boolean(item.product?.isFreeShipping || (item as any).isFreeShipping));
  const freeThreshold = settings?.freeShippingThreshold != null ? Number(settings.freeShippingThreshold) : 0;
  const qualifiesForFreeShipping = isAllFreeShipping || (freeThreshold > 0 && subtotal >= freeThreshold);

  // Maximum item-level shipping surcharge (heavy freight override)
  const maxItemShippingSurcharge = items.reduce((max, item) => {
    const p = item.product || {};
    const rawCost = p.shippingFee ?? p.shippingCost ?? p.attributes?.ship_cost ?? (p.attributes instanceof Map ? p.attributes.get("ship_cost") : 0);
    const numCost = Number(rawCost) || 0;
    return Math.max(max, numCost);
  }, 0);

  const baseShippingFee = settings?.shippingCost != null ? Number(settings.shippingCost) : 0;
  const applicableStandardFee = Math.max(baseShippingFee, maxItemShippingSurcharge);

  const shippingCost = qualifiesForFreeShipping
    ? (maxItemShippingSurcharge > 0 ? maxItemShippingSurcharge : 0)
    : (subtotal > 0 ? applicableStandardFee : 0);
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const isGstExclusive = settings?.gstPricingMode === "exclusive";
  const defaultTaxRate = typeof settings?.taxRate === "number" ? settings.taxRate : 18;
  const taxableSubtotal = Math.max(0, subtotal - couponDiscount);
  const estimatedTax = isGstExclusive
    ? Math.round((taxableSubtotal * defaultTaxRate) / 100)
    : Math.round(taxableSubtotal - (taxableSubtotal / (1 + defaultTaxRate / 100)));
  const total = Math.max(0, taxableSubtotal + shippingCost + (isGstExclusive ? estimatedTax : 0));

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      toast.error("Please sign in or create an account to apply promo coupons");
      return;
    }
    if (!couponInput.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    const itemsPayload = items.map((it) => ({
      productId: it.productId,
      variantId: it.variantId || null,
      quantity: it.quantity,
    }));

    try {
      const res = await validateCouponMutation.mutateAsync({
        code: couponInput.trim(),
        items: itemsPayload,
        cartTotal: subtotal,
      });

      setAppliedCoupon({
        code: res.code,
        discountAmount: res.discountAmount,
      });
      localStorage.setItem("s4r_checkout_coupon", JSON.stringify({ code: res.code, discountAmount: res.discountAmount }));
      toast.success(res.message || `Coupon "${res.code}" applied!`);
      setCouponInput("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid or ineligible coupon code");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem("s4r_checkout_coupon");
    toast.info("Coupon removed");
  };


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

    if (formData.isB2b) {
      if (!formData.businessName || !formData.businessName.trim()) {
        errors.businessName = "Please provide your company / business name.";
      } else if (formData.businessName.trim().length < 2 || formData.businessName.trim().length > 100) {
        errors.businessName = "Business name must be between 2 and 100 characters.";
      }

      const gstinClean = (formData.customerGstin || "").trim().toUpperCase();
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinClean) {
        errors.customerGstin = "Please provide your 15-digit Company GSTIN.";
      } else if (!gstinRegex.test(gstinClean)) {
        errors.customerGstin = "Invalid 15-digit GSTIN format (e.g. 27AAPCS1234F1Z5).";
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

    if (!formData.address.trim()) errors.address = "Please provide your shipping address.";
    else if (formData.address.trim().length < 3) {
      errors.address = "Address must be at least 3 characters.";
    } else if (formData.address.trim().length > 200) {
      errors.address = "Address is too long. Please keep it under 200 characters.";
    }

    if (!formData.pinCode.trim()) {
      errors.pinCode = "Please provide your PIN code.";
    } else if (!/^\d{6}$/.test(formData.pinCode.trim())) {
      errors.pinCode = "PIN code must be exactly 6 digits.";
    } else if (!formData.city.trim() || !formData.state.trim()) {
      errors.pinCode = "Please enter valid Indian PIN code.";
    }

    if (!formData.city.trim()) errors.city = "City is required (auto-detected from PIN).";
    if (!formData.state.trim()) errors.state = "State is required (auto-detected from PIN).";

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
    // 1. Validate contact info first
    if (!validateStep1()) {
      return;
    }

    // Save contact info to localStorage
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

    // 2. Validate address
    if (showAddressForm || !selectedAddressId || !user) {
      if (validateStep2()) {
        try {
          const { COUNTRIES } = await import("@/core/utils/countries");
          const selectedCountryObj = COUNTRIES.find(c => c.code.toUpperCase() === (formData.country || "").toUpperCase() || c.name.toLowerCase() === (formData.country || "").toLowerCase());
          const selectedCountryName = selectedCountryObj?.name || (formData.country && formData.country.length >= 2 ? formData.country : "India");
          const finalCountry = selectedCountryName && selectedCountryName.trim().length >= 2 ? selectedCountryName.trim() : "India";
          
          if (user) {
            let targetAddressId: string | null = null;
            const cleanStreet = formData.address.trim();
            const cleanCity = formData.city.trim();
            const cleanState = formData.state.trim();
            const cleanPincode = formData.pinCode.trim();

            if (editingAddressId) {
              await updateAddressAsync({
                addressId: editingAddressId,
                addressData: {
                  street: cleanStreet,
                  city: cleanCity,
                  state: cleanState,
                  pincode: cleanPincode,
                  country: finalCountry,
                  isDefault: true,
                }
              });
              targetAddressId = editingAddressId;
              setEditingAddressId(null);
              toast.success("Address updated successfully");
            } else {
              const updatedUser = await addAddressAsync({
                street: cleanStreet,
                city: cleanCity,
                state: cleanState,
                pincode: cleanPincode,
                country: finalCountry,
                isDefault: true,
              });
              const addresses = updatedUser?.addresses || [];
              const newAddress = addresses[addresses.length - 1];
              targetAddressId = newAddress?.id || String((newAddress as any)?._id || "");
              toast.success("Address saved successfully");
            }

            if (targetAddressId) {
              setSelectedAddressId(targetAddressId);
            }
            setIsManualNewAddress(false);
            setEditingAddressId(null);
            setShowAddressForm(false);
          }
          setCurrentStep(2);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error: any) {
          const apiMsg = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to save address";
          toast.error(typeof apiMsg === "string" ? apiMsg : "Failed to save address");
        }
      }
    } else {
      if (!selectedAddressId) {
        toast.error("Please select a shipping address");
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAgreeToPay = async () => {
    if (isProcessing || isPlacingOrder) return;

    if (user && !selectedAddressId) {
      toast.error("Please select a shipping address");
      setCurrentStep(1);
      return;
    }

    if (!user) {
      if (!formData.address?.trim()) {
        toast.error("Please provide your delivery address (street / flat / building)");
        setCurrentStep(1);
        return;
      }
      if (!formData.city?.trim() || !formData.state?.trim() || !formData.pinCode?.trim()) {
        toast.error("Please complete your delivery address details");
        setCurrentStep(1);
        return;
      }
    }

    if (formData.isB2b) {
      if (!formData.businessName?.trim()) {
        toast.error("Please provide your company / business name for B2B tax invoice");
        setCurrentStep(1);
        return;
      }
      const gstinClean = (formData.customerGstin || "").trim().toUpperCase();
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstinClean)) {
        toast.error("Please enter a valid 15-digit GSTIN (e.g. 27AAPCS1234F1Z5)");
        setCurrentStep(1);
        return;
      }
    }

    setIsProcessing(true);
    
    // Look up the dial code to construct the full phone number
    const { COUNTRIES } = await import("@/core/utils/countries");
    const dialCode = COUNTRIES.find(c => c.code === formData.countryCode)?.dialCode || "+91";
    const selectedCountryObj = COUNTRIES.find(c => c.code.toUpperCase() === (formData.country || "").toUpperCase() || c.name.toLowerCase() === (formData.country || "").toLowerCase());
    const selectedCountryName = selectedCountryObj?.name || (formData.country && formData.country.length >= 2 ? formData.country : "India");
    const finalCountry = selectedCountryName && selectedCountryName.trim().length >= 2 ? selectedCountryName.trim() : "India";
    
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
      country: finalCountry
    };

    placeOrder({ 
      shippingAddressId: user ? (selectedAddressId || undefined) : undefined, 
      shippingAddress,
      guestEmail: user ? undefined : formData.email,
      paymentMethod: paymentOption,
      couponCode: appliedCoupon?.code || undefined,
      phone: dialCode + formData.phone,
      fullName: formData.name,
      customerGstin: formData.isB2b && formData.customerGstin ? formData.customerGstin.trim().toUpperCase() : undefined,
      businessName: formData.isB2b && formData.businessName ? formData.businessName.trim() : undefined,
    }, {
      onError: () => {
        setIsProcessing(false);
      },
      onSuccess: (data: any) => {
        setIsProcessing(false);
        const method = data?.paymentMethod || paymentOption;
        const gatewayOrderId = data?.data?.gatewayOrderId;

        // Direct UPI / Google Pay
        if ((method === "upi" || method === "gpay") && data?.data?.gatewayResponse) {
          const gw = data.data.gatewayResponse;
          const ordId = gw.orderNumber || data?.data?.orderNumber || data?.data?.orderId || generatedOrderNumber;
          setGeneratedOrderNumber(ordId);
          setUpiModalData({
            isOpen: true,
            orderNumber: ordId,
            amount: Number(gw.amount || total),
            upiUri: gw.upiUri,
            payeeName: gw.payeeName,
            payeeVpa: gw.payeeVpa,
          });
          return;
        }

        // Pure COD order completed
        if (method === "cod" && !gatewayOrderId) {
          setIsOrderCompleted(true);
          const ordId = data?.data?.orderNumber || data?.data?.orderId || generatedOrderNumber;
          setGeneratedOrderNumber(ordId);
          setCurrentStep(3);
          clearCart();
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `/checkout?success=true&orderId=${ordId}`);
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    });
  };

  const handleUpiSuccess = (confirmedOrderNumber: string) => {
    setUpiModalData((prev) => ({ ...prev, isOpen: false }));
    setIsOrderCompleted(true);
    setGeneratedOrderNumber(confirmedOrderNumber);
    setCurrentStep(3);
    clearCart();
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/checkout?success=true&orderId=${encodeURIComponent(confirmedOrderNumber)}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateOrderForGooglePay = async (): Promise<string | null> => {
    if (!user && !selectedAddressId) {
      if (!formData.name?.trim() || !formData.email?.trim() || !formData.phone?.trim() || !formData.address?.trim()) {
        toast.error("Please complete your delivery address details first");
        setCurrentStep(1);
        return null;
      }
      if (!formData.city?.trim() || !formData.state?.trim() || !formData.pinCode?.trim()) {
        toast.error("Please complete your delivery address details first");
        setCurrentStep(1);
        return null;
      }
    }

    try {
      const { COUNTRIES } = await import("@/core/utils/countries");
      const dialCode = COUNTRIES.find((c) => c.code === formData.countryCode)?.dialCode || "+91";
      const selectedCountryObj = COUNTRIES.find(
        (c) =>
          c.code.toUpperCase() === (formData.country || "").toUpperCase() ||
          c.name.toLowerCase() === (formData.country || "").toLowerCase()
      );
      const selectedCountryName =
        selectedCountryObj?.name ||
        (formData.country && formData.country.length >= 2 ? formData.country : "India");
      const finalCountry =
        selectedCountryName && selectedCountryName.trim().length >= 2 ? selectedCountryName.trim() : "India";

      const shippingAddress = user && selectedAddressId ? undefined : {
        fullName: formData.name,
        phone: dialCode + formData.phone,
        street: formData.address,
        addressLine1: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pinCode,
        country: finalCountry,
      };

      const result: any = await placeOrderAsync({
        shippingAddressId: user ? (selectedAddressId || undefined) : undefined,
        shippingAddress,
        guestEmail: user ? undefined : formData.email,
        paymentMethod: "upi",
        couponCode: appliedCoupon?.code || undefined,
        phone: dialCode + formData.phone,
        fullName: formData.name,
        customerGstin: formData.isB2b && formData.customerGstin ? formData.customerGstin.trim().toUpperCase() : undefined,
        businessName: formData.isB2b && formData.businessName ? formData.businessName.trim() : undefined,
      });

      const ordId = result?.data?.orderNumber || result?.data?.gatewayOrderId || result?.data?.orderId;
      if (ordId) {
        setGeneratedOrderNumber(ordId);
        return ordId;
      }
      return null;
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Could not initialize order for Google Pay"
      );
      return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f6f8fb] flex flex-col font-sans relative">
      
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
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-24 md:pt-3 md:pb-12 flex-1">
        
        {/* ========================================================================= */}
        {/* SCREEN 3: SUCCESS */}
        {/* ========================================================================= */}
        {currentStep === 3 ? (
          <div className="max-w-xl mx-auto py-8 sm:py-10 px-6 sm:px-8 text-center flex flex-col items-center bg-white rounded-3xl shadow-[0_16px_40px_-6px_rgba(15,23,42,0.06),0_4px_16px_-2px_rgba(15,23,42,0.02),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-2px_4px_rgba(0,0,0,0.015)] border border-slate-100/90 ring-1 ring-slate-900/[0.02] animate-in fade-in zoom-in-95 duration-400 my-6">
            {/* Green Checkmark Badge */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center mb-4 shadow-[0_8px_20px_rgba(16,185,129,0.35),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15)] ring-4 ring-emerald-100/70">
              <CheckIcon className="w-7 h-7 stroke-[2.5]" />
            </div>

            {/* Modern Heading: ORDER CONFIRMED! / PAYMENT SUCCESS! */}
            <h1 className="font-sans text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight uppercase mb-2">
              {paymentOption === "cod" ? "ORDER CONFIRMED!" : "PAYMENT SUCCESS!"}
            </h1>

            <p className="text-neutral-500 text-xs sm:text-sm max-w-md mb-4 leading-relaxed font-sans">
              Thank you for shopping with Store4Riders. Your order <strong>#{generatedOrderNumber}</strong> has been confirmed. A receipt and tracking details have been sent to {formData.email || user?.email ? <strong>{formData.email || user?.email}</strong> : "your registered email address"}.
            </p>

            {/* Payment Method Badge on Confirmation */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 my-3 text-xs text-neutral-700 flex items-center justify-between w-full max-w-md font-sans shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]">
              <span className="font-semibold text-neutral-500">Payment Method:</span>
              <span className="font-black text-neutral-900 uppercase">
                {paymentOption.toUpperCase()}
              </span>
            </div>
            
            {showRegisterForm && formData.email && (
              <PostCheckoutRegisterForm email={formData.email} name={formData.name || ""} />
            )}
            
            <Link
              href="/"
              className="mt-2 bg-gradient-to-r from-banner to-[#ea4719] hover:from-[#f04f25] hover:to-[#d83c12] text-white font-black tracking-widest text-xs uppercase px-8 py-4 rounded-xl shadow-[0_8px_20px_-4px_rgba(255,84,41,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.4)] transition-all active:translate-y-0.5"
            >
              BACK TO HOME
            </Link>
          </div>
        ) : (
          /* ========================================================================= */
          /* SCREENS 1 & 2: 2-STEP CHECKOUT FLOW */
          /* ========================================================================= */
          <>
            {/* Two Column Layout */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
              
              {/* Left Column: Form Steps */}
              <div className="w-full lg:w-[62%]">
                
                {/* Stepper Progress Bar - Moved inside left column to save vertical space */}
                <CheckoutStepper 
                  currentStep={currentStep} 
                  setCurrentStep={setCurrentStep as (step: 1 | 2) => void} 
                  validateStep1={validateStep1} 
                  validateStep2={validateStep2}
                />
                
                {/* ------------------------------------------------------------- */}
                {/* STEP 1: DETAILS & SHIPPING (Contact Info + Delivery Address)   */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 1 && (
                  <CheckoutShippingDelivery
                    formData={formData}
                    handleInputChange={handleInputChange}
                    setErrorMessage={setErrorMessage}
                    errorMessage={errorMessage}
                    fieldErrors={fieldErrors}
                    setCurrentStep={setCurrentStep as (step: 1 | 2) => void}
                    handleContinueToPayment={handleContinueToPayment}
                    shippingCost={shippingCost}
                    freeShippingThreshold={freeThreshold}
                    savedAddresses={effectiveAddresses}
                    selectedAddressId={selectedAddressId}
                    onSelectAddress={setSelectedAddressId}
                    showAddressForm={showAddressForm}
                    onToggleAddressForm={handleToggleAddressForm}
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
                {/* STEP 2: PAYMENT METHOD */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 2 && (
                  <CheckoutPaymentStep
                    generatedOrderNumber={generatedOrderNumber}
                    paymentOption={paymentOption}
                    setPaymentOption={setPaymentOption}
                    setCurrentStep={setCurrentStep as (step: 1 | 2) => void}
                    handleAgreeToPay={handleAgreeToPay}
                    onPreOrderCreate={handleCreateOrderForGooglePay}
                    isProcessing={isProcessing}
                    isFailedParam={isFailedParam}
                    isCancelledParam={isCancelledParam}
                    shippingAddressSummary={
                      effectiveAddresses.find((a) => (a.id || String((a as any)._id)) === selectedAddressId)
                        ? (() => {
                            const a = effectiveAddresses.find((a) => (a.id || String((a as any)._id)) === selectedAddressId)!;
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
                <div className="flex flex-col bg-white border border-slate-100/90 ring-1 ring-slate-900/[0.03] shadow-[0_16px_40px_-6px_rgba(15,23,42,0.06),0_4px_16px_-2px_rgba(15,23,42,0.02),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-2px_4px_rgba(0,0,0,0.015)] rounded-3xl p-6 sm:p-7">
                  
                  {/* Heading */}
                  <h2 className="font-sans font-bold text-lg text-neutral-900 tracking-tight mb-4">
                    Order Summary
                  </h2>

                  {/* Promo Coupon Input / Applied Box */}
                  <div className="mb-4">
                    {!user ? (
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs transition-all shadow-[inset_0_1px_2px_rgba(245,158,11,0.04)]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="p-2 rounded-xl bg-amber-100/90 text-amber-700 shrink-0 shadow-2xs">
                            <TagIcon className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-neutral-900 block leading-tight truncate">
                              Have a promo code?
                            </span>
                            <span className="text-[11px] text-neutral-600 block leading-tight truncate mt-0.5">
                              Sign in or register to unlock discounts
                            </span>
                          </div>
                        </div>
                        <Link
                          href="/login?redirect=/checkout"
                          className="shrink-0 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all active:translate-y-0.5 whitespace-nowrap"
                        >
                          Sign In / Register →
                        </Link>
                      </div>
                    ) : appliedCoupon ? (
                      <div className="bg-emerald-50/90 border border-emerald-200/90 text-emerald-800 px-3.5 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-[inset_0_1px_2px_rgba(16,185,129,0.04)]">
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Coupon <strong>{appliedCoupon.code}</strong> applied!</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-emerald-700 hover:text-emerald-900 font-bold text-xs ml-2 underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Promo coupon code"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                            className="flex-1 px-3.5 py-2.5 text-xs border border-slate-200/90 rounded-xl font-mono uppercase bg-slate-50/80 hover:bg-white focus:bg-white focus:outline-none focus:border-banner focus:ring-4 focus:ring-banner/10 shadow-[inset_0_2px_4px_rgba(15,23,42,0.03)] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon()}
                            disabled={validateCouponMutation.isPending || !couponInput.trim()}
                            className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.25)] active:translate-y-0.5 cursor-pointer shrink-0"
                          >
                            {validateCouponMutation.isPending ? "Checking..." : "Apply"}
                          </button>
                        </div>

                        {/* Quick-apply active offers */}
                        {publicCoupons.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Offers:</span>
                            {publicCoupons.slice(0, 3).map((pc) => (
                              <button
                                key={pc._id || pc.code}
                                type="button"
                                onClick={() => {
                                  const itemsPayload = items.map((it) => ({
                                    productId: it.productId,
                                    variantId: it.variantId || null,
                                    quantity: it.quantity,
                                  }));
                                  validateCouponMutation.mutateAsync({
                                    code: pc.code,
                                    items: itemsPayload,
                                    cartTotal: subtotal,
                                  }).then((res) => {
                                    setAppliedCoupon({
                                      code: res.code,
                                      discountAmount: res.discountAmount,
                                    });
                                    localStorage.setItem("s4r_checkout_coupon", JSON.stringify({ code: res.code, discountAmount: res.discountAmount }));
                                    toast.success(res.message || `Coupon "${res.code}" applied!`);
                                    setCouponInput("");
                                  }).catch((err: any) => {
                                    toast.error(err.response?.data?.error || `Coupon "${pc.code}" cannot be applied to current cart`);
                                  });
                                }}
                                disabled={validateCouponMutation.isPending}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-mono font-bold px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs flex items-center gap-1 transition-all active:translate-y-0.5 cursor-pointer"
                              >
                                <TagIcon className="w-3 h-3 text-banner" />
                                <span>{pc.code}</span>
                                <span className="text-slate-500 font-sans font-normal">
                                  ({pc.discountType === "percent" ? `${pc.discountValue}%` : `₹${pc.discountValue}`})
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Items Mini List */}
                  <div className="flex flex-col gap-3 mb-5 max-h-[190px] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => {
                      const product = item.product || {};
                      const name = product.name || "Riding Gear";
                      const price = item.price ?? product.price ?? product.specialPrice ?? product.basePrice ?? 0;
                      const rawImg = getCartItemImage(item, FALLBACK_IMAGE);

                      return (
                        <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 group">
                          <div className="relative w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-200/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] group-hover:border-slate-300 transition-colors">
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

                  {/* Cost Breakdown (Inset Clay Box) */}
                  <div className="flex flex-col gap-2.5 p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl shadow-[inset_0_2px_4px_rgba(15,23,42,0.02)]">
                    <div className="flex items-center justify-between text-sm text-neutral-500 font-medium">
                      <span>Subtotal</span>
                      <span className="text-neutral-900 font-semibold">{formatPrice(subtotal)}</span>
                    </div>

                    {couponDiscount > 0 && appliedCoupon && (
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="text-emerald-600 flex items-center gap-1">
                          Coupon ({appliedCoupon.code})
                        </span>
                        <span className="text-emerald-600 font-bold">-{formatPrice(couponDiscount)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm font-medium text-neutral-500">
                      <span>Shipping</span>
                      <span className={shippingCost === 0 ? 'text-emerald-600 font-bold uppercase' : 'text-neutral-900 font-semibold'}>
                        {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                      </span>
                    </div>

                    {isGstExclusive ? (
                      <div className="flex items-center justify-between text-sm font-medium text-neutral-600">
                        <span>GST ({defaultTaxRate === 0 ? "0% - Exempt" : `${defaultTaxRate}%`})</span>
                        <span className="text-neutral-900 font-bold">+{formatPrice(estimatedTax)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs font-medium text-neutral-400">
                        <span>GST (Included in price)</span>
                        <span>{formatPrice(estimatedTax)}</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between pt-4 mt-2">
                    <span className="text-base font-bold text-neutral-900">Total</span>
                    <span className="text-2xl font-black text-banner tracking-tight">
                      {formatPrice(total)}
                    </span>
                  </div>

                  {/* Desktop Step 2 Place Order Button - positioned directly below Total in Order Summary */}
                  {currentStep === 2 && (
                    <div className="hidden lg:flex flex-col gap-2.5 mt-5">
                      {paymentOption === "cod" && Boolean(settings?.codPartialPaymentEnabled) && (settings?.codPartialPaymentValue || 0) > 0 && (
                        <div className="p-3.5 bg-[#F0F5FF] border border-[#D0E1FD] rounded-2xl text-xs leading-relaxed text-[#172337] flex items-center justify-between gap-2.5 shadow-2xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <svg className="w-4 h-4 text-[#2874F0] shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                            </svg>
                            <div className="text-[11.5px] leading-snug text-[#1E293B]">
                              for <strong className="font-bold text-[#2874F0]">{settings?.codPartialPaymentType === "fixed" ? `₹${Number(settings?.codPartialPaymentValue || 0).toLocaleString("en-IN")}` : `${settings?.codPartialPaymentValue ?? 10}%`} advance payment</strong> you will be directed to <strong className="font-bold text-neutral-900">Payu Payment Gateway</strong>
                            </div>
                          </div>
                          <div className="shrink-0 hidden sm:flex items-center bg-white px-2 py-0.5 border border-[#D0E1FD] rounded shadow-2xs h-5">
                            <Image src="/icons/payment/payu.svg" alt="PayU" width={30} height={14} className="object-contain h-3.5 w-auto" priority loading="eager" unoptimized />
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleAgreeToPay}
                        disabled={isProcessing || isPlacingOrder || !paymentOption}
                        className="w-full bg-gradient-to-r from-banner to-[#ea4719] hover:from-[#f04f25] hover:to-[#d83c12] text-white font-black tracking-wider text-xs uppercase py-4 px-6 rounded-2xl shadow-[0_10px_24px_-4px_rgba(255,84,41,0.45),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15)] transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isProcessing || isPlacingOrder ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>PROCESSING...</span>
                          </>
                        ) : (
                          "PLACE ORDER"
                        )}
                      </button>

                      <p className="text-[11px] text-slate-400 text-center font-medium mt-1">
                        By placing your order, you agree to Store4Riders Terms & Conditions.
                      </p>
                    </div>
                  )}

                  {/* Trust Badges */}
                  <div className="flex items-center justify-center gap-3 mt-6 py-2 px-4 rounded-full bg-slate-50/80 border border-slate-200/60 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600"/> Secure Checkout</span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5"><LockClosedIcon className="w-3.5 h-3.5 text-slate-600"/> 256-Bit Encrypted</span>
                  </div>

                </div>
              </div>

            </div>
          </>
        )}

      </main>

      {/* Direct UPI / Google Pay Modal */}
      <DirectUpiModal
        isOpen={upiModalData.isOpen}
        onClose={() => setUpiModalData((prev) => ({ ...prev, isOpen: false }))}
        orderNumber={upiModalData.orderNumber}
        amount={upiModalData.amount}
        upiUri={upiModalData.upiUri}
        payeeName={upiModalData.payeeName}
        payeeVpa={upiModalData.payeeVpa}
        onSuccess={handleUpiSuccess}
      />

      {/* Global Footer */}
      <div className="hidden lg:block">
        <Footer />
      </div>

    </div>
  );
};



