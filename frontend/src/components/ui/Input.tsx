"use client";

import React, { forwardRef, memo } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, label, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        {label && <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>}
        <input
          ref={ref}
          className={`flex h-11 w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 ${
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "hover:border-zinc-400"
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500 font-medium mt-1">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default memo(Input);
