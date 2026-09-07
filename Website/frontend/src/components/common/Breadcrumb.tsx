"use client";

import React from "react";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
      <div className="flex items-center space-x-1 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
        <Home className="w-3.5 h-3.5" />
        <span>CeGov Campus</span>
      </div>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span
            onClick={item.onClick}
            className={`${
              index === items.length - 1
                ? "font-semibold text-slate-800 dark:text-slate-100 cursor-default"
                : "hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            }`}
          >
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};
