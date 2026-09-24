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
    mutationFn: async ({ shippingAddressId, paymentMethod, couponCode }: { shippingAddressId: string; paymentMethod: PaymentMethodType; couponCode?: string }) => {
      if (!isAuthenticated) {
        throw new Error("You must be logged in to checkout");
      }
      
      const payloadItems = cartItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      }));
      
      // Generate a unique idempotency key for this checkout attempt
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const response = await apiClient.post("/orders", { 
        shippingAddressId, 
        paymentMethod, 
        couponCode,
        items: payloadItems 
      }, {
        headers: {
          "Idempotency-Key": idempotencyKey
        }
      });
      return { ...response.data, paymentMethod };
    },
    onSuccess: (data) => {
      const { gatewayOrderId, amount, paymentMethod } = data.data;

      // Handle COD without partial payment
      if (paymentMethod === "cod" && !gatewayOrderId) {
        useCartStore.getState().clearCart();
        toast.success("Order Confirmed Successfully!");
        router.push("/checkout?success=true");
        return;
      }

      // Handle PayU, CCAvenue, Snapmint, UPI, and COD (with partial payment)
      if (paymentMethod === "payu" || paymentMethod === "ccavenue" || paymentMethod === "snapmint" || paymentMethod === "upi" || (paymentMethod === "cod" && gatewayOrderId)) {
        useCartStore.getState().clearCart();
        
        if (paymentMethod === "cod") {
          toast.success(`Redirecting to PayU to collect COD Advance...`);
        } else {
          toast.success(`Redirecting to ${paymentMethod.toUpperCase()}...`);
        }
        
        // Example redirect: router.push(data.data.redirectUrl);
        setTimeout(() => {
          router.push("/checkout?success=true");
        }, 1500);
      }
    },
    onError: (error: any) => {
      if (error.message === "You must be logged in to checkout") {
        toast.error("Please login first to complete your order");
        router.push("/login?redirect=/checkout");
      } else {
        toast.error(error.response?.data?.error || "Failed to initialize checkout");
      }
    },
  });
}
