import React, { useState, useEffect } from "react";
import { useRegister, useLogin } from "@/core/hooks/useAuth";
import { apiClient } from "@/core/api/client";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

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
  
  const registerMutation = useRegister();
  const loginMutation = useLogin({ disableRedirect: true });
  const router = useRouter();

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
        router.push("/");
      }, 1500);
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
      <div className="w-full max-w-sm mt-2 mb-10 bg-white border border-neutral-200 p-6 shadow-sm text-left flex items-center justify-center h-[280px]">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (registerMutation.isSuccess || loginMutation.isSuccess) {
    return (
      <div className="w-full max-w-sm mt-2 mb-10 bg-white border border-emerald-200 p-6 shadow-sm text-left h-[280px] flex items-center justify-center">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded text-emerald-800 text-xs font-medium text-center w-full">
          {loginMutation.isSuccess ? "Logged in successfully! " : "Account created successfully! "} 
          <br/> Redirecting to home...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mt-2 mb-10 bg-white border border-neutral-200 p-6 shadow-sm text-left">
      <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-2">
        {isExistingAccount ? "Sign In & Track" : "Track Your Order"}
      </h3>
      <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
        {isExistingAccount 
          ? "This email is already registered. Please sign in to track your order." 
          : "Create an account to easily track this order and speed up future checkouts."}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {loginMutation.isError && (
          <div className="bg-red-50 border border-red-100 p-2 rounded text-red-800 text-[11px] font-medium mb-1">
            {(loginMutation.error as any)?.response?.data?.error || "Login failed. Please check your password."}
          </div>
        )}
        
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1 block">Email (Auto-linked for tracking)</label>
          <input 
            type="email" 
            value={email} 
            disabled 
            className="w-full border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-500 rounded-none cursor-not-allowed"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 mb-1 block">
            {isExistingAccount ? "Enter Password *" : "Set a Password *"}
          </label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isExistingAccount ? "Your password" : "Min 8 characters"}
            required
            className="w-full border border-neutral-300 focus:border-brand px-3 py-2 text-sm text-neutral-900 focus:outline-none rounded-none transition-colors"
          />
        </div>
        
        {!isExistingAccount && (
          <div className="bg-neutral-50 p-3 rounded border border-neutral-100 mt-1">
            <ValidationItem isValid={hasMinLength} text="Minimum 8 characters" />
            <ValidationItem isValid={hasNumber} text="Must contain at least 1 number" />
            <ValidationItem isValid={hasUpperAndLowerCase} text="Must contain capital and lowercase letters" />
            <ValidationItem isValid={hasSymbol} text="Must contain at least 1 special character" />
          </div>
        )}

        <button 
          type="submit" 
          disabled={registerMutation.isPending || loginMutation.isPending || !password || (!isExistingAccount && !isPasswordValid)}
          className="w-full bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider py-3 mt-1 transition-colors disabled:opacity-50 rounded-none cursor-pointer"
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
