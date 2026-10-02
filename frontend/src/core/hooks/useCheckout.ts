import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PaymentMethodType } from "@store4riders/shared-types";

declare global {
  interface Window {}
}
import { useCartStore } from "@/stores/useCartStore";

export function useCheckout() {
  const { isAuthenticated } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ shippingAddressId, shippingAddress, guestEmail, paymentMethod, couponCode, phone, fullName }: { shippingAddressId?: string; shippingAddress?: any; guestEmail?: string; paymentMethod: PaymentMethodType; couponCode?: string; phone?: string; fullName?: string }) => {
      
      const payloadItems = cartItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantity: item.quantity
      }));
      
      // Generate a unique idempotency key for this checkout attempt
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const response = await apiClient.post("/orders", { 
        shippingAddressId, 
        shippingAddress,
        guestEmail,
        paymentMethod, 
        couponCode: couponCode || undefined,
        phone: phone || undefined,
        fullName: fullName || undefined,
        items: payloadItems,
        idempotencyKey,
      });
      return { ...response.data, paymentMethod };
    },
    onSuccess: (data) => {
      const { gatewayOrderId, amount, paymentMethod, gatewayResponse } = data.data;

      // Handle COD without partial payment (handled in CheckoutPageModule onSuccess)
      if (paymentMethod === "cod" && !gatewayOrderId) {
        toast.success("Order Confirmed Successfully!");
        return;
      }

      // Handle PayU, UPI, and COD partial payment with PayU
      if (((paymentMethod === "payu" || paymentMethod === "upi") || (paymentMethod === "cod" && gatewayOrderId)) && gatewayResponse) {
        toast.success("Redirecting to PayU Payment Gateway...");

        // Standard PayU India form submit redirect
        // NOTE: Vercel sets NODE_ENV=production on ALL deployments (including preview).
        // Use a dedicated env var NEXT_PUBLIC_PAYU_MODE to control test vs production.
        const isPayuLive = process.env.NEXT_PUBLIC_PAYU_MODE === "live";
        const payuAction = isPayuLive ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment";

        const form = document.createElement("form");
        form.method = "POST";
        form.action = payuAction;

        Object.entries(gatewayResponse).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          }
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // Handle CCAvenue — form POST with encrypted request
      if (paymentMethod === "ccavenue" && gatewayResponse) {
        toast.success("Redirecting to CCAvenue...");

        const isLive = process.env.NEXT_PUBLIC_CCAVENUE_MODE === "live";
        const ccavAction = isLive
          ? "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
          : "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction";

        const form = document.createElement("form");
        form.method = "POST";
        form.action = ccavAction;

        // CCAvenue expects encRequest and access_code as form fields
        Object.entries(gatewayResponse).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          }
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // Handle Snapmint — form POST to Snapmint checkout
      if (paymentMethod === "snapmint" && gatewayResponse) {
        toast.success("Redirecting to Snapmint...");

        const isLive = process.env.NEXT_PUBLIC_SNAPMINT_MODE === "live";
        const snapmintAction = isLive
          ? "https://checkout.snapmint.com/pay"
          : "https://sandbox-checkout.snapmint.com/pay";

        const form = document.createElement("form");
        form.method = "POST";
        form.action = snapmintAction;

        Object.entries(gatewayResponse).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          }
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }
    },
    onError: (error: any) => {
      if (error.message === "You must be logged in to checkout") {
        toast.error("Please login first to complete your order");
        router.push("/login?redirect=/checkout");
        return;
      }

      const resData = error.response?.data;
      let errorMsg = "Failed to initialize checkout";

      if (typeof resData?.error === "string") {
        errorMsg = resData.error;
      } else if (Array.isArray(resData?.error) && resData.error[0]?.message) {
        errorMsg = resData.error[0].message;
      } else if (typeof resData?.message === "string") {
        errorMsg = resData.message;
      } else if (error.message) {
        errorMsg = error.message;
      }

      toast.error(errorMsg);
    },
  });
}
