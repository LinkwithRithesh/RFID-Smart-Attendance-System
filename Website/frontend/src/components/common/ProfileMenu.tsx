"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  GraduationCap,
  BookOpen,
  LogOut,
  ChevronDown,
} from "lucide-react";

export const ProfileMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const roleIconMap = {
    ADMIN: <Shield className="w-3.5 h-3.5 text-rose-500" />,
    FACULTY: <BookOpen className="w-3.5 h-3.5 text-blue-500" />,
    STUDENT: <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />,
  };

  const roleColorMap = {
    ADMIN: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200",
    FACULTY: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200",
    STUDENT: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-linear-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
          {user.name ? user.name.charAt(0) : "U"}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
            {user.name}
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {user.userId} • {user.department}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {user.name}
              </span>
              <span
                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleColorMap[user.role]}`}
              >
                {roleIconMap[user.role]}
                <span>{user.role}</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
            {user.role === "STUDENT" && (
              <div className="mt-2 text-xs flex items-center justify-between font-medium">
                <span className="text-slate-500">Attendance Rate:</span>
                <span
                  className={`font-bold ${
                    (user.attendancePercentage || 100) < 75
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }`}
                >
                  {user.attendancePercentage}%
                </span>
              </div>
            )}
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of CeGov Portal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
