// block/tag component
"use client";

import { ReactNode } from "react";

interface BlockProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Block({ 
  children, 
  icon, 
  className = "",
  onClick 
}: BlockProps) {
  return (
    <span
      contentEditable={false}
      className={`
        inline-flex items-center gap-2 px-3 py-1 rounded-md 
        bg-gray-100 text-gray-700 text-sm font-medium
        select-none cursor-pointer hover:bg-gray-200 transition-colors
        ${className}
      `}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}