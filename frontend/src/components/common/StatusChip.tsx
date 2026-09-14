"use client";

import React from "react";

interface StatusChipProps {
  status: string;
  size?: "sm" | "md";
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = "md" }) => {
  const normalized = status?.toUpperCase() || "UNKNOWN";

  let colorClasses =
    "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20";
  let dotColor = "bg-slate-400";
  let isPulsing = false;

  if (
    normalized === "PRESENT" ||
    normalized === "ACTIVE" ||
    normalized === "ONLINE" ||
    normalized === "EXCELLENT" ||
    normalized === "SATISFACTORY"
  ) {
    colorClasses =
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    dotColor = "bg-emerald-500";
    isPulsing = true;
  } else if (
    normalized === "ABSENT" ||
    normalized === "OFFLINE" ||
    normalized === "INACTIVE" ||
    normalized === "WARNING_LOW_ATTENDANCE" ||
    normalized === "URGENT"
  ) {
    colorClasses =
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30";
    dotColor = "bg-rose-500";
  } else if (
    normalized === "LATE" ||
    normalized === "WARNING" ||
    normalized === "ON_LEAVE" ||
    normalized === "HIGH"
  ) {
    colorClasses =
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
    dotColor = "bg-amber-500";
  } else if (
    normalized === "EXCUSED" ||
    normalized === "CIRCULAR" ||
    normalized === "NORMAL" ||
    normalized === "ADMIN" ||
    normalized === "FACULTY"
  ) {
    colorClasses =
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
    dotColor = "bg-blue-500";
  }

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] font-bold"
      : "px-2.5 py-1 text-xs font-extrabold";

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs uppercase tracking-wide ${sizeClasses} ${colorClasses}`}
    >
      <span className="relative flex h-2 w-2 mr-1.5">
        {isPulsing && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      {normalized.replace(/_/g, " ")}
    </span>
  );
};
