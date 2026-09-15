import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function useCheckout() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (shippingAddressId: string) => {
      if (!isAuthenticated) {
        throw new Error("You must be logged in to checkout");
      }
      
      // Call our robust backend API instead of dummy Razorpay directly
      const response = await apiClient.post("/order", { shippingAddressId });
      return response.data;
    },
    onSuccess: (data) => {
      if (!window.Razorpay) {
        toast.error("Razorpay SDK not loaded");
        return;
      }

      const { razorpayOrderId, amount } = data.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_SxxPIU94rZKzyE",
        amount: Math.round(amount * 100), // convert to paise
        currency: "INR",
        name: "Store4Riders",
        description: "Premium Riding Gear Checkout",
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            // Send verification back to our backend
            await apiClient.post("/order/verify", {
              razorpayOrderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            
            toast.success("Payment Successful! Order Confirmed.");
            router.push("/checkout?success=true");
            
          } catch (error) {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        theme: {
          color: "#ea2b2b", // Store4Riders Red Brand Color
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();
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
