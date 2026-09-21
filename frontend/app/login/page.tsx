import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthModule } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Login to Your Account | Store4Riders",
  description: "Sign in to Store4Riders to access your orders, track shipments, and manage your riding gear wishlist.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-white" />}>
      <AuthModule type="login" />
    </Suspense>
  );
}
