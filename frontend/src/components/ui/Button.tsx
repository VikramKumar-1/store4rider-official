"use client";

import React, { forwardRef, memo } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    
    let baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50";
    
    let variantStyles = "";
    if (variant === "primary") variantStyles = "bg-brand text-white hover:brightness-110 shadow-md hover:shadow-lg active:scale-95";
    if (variant === "secondary") variantStyles = "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold";
    if (variant === "outline") variantStyles = "border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-900 font-semibold shadow-sm";
    if (variant === "ghost") variantStyles = "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 font-semibold";

    let sizeStyles = "";
    if (size === "sm") sizeStyles = "h-9 px-3 text-xs";
    if (size === "md") sizeStyles = "h-10 px-4 py-2 text-sm";
    if (size === "lg") sizeStyles = "h-11 px-8 text-base";

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        disabled={isLoading || props.disabled}
        {...(props as HTMLMotionProps<"button">)}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
export default memo(Button);
