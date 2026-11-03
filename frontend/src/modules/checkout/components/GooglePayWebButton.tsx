"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";
import { apiClient } from "@/core/api/client";

declare global {
  interface Window {
    google?: {
      payments?: {
        api?: {
          PaymentsClient: new (options: { environment: "TEST" | "PRODUCTION" }) => any;
        };
      };
    };
  }
}

interface GooglePayWebButtonProps {
  amount: number;
  orderNumber?: string;
  onSuccess: (orderNumber: string) => void;
  onPreOrderCreate?: () => Promise<string | null>;
  className?: string;
}

export const GooglePayWebButton: React.FC<GooglePayWebButtonProps> = ({
  amount,
  orderNumber,
  onSuccess,
  onPreOrderCreate,
  className = "",
}) => {
  const { data: settings } = usePublicSettings();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Environment: Defaults to TEST mode as recommended by Google for test card suite
  const environment = (settings?.googlePayEnvironment || "TEST") as "TEST" | "PRODUCTION";
  const merchantId = settings?.googlePayMerchantId || "";
  const merchantName = settings?.upiMerchantName || settings?.legalBusinessName || "Store4Riders";

  useEffect(() => {
    let isMounted = true;

    const loadGooglePayScript = () => {
      if (window.google?.payments?.api?.PaymentsClient) {
        initGooglePayClient();
        return;
      }

      const existingScript = document.querySelector('script[src="https://pay.google.com/gp/p/js/pay.js"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (isMounted) initGooglePayClient();
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://pay.google.com/gp/p/js/pay.js";
      script.async = true;
      script.onload = () => {
        if (isMounted) initGooglePayClient();
      };
      script.onerror = () => {
        if (isMounted) setErrorMsg("Failed to load Google Pay library");
      };
      document.body.appendChild(script);
    };

    const initGooglePayClient = async () => {
      try {
        if (!window.google?.payments?.api?.PaymentsClient) return;

        const paymentsClient = new window.google.payments.api.PaymentsClient({
          environment,
        });

        // Test card suite works with standard CARD networks and PAN_ONLY / CRYPTOGRAM_3DS
        const isReadyToPayRequest = {
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [
            {
              type: "CARD",
              parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"],
              },
            },
          ],
        };

        const response = await paymentsClient.isReadyToPay(isReadyToPayRequest);
        if (isMounted && response?.result) {
          setIsReady(true);
          renderGooglePayButton(paymentsClient);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err?.message || "Google Pay initialization failed");
        }
      }
    };

    const renderGooglePayButton = (client: any) => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";

      const button = client.createButton({
        onClick: handleGooglePayClick,
        buttonColor: "black",
        buttonType: "buy",
        buttonSizeMode: "fill",
      });

      containerRef.current.appendChild(button);
    };

    loadGooglePayScript();

    return () => {
      isMounted = false;
    };
  }, [environment, amount, orderNumber]);

  const handleGooglePayClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!window.google?.payments?.api?.PaymentsClient) {
        throw new Error("Google Pay library is not ready");
      }

      // If order is not yet created, trigger order creation first
      let currentOrderNumber = orderNumber;
      if (onPreOrderCreate) {
        currentOrderNumber = (await onPreOrderCreate()) || undefined;
        if (!currentOrderNumber) {
          setIsLoading(false);
          return;
        }
      }

      if (!currentOrderNumber) {
        throw new Error("Could not initialize order for Google Pay");
      }

      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment,
      });

      const tokenizationSpecification =
        environment === "PRODUCTION" && merchantId
          ? {
              type: "DIRECT",
              parameters: {
                protocolVersion: "ECv2",
                publicKey: merchantId,
              },
            }
          : {
              type: "PAYMENT_GATEWAY",
              parameters: {
                gateway: "example",
                gatewayMerchantId: "exampleGatewayMerchantId",
              },
            };

      // Construct payment data request dynamically based on environment
      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"],
              billingAddressRequired: false,
            },
            tokenizationSpecification,
          },
        ],
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPrice: Number(amount).toFixed(2),
          currencyCode: "INR",
          countryCode: "IN",
        },
        merchantInfo: {
          merchantName,
          ...(environment === "PRODUCTION" && merchantId ? { merchantId } : {}),
        },
      };

      // Opens Google Pay sheet (displays Test Card Suite in TEST mode!)
      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);

      let parsedToken: any = null;
      try {
        const rawTokenStr = paymentData?.paymentMethodData?.tokenizationData?.token;
        parsedToken = typeof rawTokenStr === "string" ? JSON.parse(rawTokenStr) : rawTokenStr;
      } catch {}

      const realSignature = parsedToken?.signature || "";
      const cardNetwork = paymentData?.paymentMethodData?.info?.cardNetwork || "CARD";
      const cardDetails = paymentData?.paymentMethodData?.info?.cardDetails || "";
      const realPaymentId = cardDetails ? `GPAY-${cardNetwork}-${cardDetails}` : `GPAY-${currentOrderNumber}`;

      // Send authentic paymentData payload to server verification
      const verifyRes = await apiClient.post("/orders/verify", {
        gatewayOrderId: currentOrderNumber,
        paymentId: realPaymentId,
        signature: realSignature,
        paymentData,
      });

      if (verifyRes.data?.success) {
        toast.success("Payment verified via Google Pay!");
        onSuccess(currentOrderNumber);
      } else {
        throw new Error(verifyRes.data?.message || "Payment verification failed");
      }
    } catch (err: any) {
      if (err?.statusCode === "CANCELED") {
        // User closed the Google Pay payment sheet
        toast.info("Google Pay transaction cancelled.");
      } else {
        const errorMsg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Google Pay transaction failed";
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {environment === "TEST" && (
        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 text-amber-900 px-3 py-1.5 rounded-md text-[11px] font-sans">
          <div className="flex items-center gap-1.5 font-medium">
            <span>🧪</span>
            <span>
              <strong>Google Pay Test Mode Active:</strong> Uses Google Test Card Suite (No real card required).
            </span>
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-amber-200/80 rounded text-amber-900 shrink-0">
            TEST MODE
          </span>
        </div>
      )}

      {/* Button mount container with Google Pay 8dp minimum clear space */}
      <div className="p-2 w-full flex items-center justify-center">
        <div
          ref={containerRef}
          className="w-full min-h-[44px] flex items-center justify-center rounded-lg overflow-hidden [&>button]:!w-full [&>button]:!h-[44px]"
        />
      </div>

      {errorMsg && (
        <span className="text-[11px] text-red-600 font-sans">
          {errorMsg}
        </span>
      )}
    </div>
  );
};

export default GooglePayWebButton;
