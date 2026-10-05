"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import ResetPasswordForm from "./components/ResetPasswordForm";

export const PasswordModule: React.FC<{ type: "forgot" | "reset"; token?: string }> = ({ type, token }) => {
  const isForgot = type === "forgot";

  return (
    <div className="w-full min-h-[100dvh] md:h-screen overflow-x-hidden md:overflow-hidden flex flex-col md:flex-row bg-white">
      
      {/* Left side: Image and Logo */}
      <div className="relative hidden md:flex md:w-1/2 h-full bg-neutral-900 overflow-hidden shrink-0">
        <Image
          src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=85"
          alt="Happy rider couple"
          fill
          className="object-cover object-center opacity-90 grayscale-[0.2]"
          sizes="50vw"
          priority
        />
        {/* Dark overlay to make logo pop */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Brand Logo inside image */}
        <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-10">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <Image 
              src="/Store4riders-Logo.jpg" 
              alt="Store4Riders Logo" 
              width={160} 
              height={40} 
              className="object-contain" 
            />
          </Link>
        </div>
      </div>

      {/* Right side: Form Container (Fits 100vh on Desktop, scrollable on mobile) */}
      <div className="w-full md:w-1/2 flex-1 md:h-full flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 overflow-y-auto lg:overflow-hidden relative">
        
        {/* Mobile Logo */}
        <div className="w-full mb-6 md:hidden">
          <Link href="/" className="flex items-center">
            <Image 
              src="/Store4riders-Logo.jpg" 
              alt="Store4Riders Logo" 
              width={150} 
              height={38} 
              className="object-contain mix-blend-multiply" 
            />
          </Link>
        </div>

        <div className="w-full max-w-sm lg:max-w-md flex flex-col gap-6 my-auto py-8 md:py-0">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="font-sans font-black text-3xl lg:text-4xl text-neutral-900 tracking-wide uppercase">
              {isForgot ? "RECOVER ACCESS" : "SET NEW PASSWORD"}
            </h1>
            <p className="text-xs lg:text-sm text-neutral-500 font-medium">
              {isForgot 
                ? "Enter your email address and we'll send you a link to reset your password" 
                : "Choose a strong password with at least 8 characters and a mix of letters and numbers"}
            </p>
          </div>
          
          {/* Form */}
          {isForgot ? <ForgotPasswordForm /> : (token && <ResetPasswordForm token={token} />)}
          
          {/* Switch link */}
          <div className="pt-2 text-left">
            <span className="text-neutral-500 font-sans text-sm lg:text-base">
              Remember your password?{" "}
            </span>
            <Link 
              href="/login" 
              className="font-sans text-sm lg:text-base text-neutral-900 font-bold underline decoration-1 underline-offset-4 hover:text-banner transition-colors"
            >
              Login here
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PasswordModule;
