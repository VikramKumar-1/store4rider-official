"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import Button from "@/components/ui/Button";

export const CheckoutCallbackModule = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const status = searchParams.get("status");
  const orderId = searchParams.get("orderId");
  
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      if (status === "success") {
        router.push("/account/orders");
      } else {
        router.push("/checkout");
      }
    }
  }, [countdown, router, status]);

  const isSuccess = status === "success";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center flex flex-col items-center">
        {isSuccess ? (
          <CheckCircleIcon className="w-20 h-20 text-green-500 mb-4" />
        ) : (
          <XCircleIcon className="w-20 h-20 text-red-500 mb-4" />
        )}
        
        <h1 className="text-2xl font-bold mb-2">
          {isSuccess ? "Payment Successful!" : "Payment Failed"}
        </h1>
        
        <p className="text-neutral-600 mb-6">
          {isSuccess 
            ? `Your order ${orderId ? "#" + orderId : ""} has been placed successfully.` 
            : "We couldn't process your payment. Please try again."}
        </p>

        <p className="text-sm text-neutral-400 mb-8">
          Redirecting in {countdown} seconds...
        </p>

        <Button 
          onClick={() => isSuccess ? router.push("/account/orders") : router.push("/checkout")}
          className="w-full"
        >
          {isSuccess ? "View Orders Now" : "Try Again Now"}
        </Button>
      </div>
    </div>
  );
};
