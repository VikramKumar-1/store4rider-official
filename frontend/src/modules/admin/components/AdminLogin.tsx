"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/core/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import Image from "next/image";

const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginInputs = z.infer<typeof adminLoginSchema>;

export function AdminLogin() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const loginMutation = useLogin({ disableRedirect: true });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginInputs>({
    resolver: zodResolver(adminLoginSchema),
  });

  // If already logged in as admin, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated && user?.role && user.role !== "customer") {
      router.replace("/admin");
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = (data: AdminLoginInputs) => {
    // Override the useLogin hook's default redirect behavior by handling it here
    loginMutation.mutate(data, {
      onSuccess: (res) => {
        // useLogin automatically calls setAuth
        if (res?.data?.user?.role && res.data.user.role !== "customer") {
          router.push("/admin");
        } else {
          // If a regular customer tries to use the admin login
          router.push("/");
        }
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-950 p-6 flex flex-col items-center justify-center border-b-4 border-brand">
          <div className="w-48 h-12 relative mb-4 bg-white rounded-lg p-2 shadow-inner">
            <Image 
              src="/Store4riders-Logo.jpg" 
              alt="Store4Riders Logo" 
              fill 
              className="object-contain p-1" 
            />
          </div>
          <h1 className="text-white font-sans font-bold text-xl tracking-widest uppercase">Admin Portal</h1>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
                placeholder="admin@store4riders.com"
              />
              {errors.email && (
                <p className="text-brand text-xs mt-1.5 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                {...register("password")}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-brand text-xs mt-1.5 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-brand text-white font-bold uppercase tracking-widest py-3.5 rounded-lg mt-2 hover:bg-orange-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? "Authenticating..." : "Secure Login"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Authorized personnel only. All access is logged.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
