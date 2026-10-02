import React, { useState, useEffect } from "react";
import { useRegister, useLogin } from "@/core/hooks/useAuth";

export function PostCheckoutRegisterForm({ email, name }: { email: string; name: string }) {
  const [password, setPassword] = useState("");
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  
  const registerMutation = useRegister();
  const loginMutation = useLogin({ disableRedirect: true }); // Prevent redirect to let them see success msg
  
  // Detect if registration fails because email exists
  useEffect(() => {
    if (registerMutation.isError) {
      const errMsg = (registerMutation.error as any)?.response?.data?.error?.toLowerCase() || "";
      if (errMsg.includes("already in use") || errMsg.includes("exists")) {
        setIsExistingAccount(true);
      }
    }
  }, [registerMutation.isError, registerMutation.error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    if (isExistingAccount) {
      // Login Flow
      loginMutation.mutate({ email, password });
    } else {
      // Register Flow
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

  if (registerMutation.isSuccess || loginMutation.isSuccess) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded text-emerald-800 text-xs font-medium text-center">
        {loginMutation.isSuccess ? "Logged in successfully! " : "Account created successfully! "} 
        You can now track your order from your dashboard.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {isExistingAccount && (
        <div className="bg-blue-50 border border-blue-100 p-3 rounded text-blue-800 text-[11px] font-medium mb-1">
          An account with this email already exists. Please log in to track your order and view history.
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
          minLength={isExistingAccount ? 1 : 8}
          className="w-full border border-neutral-300 focus:border-brand px-3 py-2 text-sm text-neutral-900 focus:outline-none rounded-none transition-colors"
        />
      </div>
      <button 
        type="submit" 
        disabled={registerMutation.isPending || loginMutation.isPending || !password}
        className="w-full bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider py-3 mt-1 transition-colors disabled:opacity-50 rounded-none"
      >
        {isExistingAccount 
          ? (loginMutation.isPending ? "Logging in..." : "Log In & Track Order") 
          : (registerMutation.isPending ? "Creating..." : "Create Account & Track Order")
        }
      </button>
    </form>
  );
}
