"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  ChevronDown,
  Shield,
  GraduationCap,
  Users,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NotificationBadge } from "./NotificationBadge";
import Link from "next/link";

interface NavbarProps {
  onOpenSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const [clock, setClock] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [academicDropdown, setAcademicDropdown] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const role = user?.role || "STUDENT";
  const userName = user?.name || "User";
  const userId = user?.userId || "";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] text-slate-800 h-[56px] flex items-center px-4 sm:px-6 shadow-xs font-sans">
      <div className="w-full flex items-center justify-between">
        {/* Left Side: Sidebar Hamburger + University Logo & Horizontal Dropdown Nav */}
        <div className="flex items-center space-x-4 sm:space-x-6">
          <button
            onClick={onOpenSidebar}
            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0B2C5C] hover:bg-slate-100 transition-colors lg:hidden"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#0B2C5C] text-white flex items-center justify-center font-black text-xs shadow-xs">
              AU
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-base tracking-tight text-[#0B2C5C]">SmartAttend</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EEF2F8] text-[#0B2C5C] uppercase tracking-wider">
                  ERP Portal
                </span>
              </div>
            </div>
          </Link>

          {/* Institutional Horizontal Dropdowns (Reference Image 1: About ▾ Academics ▾) */}
          <nav className="hidden xl:flex items-center space-x-5 text-xs font-bold text-slate-600">
            <div className="relative">
              <button
                type="button"
                onClick={() => setAcademicDropdown(!academicDropdown)}
                className="flex items-center space-x-1 hover:text-[#0B2C5C] transition-colors py-2"
              >
                <span>Academics</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {academicDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAcademicDropdown(false)} />
                  <div className="absolute left-0 mt-1 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 py-1.5">
                    <Link
                      href="/timetable"
                      onClick={() => setAcademicDropdown(false)}
                      className="block px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-[#EEF2F8] hover:text-[#0B2C5C]"
                    >
                      Class Timetable
                    </Link>
                    <Link
                      href="/attendance"
                      onClick={() => setAcademicDropdown(false)}
                      className="block px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-[#EEF2F8] hover:text-[#0B2C5C]"
                    >
                      Attendance Details
                    </Link>
                    <Link
                      href="/od-requests"
                      onClick={() => setAcademicDropdown(false)}
                      className="block px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-[#EEF2F8] hover:text-[#0B2C5C]"
                    >
                      OD & Medical Leaves
                    </Link>
                  </div>
                </>
              )}
            </div>

            <Link href="/attendance" className="hover:text-[#0B2C5C] transition-colors">
              Attendance Roster
            </Link>
            <Link href="/helpdesk" className="hover:text-[#0B2C5C] transition-colors">
              Help Desk
            </Link>
          </nav>
        </div>

        {/* Center/Right: Live Clock, Notification Badge, Role Pill & Coral Pill CTA */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 text-xs font-medium">
          {/* Live System Clock */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-slate-600 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span>{clock || "10:00:00 AM"}</span>
          </div>

          {/* Actionable Coral Pill CTA (Matches SSN Reference 'Know More' pill button) */}
          <Link
            href="/od-requests"
            className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs shadow-xs transition-all hover:shadow"
          >
            <span>Apply OD / Leave</span>
          </Link>

          {/* Notification Center */}
          <NotificationBadge />

          <div className="h-5 w-px bg-slate-200" />

          {/* User Profile Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#0B2C5C] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {userName.charAt(0)}
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="font-bold text-xs text-[#0B2C5C] tracking-tight">{userName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{userId} • {role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 text-slate-800 overflow-hidden py-1 text-xs">
                  <div className="px-3.5 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <div className="font-bold text-[#0B2C5C]">{userName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{userId} ({role})</div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3.5 py-2 hover:bg-[#EEF2F8] hover:text-[#0B2C5C] font-semibold text-slate-700"
                  >
                    View & Update Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3.5 py-2 hover:bg-[#EEF2F8] hover:text-[#0B2C5C] font-semibold text-slate-700"
                  >
                    System Settings
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-[#EF4444] font-bold border-t border-[#E2E8F0]"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
