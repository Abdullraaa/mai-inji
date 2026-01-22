"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { buttonHover } from "@/lib/variants";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    isLoading?: boolean;
    loadingText?: string;
    size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", isLoading, loadingText, size = "md", children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center font-black uppercase tracking-widest transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

        const sizeStyles = {
            sm: "px-4 py-2 text-[10px]",
            md: "px-8 py-4 text-xs",
            lg: "px-10 py-5 text-sm",
        };

        const variantStyles = {
            primary: "bg-gradient-to-r from-burgundy to-orange text-white rounded-2xl hover:brightness-110 shadow-xl shadow-orange-500/20 active:scale-95 border border-white/10",
            secondary: "bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-2xl hover:opacity-90 shadow-xl active:scale-95",
            outline: "bg-transparent border border-burgundy text-burgundy rounded-2xl hover:bg-burgundy/5 active:scale-95",
            ghost: "bg-transparent text-gray-500 hover:text-burgundy active:scale-95",
        };

        return (
            <motion.button
                ref={ref}
                variants={buttonHover}
                whileHover={!disabled && !isLoading ? "hover" : undefined}
                whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
                className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
                disabled={disabled || isLoading}
                {...(props as HTMLMotionProps<"button">)}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {loadingText || "Processing..."}
                    </span>
                ) : (
                    children
                )}
            </motion.button>
        );
    }
);

Button.displayName = "Button";

export default Button;
