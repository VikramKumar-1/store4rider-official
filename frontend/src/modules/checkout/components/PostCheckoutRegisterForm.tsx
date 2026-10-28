import React, { useState, useEffect } from "react";
import { useRegister, useLogin, useForgotPassword } from "@/core/hooks/useAuth";
import { apiClient } from "@/core/api/client";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
  <div className="flex items-center gap-2 mb-1">
    {isValid ? (
      <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
    ) : (
      <XCircleIcon className="w-4 h-4 text-neutral-300 flex-shrink-0" />
    )}
    <span className={`text-[10px] ${isValid ? "text-emerald-700 font-medium" : "text-neutral-500"}`}>
      {text}
    </span>
  </div>
);

export function PostCheckoutRegisterForm({ email, name }: { email: string; name: string }) {
  const [password, setPassword] = useState("");
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [resetSent, setResetSent] = useState(false);
  
  const registerMutation = useRegister({ disableRedirect: true });
  const loginMutation = useLogin({ disableRedirect: true });
  const forgotMutation = useForgotPassword();
  const router = useRouter();

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) return;
    forgotMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setResetSent(true);
          toast.success(`Password reset link sent to ${email}`);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error || "Failed to send reset link");
        },
      }
    );
  };

  // Password validation checks for the UI checklist
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpperAndLowerCase = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const isPasswordValid = hasMinLength && hasNumber && hasUpperAndLowerCase && hasSymbol;

  useEffect(() => {
    let mounted = true;
    const checkEmail = async () => {
      try {
        const res = await apiClient.post("/auth/check-email", { email });
        if (mounted) {
          setIsExistingAccount(res.data?.data?.exists || false);
        }
      } catch (err) {
        // Fallback to non-existing, if error
      } finally {
        if (mounted) setIsChecking(false);
      }
    };
    checkEmail();
    return () => { mounted = false; };
  }, [email]);

  useEffect(() => {
    if (registerMutation.isSuccess || loginMutation.isSuccess) {
      const timer = setTimeout(() => {
        router.push("/account/orders");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [registerMutation.isSuccess, loginMutation.isSuccess, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    if (isExistingAccount) {
      // Login Flow
      loginMutation.mutate({ email, password });
    } else {
      // Register Flow
      if (!isPasswordValid) return;

      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || "Guest";
      const lastName = nameParts.slice(1).join(" ") || "User";

      registerMutation.mutate({
        email,
        password,
        firstName,
        lastName,
      });
    }
  };

  if (isChecking) {
    return (
      <div className="w-full max-w-sm mt-1 mb-4 bg-white border border-neutral-200 p-4 shadow-xs text-left flex items-center justify-center h-[180px]">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (registerMutation.isSuccess || loginMutation.isSuccess) {
    return (
      <div className="w-full max-w-sm mt-1 mb-4 bg-white border border-emerald-200 p-4 shadow-xs text-left h-[200px] flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
          <CheckCircleIcon className="w-6 h-6" />
        </div>
        <h3 className="text-emerald-800 font-bold text-xs tracking-wide uppercase mb-1">
          {loginMutation.isSuccess ? "Logged In Successfully!" : "Account Created!"}
        </h3>
        <div className="flex items-center gap-2 mt-2 text-neutral-500 text-xs font-medium">
          <div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
          Redirecting to your orders...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mt-1 mb-4 bg-white border border-neutral-200 p-4 sm:p-5 shadow-xs text-left">
      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1">
        {isExistingAccount ? "Sign In & Track" : "Track Your Order"}
      </h3>
      <p className="text-[11px] text-neutral-500 mb-3 leading-normal">
        {isExistingAccount 
          ? "This email is already registered. Please sign in to track your order." 
          : "Create an account to easily track this order and speed up future checkouts."}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        {loginMutation.isError && (
          <div className="bg-red-50 border border-red-100 p-2 rounded text-red-800 text-[11px] font-medium">
            {(loginMutation.error as any)?.response?.data?.error || "Invalid credentials. Please verify your password."}
          </div>
        )}

        {resetSent && (
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded text-emerald-900 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-0.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Reset Link Sent Directly to Email!</span>
            </div>
            <p className="text-emerald-700">
              We sent a password reset link to <strong>{email}</strong>. Check your inbox and click the button inside to set your password.
            </p>
            <div className="mt-1.5 pt-1 border-t border-emerald-100 flex items-center justify-between text-[10px]">
              <span className="text-neutral-500">Didn&apos;t get the email?</span>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotMutation.isPending}
                className="font-bold text-brand hover:underline cursor-pointer disabled:opacity-50"
              >
                {forgotMutation.isPending ? "Sending..." : "Resend Link"}
              </button>
            </div>
          </div>
        )}
        
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5 block">
            Email (Auto-linked for tracking)
          </label>
          <input 
            type="email" 
            value={email} 
            disabled 
            className="w-full border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs text-neutral-600 rounded-none cursor-not-allowed"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 block">
              {isExistingAccount ? "Enter Password *" : "Set a Password *"}
            </label>
            {isExistingAccount && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotMutation.isPending}
                className="text-[10px] font-semibold text-brand hover:underline cursor-pointer disabled:opacity-50"
              >
                {forgotMutation.isPending ? "Sending link..." : "Forgot password?"}
              </button>
            )}
          </div>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isExistingAccount ? "Your password" : "Min 8 characters"}
            required
            className="w-full border border-neutral-300 focus:border-brand px-3 py-1.5 text-xs text-neutral-900 focus:outline-none rounded-none transition-colors"
          />
        </div>
        
        {!isExistingAccount && (
          <div className="bg-neutral-50 p-2.5 rounded border border-neutral-100">
            <ValidationItem isValid={hasMinLength} text="Minimum 8 characters" />
            <ValidationItem isValid={hasNumber} text="Must contain at least 1 number" />
            <ValidationItem isValid={hasUpperAndLowerCase} text="Must contain capital and lowercase letters" />
            <ValidationItem isValid={hasSymbol} text="Must contain at least 1 special character" />
          </div>
        )}

        <button 
          type="submit" 
          disabled={registerMutation.isPending || loginMutation.isPending || !password || (!isExistingAccount && !isPasswordValid)}
          className="w-full bg-neutral-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider py-2.5 transition-colors disabled:opacity-50 rounded-none cursor-pointer"
        >
          {isExistingAccount 
            ? (loginMutation.isPending ? "Logging in..." : "Log In & Track Order") 
            : (registerMutation.isPending ? "Creating..." : "Create Account & Track Order")
          }
        </button>
      </form>
    </div>
  );
}
