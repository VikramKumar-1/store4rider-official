import React from "react";
import Image from "next/image";
import Link from "next/link";
import ResetPasswordForm from "@/modules/auth/components/ResetPasswordForm";

export const metadata = {
  title: "Set New Password | Store4Riders",
  description: "Set a new password for your Store4Riders account.",
};

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
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
          Set New Password
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-neutral-200">
          <ResetPasswordForm token={resolvedParams.token} />
        </div>
      </div>
    </div>
  );
}
