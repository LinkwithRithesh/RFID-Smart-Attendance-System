"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCw,
  ArrowRight,
  Shield,
  GraduationCap,
  Users,
  Lock,
  UserCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const LoginCard: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [activeRole, setActiveRole] = useState<"STUDENT" | "FACULTY" | "ADMIN">("STUDENT");
  const [loginId, setLoginId] = useState("student@campus.edu");
  const [password, setPassword] = useState("ChangeMe123!");
  const [rememberMe, setRememberMe] = useState(true);
  const [captchaCode, setCaptchaCode] = useState("5qmmc");
  const [captchaInput, setCaptchaInput] = useState("5qmmc");
  const [error, setError] = useState<string | null>(null);

  // Forgot password OTP simulation state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState("student@campus.edu");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const generateCaptcha = () => {
    const chars = "23456789abcdefghjkmnpqrstuvwxyz";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput(result); // Auto-fill for quick demo convenience
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      generateCaptcha();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleRoleChange = (role: "STUDENT" | "FACULTY" | "ADMIN") => {
    setActiveRole(role);
    setError(null);
    if (role === "ADMIN") {
      setLoginId("admin@campus.edu");
      setPassword("ChangeMe123!");
      setOtpEmail("admin@campus.edu");
    } else if (role === "FACULTY") {
      setLoginId("faculty@campus.edu");
      setPassword("ChangeMe123!");
      setOtpEmail("faculty@campus.edu");
    } else {
      setLoginId("student@campus.edu");
      setPassword("ChangeMe123!");
      setOtpEmail("student@campus.edu");
    }
    generateCaptcha();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
      setError("Incorrect security CAPTCHA code. Please re-enter.");
      generateCaptcha();
      return;
    }

    try {
      await login({ loginId, password });
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please verify your ID and password.");
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(generated);
    setOtpInput(generated);
    setOtpSent(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === otpCode) {
      setResetSuccess(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setResetSuccess(false);
        setOtpSent(false);
      }, 2000);
    } else {
      alert("Invalid OTP code. Please enter the correct code.");
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-6 sm:p-8 font-sans text-slate-800">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black tracking-tight text-[#0B2C5C]">
          Sign In to SmartAttend
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          University Biometric & IoT Attendance Gateway
        </p>
      </div>

      {/* 1-Click Role Switcher Demo Bar */}
      <div className="mb-6">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
          <span>Quick 1-Click Demo Accounts</span>
          <span className="text-emerald-700 font-bold">• Active</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => handleRoleChange("STUDENT")}
            className={`py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all ${
              activeRole === "STUDENT"
                ? "bg-white text-[#0B2C5C] shadow-xs border border-[#E2E8F0]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4 text-[#0B2C5C]" />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange("FACULTY")}
            className={`py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all ${
              activeRole === "FACULTY"
                ? "bg-white text-[#0B2C5C] shadow-xs border border-[#E2E8F0]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 text-[#0B2C5C]" />
            <span>Faculty</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange("ADMIN")}
            className={`py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all ${
              activeRole === "ADMIN"
                ? "bg-white text-[#0B2C5C] shadow-xs border border-[#E2E8F0]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield className="w-4 h-4 text-[#0B2C5C]" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Error Alert (Rose for Status/Error) */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-[#EF4444] text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Email Address
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C] focus:bg-white font-mono transition-colors shadow-xs"
              placeholder="e.g. 2025105002"
            />
            <UserCheck className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-slate-700 font-bold">Account Password</label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-[11px] text-[#0B2C5C] hover:underline font-bold"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C] focus:bg-white font-mono transition-colors shadow-xs"
              placeholder="••••••••"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Security CAPTCHA */}
        <div className="p-3 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600">Verification Code</span>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-white border border-[#CBD5E1] rounded font-mono font-black text-sm tracking-widest text-[#0B2C5C] select-none shadow-xs">
                {captchaCode}
              </span>
              <button
                type="button"
                onClick={generateCaptcha}
                className="p-1 rounded text-slate-500 hover:text-[#0B2C5C]"
                title="Refresh CAPTCHA"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <input
            type="text"
            required
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-[#CBD5E1] text-slate-900 focus:outline-none focus:border-[#0B2C5C] font-mono text-center tracking-widest text-xs uppercase"
            placeholder="ENTER CODE"
          />
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between text-[11px]">
          <label className="flex items-center space-x-2 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-300 text-[#0B2C5C] focus:ring-[#0B2C5C]"
            />
            <span className="font-medium">Remember on this device</span>
          </label>
          <span className="text-slate-400 font-mono">Session: 8h</span>
        </div>

        {/* Actionable Coral Pill Button (Exclusive to CTA) */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-sm flex items-center justify-center space-x-2 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
        >
          <span>{isLoading ? "Verifying Credentials..." : "Authenticate & Enter"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Forgot Password OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-black text-[#0B2C5C] flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-[#F4573C]" />
                <span>Self-Service Password Recovery</span>
              </h3>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Enter registered university institutional email to receive a single-use OTP code:
                </p>
                <input
                  type="email"
                  required
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-bold"
                >
                  Send OTP Code
                </button>
              </form>
            ) : resetSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-center text-xs space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <div className="font-bold">Password Reset Verified!</div>
                <div className="text-slate-600">Temporary password sent to {otpEmail}.</div>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3 text-xs">
                <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  Simulated OTP sent: <span className="font-mono font-bold text-[#0B2C5C]">{otpCode}</span>
                </div>
                <label className="block text-slate-700 font-bold">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-center font-mono font-black tracking-widest text-slate-900 text-base"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-bold"
                >
                  Verify OTP & Reset
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
