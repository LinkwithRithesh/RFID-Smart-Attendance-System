"use client";

import React from "react";
import { Building2, ShieldCheck } from "lucide-react";

export const LoginHeader: React.FC = () => {
  return (
    <div className="text-center mb-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-700 text-white font-extrabold text-xl mb-3 shadow-md">
        AU
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
        CeGov Portal Sign In
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Enter your university credentials to sign in
      </p>
    </div>
  );
};
