import React from "react";
import Image from "next/image";
import Link from "next/link";
import ForgotPasswordForm from "@/modules/auth/components/ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password | Store4Riders",
  description: "Reset your Store4Riders account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link href="/">
          <Image 
            src="/Store4riders-Logo.jpg" 
            alt="Store4Riders Logo" 
            width={180} 
            height={45} 
            className="object-contain mix-blend-multiply mb-2 hover:opacity-90 transition-opacity" 
          />
        </Link>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-neutral-900 tracking-tight">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-neutral-200">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
