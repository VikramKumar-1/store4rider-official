"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useResetPassword } from "@/core/hooks/useAuth";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordInputs = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm({ token }: { token: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordInputs>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const resetMutation = useResetPassword();
  const passwordValue = watch("password", "");

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

  const onSubmit = (data: ResetPasswordInputs) => {
    resetMutation.mutate({ token, password: data.password });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
          New Password
        </label>
        <div className="mt-1 relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-banner focus:border-banner sm:text-sm pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
          >
            {showPassword ? (
              <EyeIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1 pt-0.5 pb-2">
        <ValidationItem isValid={hasMinLength} text="Minimum 8 characters" />
        <ValidationItem isValid={hasNumber} text="Must contain at least 1 number" />
        <ValidationItem isValid={hasUpperAndLowerCase} text="Must contain capital and lowercase letters" />
        <ValidationItem isValid={hasSymbol} text="Must contain at least 1 special character" />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
          Confirm New Password
        </label>
        <div className="mt-1">
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            {...register("confirmPassword")}
            className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-banner focus:border-banner sm:text-sm"
          />
        </div>
        {errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={resetMutation.isPending || !hasMinLength || !hasNumber || !hasUpperAndLowerCase || !hasSymbol}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-banner hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banner disabled:opacity-70 transition-colors"
        >
          {resetMutation.isPending ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </form>
  );
}
