"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@/core/hooks/useAuth";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type RegisterFormInputs = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors } 
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password", "");
  const registerMutation = useRegister();

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
    <form onSubmit={handleSubmit(data => registerMutation.mutate(data))} className="flex flex-col gap-3.5 w-full">
      
      {/* Name Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] md:text-xs uppercase tracking-wider font-semibold text-neutral-600">
            First Name
          </label>
          <input
            type="text"
            placeholder="John"
            className={`w-full border ${errors.firstName ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'} p-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-banner rounded-xs transition-colors bg-neutral-50/50 focus:bg-white`}
            {...register("firstName")}
          />
          {errors.firstName && (
            <span className="text-[11px] text-red-500 font-medium">{errors.firstName.message}</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] md:text-xs uppercase tracking-wider font-semibold text-neutral-600">
            Last Name
          </label>
          <input
            type="text"
            placeholder="Doe"
            className={`w-full border ${errors.lastName ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'} p-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-banner rounded-xs transition-colors bg-neutral-50/50 focus:bg-white`}
            {...register("lastName")}
          />
          {errors.lastName && (
            <span className="text-[11px] text-red-500 font-medium">{errors.lastName.message}</span>
          )}
        </div>
      </div>

      {/* Email Input */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] md:text-xs uppercase tracking-wider font-semibold text-neutral-600">
          Email Address
        </label>
        <input
          type="email"
          placeholder="rider@example.com"
          className={`w-full border ${errors.email ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'} p-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-banner rounded-xs transition-colors bg-neutral-50/50 focus:bg-white`}
          {...register("email")}
        />
        {errors.email && (
          <span className="text-[11px] text-red-500 font-medium">{errors.email.message}</span>
        )}
      </div>

      {/* Password Input */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] md:text-xs uppercase tracking-wider font-semibold text-neutral-600">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className={`w-full border ${errors.password ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'} p-2.5 pr-11 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-banner rounded-xs transition-colors bg-neutral-50/50 focus:bg-white tracking-widest`}
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
        {errors.password && (
          <span className="text-[11px] text-red-500 font-medium">{errors.password.message}</span>
        )}
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
        disabled={registerMutation.isPending}
        className="w-full bg-banner hover:bg-orange-600 text-white py-3 mt-1 text-xs md:text-sm font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm cursor-pointer rounded-xs"
      >
        {registerMutation.isPending ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"} 
        <span className="text-base leading-none">→</span>
      </button>

    </form>
  );
}

export default RegisterForm;
