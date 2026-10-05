"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForgotPassword } from "@/core/hooks/useAuth";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordInputs = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInputs>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const [submitted, setSubmitted] = useState(false);
  const forgotMutation = useForgotPassword();

  const onSubmit = (data: ForgotPasswordInputs) => {
    forgotMutation.mutate(data, {
      onSuccess: () => {
        setSubmitted(true);
      }
    });
  };

  if (submitted) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Check your email</h3>
        <p className="text-sm text-neutral-600 mb-6">
          We've sent a password reset link to your email address. Please check your inbox.
        </p>
        <Link href="/login" className="text-sm font-medium text-banner hover:text-orange-600">
          &larr; Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-banner focus:border-banner sm:text-sm"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={forgotMutation.isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-banner hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banner disabled:opacity-70 transition-colors"
        >
          {forgotMutation.isPending ? "Sending..." : "Send reset link"}
        </button>
      </div>

      <div className="text-center">
        <Link href="/login" className="text-sm font-medium text-banner hover:text-orange-600">
          &larr; Back to login
        </Link>
      </div>
    </form>
  );
}
