"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  children,
  onClick,
  className = "",
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
}: ButtonProps) {
    //* btn style types
  const baseClasses =
    "flex w-full items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 italic";
  const variantClasses = {
    primary:
      "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 focus:ring-gray-500",
    secondary:
      "bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500",
  };
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm rounded-sm",
    md: "px-4 py-2 text-base rounded-md",
    lg: "px-6 py-3 text-lg rounded-md",
  };
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
    >
      {children}
    </button>
  );
}
