"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb: { label: string; href?: string }[];
  action?: React.ReactNode;
  imageUrl?: string;
  categoryTag?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  action,
  imageUrl = "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80",
  categoryTag = "DEPARTMENT OF COMPUTER SCIENCE & ENGG",
}: PageHeaderProps) {
  return (
    <div className="space-y-3 mb-6">
      {/* 1. INSTITUTIONAL NAVY BANNER (Reference Image 2 Department Header Style) */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#071E40] via-[#0B2C5C] to-[#123A73] text-white shadow-lg border border-[#0B2C5C]/40">
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-block text-[11px] font-mono font-bold tracking-widest uppercase px-2.5 py-0.5 rounded bg-white/10 text-cyan-200 border border-white/20">
              {categoryTag}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-snug">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right Supporting Photo Thumbnail or Action Pill */}
          <div className="flex items-center space-x-4 self-stretch md:self-auto justify-between md:justify-end">
            {imageUrl && (
              <div className="hidden sm:block w-28 h-20 rounded-xl overflow-hidden border-2 border-white/30 shadow-md shrink-0">
                <img
                  src={imageUrl}
                  alt="Department Banner"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {action && <div className="shrink-0">{action}</div>}
          </div>
        </div>

        {/* Subtle Decorative University Grid Accent */}
        <div className="absolute right-0 bottom-0 opacity-10 w-96 h-96 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* 2. BREADCRUMB SUB-NAVIGATION (Reference: Home | Department Profile | ...) */}
      <nav className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 px-1">
        <Link href="/dashboard" className="hover:text-[#0B2C5C] transition-colors">
          Home
        </Link>
        {breadcrumb.map((item, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            {item.href ? (
              <Link href={item.href} className="hover:text-[#0B2C5C] transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-[#0B2C5C] font-bold">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}
