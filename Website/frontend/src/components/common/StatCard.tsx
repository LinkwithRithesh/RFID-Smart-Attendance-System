"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp?: boolean;
    isAlert?: boolean;
  };
  colorScheme?: "blue" | "emerald" | "amber" | "rose" | "indigo";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = "blue",
}) => {
  const schemeMap = {
    blue: {
      bg: "bg-gradient-to-br from-blue-500/15 to-blue-600/5 text-blue-600 dark:text-blue-400 border border-blue-500/20",
      glow: "group-hover:border-blue-500/40",
    },
    emerald: {
      bg: "bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
      glow: "group-hover:border-emerald-500/40",
    },
    amber: {
      bg: "bg-gradient-to-br from-amber-500/15 to-amber-600/5 text-amber-600 dark:text-amber-400 border border-amber-500/20",
      glow: "group-hover:border-amber-500/40",
    },
    rose: {
      bg: "bg-gradient-to-br from-rose-500/15 to-rose-600/5 text-rose-600 dark:text-rose-400 border border-rose-500/20",
      glow: "group-hover:border-rose-500/40",
    },
    indigo: {
      bg: "bg-gradient-to-br from-indigo-500/15 to-indigo-600/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
      glow: "group-hover:border-indigo-500/40",
    },
  };

  const scheme = schemeMap[colorScheme] || schemeMap.blue;

  return (
    <div className={`group relative glass-card rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-blue-900/10 ${scheme.glow}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${scheme.bg} transition-transform group-hover:scale-110 duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </h3>
        {trend && (
          <span
            className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${
              trend.isAlert
                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                : trend.isUp
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
