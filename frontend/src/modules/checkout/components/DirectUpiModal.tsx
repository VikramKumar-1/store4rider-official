"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { toast } from "sonner";
import { apiClient } from "@/core/api/client";
import { useCartStore } from "@/stores/useCartStore";
import { GooglePayWebButton } from "./GooglePayWebButton";

interface DirectUpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  amount: number;
  upiUri: string;
  payeeName?: string;
  payeeVpa?: string;
  onSuccess: (orderNumber: string) => void;
}

export const DirectUpiModal: React.FC<DirectUpiModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  amount,
  upiUri,
  payeeName = "Store4Riders",
  payeeVpa,
  onSuccess,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes session
  const [isPolling, setIsPolling] = useState(true);
  const [isCaptured, setIsCaptured] = useState(false);
  const [manualUtr, setManualUtr] = useState("");
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [qrMode, setQrMode] = useState<"official" | "dynamic">("official");
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile device for optimized UI
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobileDevice(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    }
  }, []);

  // Generate QR code onto canvas
  useEffect(() => {
    if (isOpen && canvasRef.current && upiUri) {
      QRCode.toCanvas(
        canvasRef.current,
        upiUri,
        {
          width: 240,
          margin: 1.5,
          color: {
            dark: "#111827",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        },
        (error) => {
          if (error) {
            console.error("QR Code generation error:", error);
          }
        }
      );
    }
  }, [isOpen, upiUri]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isCaptured) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsPolling(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isCaptured]);

  // Real-time payment confirmation status polling
  const checkPaymentStatus = useCallback(async () => {
    if (!orderNumber || isCaptured) return;
    try {
      const res = await apiClient.post("/orders/sync-payment", { orderId: orderNumber });
      const data = res.data?.data;
      if (data?.isConfirmed) {
        setIsCaptured(true);
        setIsPolling(false);
        useCartStore.getState().clearCart();
        toast.success("Payment received! Confirming your order...");
        setTimeout(() => {
          onSuccess(data.orderNumber || orderNumber);
        }, 800);
      }
    } catch {
      // Background polling fails silently
    }
  }, [orderNumber, isCaptured, onSuccess]);

  useEffect(() => {
    if (!isOpen || !isPolling || isCaptured) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    pollTimerRef.current = setInterval(checkPaymentStatus, 3500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, isPolling, isCaptured, checkPaymentStatus]);

  // Copy VPA / UPI ID
  const handleCopyVpa = async () => {
    if (!payeeVpa) return;
    try {
      await navigator.clipboard.writeText(payeeVpa);
      setCopiedVpa(true);
      toast.success("UPI ID copied to clipboard!");
      setTimeout(() => setCopiedVpa(false), 2000);
    } catch {
      toast.error("Could not copy UPI ID");
    }
  };

  // Submit manual 12-digit UTR reference
  const handleVerifyUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = manualUtr.trim();
    if (!cleanUtr) {
      toast.error("Please enter the 12-digit UPI Reference / UTR Number");
      return;
    }
    if (!/^\d{12}$/.test(cleanUtr)) {
      toast.error("UPI Reference (UTR) must be exactly 12 digits");
      return;
    }

    try {
      setIsVerifyingUtr(true);
      const res = await apiClient.post("/orders/verify", {
        gatewayOrderId: orderNumber,
        paymentId: cleanUtr,
        signature: cleanUtr,
        utr: cleanUtr,
      });

      if (res.data?.success) {
        setIsCaptured(true);
        setIsPolling(false);
        useCartStore.getState().clearCart();
        toast.success("Payment verified! Your order is placed.");
        setTimeout(() => {
          onSuccess(orderNumber);
        }, 800);
      } else {
        toast.error(res.data?.message || "Could not verify UTR. Please check digits.");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || err.response?.data?.message || "Verification failed. Please check the UTR."
      );
    } finally {
      setIsVerifyingUtr(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-neutral-200 animate-in zoom-in-95 duration-200">
        
        {/* Header Strip */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
              <Image src="/icons/payment/gpay.svg" alt="Google Pay" width={28} height={18} className="object-contain" priority />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                Google Pay Direct Payment
              </span>
              <span className="text-[11px] text-neutral-300 font-mono">
                Order: #{orderNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-neutral-800/80 border border-neutral-700 px-2.5 py-1 rounded-md text-right">
              <span className="text-[10px] text-neutral-400 uppercase font-semibold block leading-none">Due</span>
              <span className="text-sm font-black text-amber-400">
                ₹{Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isCaptured}
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          {isCaptured ? (
            <div className="py-10 flex flex-col items-center justify-center text-center gap-3 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-black shadow-inner">
                ✓
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900">Payment Confirmed!</h3>
              <p className="text-xs text-neutral-600 max-w-sm">
                Your payment of ₹{Number(amount).toLocaleString("en-IN")} was received. Directing to your receipt...
              </p>
            </div>
          ) : timeLeft <= 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl font-bold">
                ⏱
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Session Expired</h3>
              <p className="text-xs text-neutral-600 max-w-sm">
                This dynamic QR session has timed out. Please close and re-select your payment option.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 bg-neutral-900 text-white font-bold text-xs uppercase px-5 py-2.5 rounded hover:bg-neutral-800"
              >
                Close & Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              
              {/* Direct Google Pay App Launcher (Prominent on Mobile) */}
              {isMobileDevice && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    1. Tap to Pay with Google Pay
                  </span>
                  <a
                    href={upiUri}
                    className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-extrabold text-xs uppercase py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                  >
                    <Image src="/icons/payment/gpay.svg" alt="Google Pay" width={36} height={20} className="object-contain h-5 w-auto brightness-0 invert" />
                    <span>Pay ₹{Number(amount).toLocaleString("en-IN")} with Google Pay App</span>
                  </a>
                </div>
              )}

              {/* Google Pay Web API (with Test Card Suite in TEST mode) */}
              <div className="flex flex-col gap-2 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Image src="/icons/payment/gpay.svg" alt="Google Pay" width={24} height={16} className="object-contain h-3.5 w-auto" />
                    <span>Pay with Google Pay</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium">Test Card Suite / Instant</span>
                </div>
                <GooglePayWebButton
                  amount={Number(amount)}
                  orderNumber={orderNumber}
                  onSuccess={onSuccess}
                />
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 border border-neutral-200 rounded-xl relative">
                <div className="flex items-center justify-between w-full mb-2">
                  {/* Mode Toggle Pills */}
                  <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-200/60 p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setQrMode("official")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        qrMode === "official"
                          ? "bg-white text-neutral-900 shadow-2xs"
                          : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      Official Store QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrMode("dynamic")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        qrMode === "dynamic"
                          ? "bg-white text-neutral-900 shadow-2xs"
                          : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      Exact Amount QR
                    </button>
                  </div>

                  <div className="text-[11px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                    Expires: {formattedTime}
                  </div>
                </div>

                {/* QR Display: Official Store Card vs Dynamic Amount Canvas */}
                {qrMode === "official" ? (
                  <div className="relative w-44 sm:w-52 aspect-[566/934] rounded-xl overflow-hidden shadow-sm border border-neutral-200 bg-white">
                    <Image
                      src="/upi-qr-card.webp"
                      alt="Store4Riders Official UPI Scanner"
                      fill
                      sizes="(max-width: 640px) 176px, 208px"
                      className="object-contain"
                      priority
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="p-2.5 bg-white rounded-lg border border-neutral-300 shadow-xs">
                    <canvas ref={canvasRef} className="block mx-auto max-w-full h-auto" />
                  </div>
                )}

                {/* Live Polling Status Indicator */}
                <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600 font-medium">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Waiting for payment... Auto-detects upon approval.</span>
                </div>

                {payeeVpa && (
                  <div className="mt-2 text-[11px] text-neutral-500 flex items-center gap-1">
                    <span>Payee VPA:</span>
                    <strong className="text-neutral-800 font-mono">{payeeVpa}</strong>
                    <button
                      type="button"
                      onClick={handleCopyVpa}
                      className="text-xs text-banner hover:underline font-bold ml-1 cursor-pointer"
                    >
                      {copiedVpa ? "Copied!" : "Copy"}
                    </button>
                  </div>
                )}
              </div>

              {/* Manual 12-digit UTR Verification Fallback */}
              <div className="pt-2 border-t border-neutral-200">
                <form onSubmit={handleVerifyUtr} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="utrInput" className="text-xs font-bold text-neutral-800">
                      Paid already? Enter 12-digit UPI Reference / UTR:
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="utrInput"
                      type="text"
                      maxLength={12}
                      placeholder="e.g. 432109876543"
                      value={manualUtr}
                      onChange={(e) => setManualUtr(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-banner"
                    />
                    <button
                      type="submit"
                      disabled={isVerifyingUtr || manualUtr.length !== 12}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    >
                      {isVerifyingUtr ? "Verifying..." : "Verify UTR"}
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-tight">
                    *The 12-digit UTR is visible in your Google Pay, PhonePe, or bank debit SMS immediately after payment.
                  </p>
                </form>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
          <span className="flex items-center gap-1">
            🔒 256-Bit Encrypted Direct Bank Transfer
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={isCaptured}
            className="text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
          >
            Cancel Payment
          </button>
        </div>

      </div>
    </div>
  );
};
