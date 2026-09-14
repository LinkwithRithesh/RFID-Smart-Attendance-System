"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  text?: string;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  text = "Loading CeGov Portal...",
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 space-y-3 ${className}`}
    >
      <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
      {text && (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {text}
        </span>
      )}
    </div>
  );
};
