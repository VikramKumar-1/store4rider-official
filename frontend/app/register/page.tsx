import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthModule } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Create an Account | Store4Riders",
  description: "Join Store4Riders to get exclusive riding gear deals, track orders, and experience faster checkout.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-white" />}>
      <AuthModule type="register" />
    </Suspense>
  );
}
