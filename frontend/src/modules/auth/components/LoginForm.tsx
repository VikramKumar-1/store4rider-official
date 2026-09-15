"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/core/hooks/useAuth";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormInputs = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, watch } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema)
  });

  const passwordValue = watch("password", "");
  const loginMutation = useLogin();

  // Password validation checks for the UI checklist
  const hasMinLength = passwordValue.length >= 8;
  const hasNumber = /\d/.test(passwordValue);
  const hasUpperAndLowerCase = /[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue);

  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
      {isValid ? (
        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      ) : (
        <XCircleIcon className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
      )}
      <span className={isValid ? "text-neutral-700 font-medium" : ""}>{text}</span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(data => loginMutation.mutate(data))} className="flex flex-col gap-4 w-full">
      
      {/* Email Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] md:text-xs uppercase tracking-wider font-semibold text-neutral-600">
          Email Address
        </label>
        <input
          type="email"
          placeholder="rider@example.com"
          className="w-full border border-neutral-300 p-2.5 md:p-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-banner rounded-xs transition-colors bg-neutral-50/50 focus:bg-white"
          {...register("email")}
        />
      </div>

      {/* Password Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] md:text-xs uppercase tracking-wider font-semibold text-neutral-600">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="w-full border border-neutral-300 p-2.5 md:p-3 pr-11 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-banner rounded-xs transition-colors bg-neutral-50/50 focus:bg-white tracking-widest"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
          >
            {showPassword ? (
              <EyeIcon className="w-4 h-4" />
            ) : (
              <EyeSlashIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Password Validation Checklist */}
      <div className="flex flex-col gap-1 pt-0.5">
        <ValidationItem isValid={hasMinLength} text="Minimum 8 characters" />
        <ValidationItem isValid={hasNumber} text="Must contain at least 1 number" />
        <ValidationItem isValid={hasUpperAndLowerCase} text="Must contain capital and lowercase letters" />
        <ValidationItem isValid={hasSymbol} text="Must contain at least 1 special character" />
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={loginMutation.isPending}
        className="w-full bg-banner hover:bg-orange-600 text-white py-3.5 mt-1 text-xs md:text-sm font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm cursor-pointer rounded-xs"
      >
        {loginMutation.isPending ? "SIGNING IN..." : "LOGIN"} 
        <span className="text-base leading-none">→</span>
      </button>

    </form>
  );
}

export default LoginForm;
