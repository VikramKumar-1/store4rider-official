"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";

export const AuthModule: React.FC<{ type: "login" | "register" }> = ({ type }) => {
  const isLogin = type === "login";
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect");
  const redirectQuery = redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : "";

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col md:flex-row bg-white">
      
      {/* Left side: Image and Logo */}
      <div className="relative hidden md:flex md:w-1/2 h-full bg-neutral-900 overflow-hidden shrink-0">
        <Image
          src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=85"
          alt="Happy rider couple"
          fill
          className="object-cover object-center opacity-90"
          sizes="50vw"
          priority
        />
        {/* Dark overlay to make logo pop */}
        <div className="absolute inset-0 bg-black/25" />
        
        {/* Brand Logo inside image */}
        <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-10">
          <Link href="/" className="font-serif text-2xl lg:text-3xl tracking-widest text-white flex items-center hover:opacity-90 transition-opacity">
            <span className="text-banner">S</span>tore4Riders
          </Link>
        </div>
      </div>

      {/* Right side: Form Container (Fits 100vh on Desktop, scrollable on mobile) */}
      <div className="w-full md:w-1/2 h-full flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 overflow-y-auto lg:overflow-hidden relative">
        
        {/* Mobile Logo */}
        <div className="w-full mb-6 md:hidden">
          <Link href="/" className="font-serif text-2xl tracking-widest text-neutral-900 flex items-center">
            <span className="text-banner">S</span>tore4Riders
          </Link>
        </div>

        <div className="w-full max-w-sm lg:max-w-md flex flex-col gap-6 my-auto">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="font-serif text-3xl lg:text-4xl text-neutral-800 tracking-wide uppercase">
              {isLogin ? "HEY RIDER!" : "JOIN THE PACK"}
            </h1>
            <p className="text-xs lg:text-sm text-neutral-500 font-medium">
              {isLogin 
                ? "Enter your credentials to access your rider account" 
                : "Create your account to track orders and save gear"}
            </p>
          </div>
          
          {/* Form */}
          {isLogin ? <LoginForm /> : <RegisterForm />}
          
          {/* Switch link preserving checkout redirect query */}
          <div className="pt-2 text-left">
            <span className="text-neutral-500 font-serif text-sm lg:text-base">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <Link 
              href={isLogin ? `/register${redirectQuery}` : `/login${redirectQuery}`} 
              className="font-serif text-sm lg:text-base text-neutral-900 font-bold underline decoration-1 underline-offset-4 hover:text-banner transition-colors"
            >
              {isLogin ? "Register here" : "Login here"}
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AuthModule;
