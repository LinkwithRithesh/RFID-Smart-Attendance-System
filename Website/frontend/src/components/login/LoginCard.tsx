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
  Smartphone,
  BookOpen,
  Calendar,
  Building2,
  Clock,
  Send,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";

export const LoginCard: React.FC = () => {
  const { login, isLoading } = useAuth();
  
  // Main Tab: "LOGIN" | "REGISTER" | "FORGOT"
  const [mainTab, setMainTab] = useState<"LOGIN" | "REGISTER" | "FORGOT">("LOGIN");

  // Login state - STRICTLY START EMPTY per Ground Rule 3
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // New Registration State
  const [regRole, setRegRole] = useState<"STUDENT" | "FACULTY">("STUDENT");
  const [regId, setRegId] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regDeptId, setRegDeptId] = useState<number | "">("");
  const [regCourseId, setRegCourseId] = useState<number | "">("");
  const [regSemester, setRegSemester] = useState(1);
  const [regAdmissionYear, setRegAdmissionYear] = useState(new Date().getFullYear());
  const [regDesignation, setRegDesignation] = useState("Assistant Professor");
  const [regRfid, setRegRfid] = useState("");

  // OTP Step State: "FORM" | "OTP" | "CONFIRMATION"
  const [regStep, setRegStep] = useState<"FORM" | "OTP" | "CONFIRMATION">("FORM");
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 minutes
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regSuccessInfo, setRegSuccessInfo] = useState<{ id: number; registrationId: string } | null>(null);

  // Options
  const [departments, setDepartments] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [courses, setCourses] = useState<Array<{ id: number; code: string; name: string }>>([]);

  // Forgot password OTP state
  const [otpForgotEmail, setOtpForgotEmail] = useState("");
  const [otpForgotSent, setOtpForgotSent] = useState(false);
  const [otpForgotCode, setOtpForgotCode] = useState<string | null>(null);
  const [otpForgotInput, setOtpForgotInput] = useState("");
  const [otpForgotNewPassword, setOtpForgotNewPassword] = useState("");
  const [forgotResetSuccess, setForgotResetSuccess] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  const generateCaptcha = () => {
    // Removed lower-case and ambiguous characters to avoid visual confusion
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput(""); // Force manual entry
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Fetch departments when entering Register tab
  useEffect(() => {
    if (mainTab !== "REGISTER") return;
    let mounted = true;
    async function loadDepts() {
      try {
        const res = await api.getDepartments();
        if (mounted && res.success && res.data) {
          setDepartments(res.data);
          if (res.data.length > 0 && !regDeptId) {
            setRegDeptId(res.data[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load departments:", e);
      }
    }
    loadDepts();
    return () => { mounted = false; };
  }, [mainTab]);

  // Fetch courses when selected department changes
  useEffect(() => {
    if (mainTab !== "REGISTER" || !regDeptId) return;
    let mounted = true;
    async function loadCourses() {
      try {
        const res = await api.getCoursesByDepartment(Number(regDeptId));
        if (mounted && res.success && res.data) {
          setCourses(res.data);
          if (res.data.length > 0) {
            setRegCourseId(res.data[0].id);
          } else {
            setRegCourseId("");
          }
        }
      } catch (e) {
        console.error("Failed to load courses:", e);
      }
    }
    loadCourses();
    return () => { mounted = false; };
  }, [mainTab, regDeptId]);

  // OTP Countdown Timer
  useEffect(() => {
    if (regStep !== "OTP") return;
    const interval = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [regStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
      await login({ loginId: loginId.trim(), password });
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please verify your ID and password.");
    }
  };

  // Step 1: Submit Registration Form to Generate OTP
  const handleSendRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regDeptId) {
      setError("Please select a valid department.");
      return;
    }

    if (regRole === "STUDENT" && !regCourseId) {
      setError("Please select a valid course / programme.");
      return;
    }

    setSubmittingReg(true);
    try {
      const payload: any = {
        fullName: regFullName.trim(),
        email: regEmail.trim().toLowerCase(),
        mobile: regMobile.trim(),
        role: regRole,
        departmentId: Number(regDeptId),
        rfidCardId: regRfid.trim() || undefined,
      };

      if (regRole === "STUDENT") {
        payload.rollNumber = regId.trim();
        payload.courseId = Number(regCourseId);
        payload.currentSemester = Number(regSemester);
        payload.admissionYear = Number(regAdmissionYear);
      } else {
        payload.employeeId = regId.trim();
        payload.designation = regDesignation.trim();
      }

      const res = await api.register(payload);
      if (res.success) {
        if (res.devOtp) {
          setDevOtpCode(res.devOtp);
        } else {
          setDevOtpCode(null);
        }
        setOtpCountdown(300);
        setOtpInput("");
        setRegStep("OTP");
      }
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check form entries.");
    } finally {
      setSubmittingReg(false);
    }
  };

  // Step 2: Verify OTP and create Pending Registration
  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpInput || otpInput.trim().length !== 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setSubmittingReg(true);
    try {
      const res = await api.verifyRegisterOtp(regEmail.trim().toLowerCase(), otpInput.trim());
      if (res.success && res.data) {
        setRegSuccessInfo({
          id: res.data.id,
          registrationId: res.data.registrationId,
        });
        setRegStep("CONFIRMATION");
      }
    } catch (err: any) {
      setError(err?.message || "OTP verification failed. Please try again.");
    } finally {
      setSubmittingReg(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError(null);
    setSubmittingReg(true);
    try {
      const payload: any = {
        fullName: regFullName.trim(),
        email: regEmail.trim().toLowerCase(),
        mobile: regMobile.trim(),
        password: regPassword,
        role: regRole,
        departmentId: Number(regDeptId),
        rfidCardId: regRfid.trim() || undefined,
      };

      if (regRole === "STUDENT") {
        payload.rollNumber = regId.trim();
        payload.courseId = Number(regCourseId);
        payload.currentSemester = Number(regSemester);
        payload.admissionYear = Number(regAdmissionYear);
      } else {
        payload.employeeId = regId.trim();
        payload.designation = regDesignation.trim();
      }

      const res = await api.register(payload);
      if (res.success) {
        if (res.devOtp) {
          setDevOtpCode(res.devOtp);
        }
        setOtpCountdown(300);
        setOtpInput("");
        setError("New OTP code generated successfully.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP.");
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotSubmitting(true);
    try {
      const res = await api.forgotPassword(otpForgotEmail.trim().toLowerCase());
      if (res.success) {
        if (res.devOtp) {
          setOtpForgotCode(res.devOtp);
          setOtpForgotInput(""); // Force manual entry
        } else {
          setOtpForgotCode(null);
        }
        setOtpForgotSent(true);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initiate password reset.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otpForgotInput || otpForgotInput.trim().length !== 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }
    if (otpForgotNewPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setForgotSubmitting(true);
    try {
      const res = await api.resetPassword(otpForgotEmail.trim().toLowerCase(), otpForgotInput.trim(), otpForgotNewPassword);
      if (res.success) {
        setForgotResetSuccess(true);
        setTimeout(() => {
          setMainTab("LOGIN");
          setForgotResetSuccess(false);
          setOtpForgotSent(false);
          setOtpForgotEmail("");
          setOtpForgotInput("");
          setOtpForgotNewPassword("");
        }, 2000);
      }
    } catch (err: any) {
      setError(err?.message || "Password reset failed. Please check your OTP.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-6 sm:p-8 font-sans text-slate-800">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black tracking-tight text-[#0B2C5C]">
          SmartAttend Portal
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          University Biometric & IoT Attendance Gateway
        </p>
      </div>

      {/* Main Tabs Navigation */}
      <div className="grid grid-cols-3 gap-1 p-1 mb-6 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] text-xs font-bold">
        <button
          type="button"
          onClick={() => { setMainTab("LOGIN"); setError(null); }}
          className={`py-2 rounded-lg text-center transition-all ${
            mainTab === "LOGIN"
              ? "bg-white text-[#0B2C5C] shadow-xs border border-[#E2E8F0]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={() => { setMainTab("REGISTER"); setRegStep("FORM"); setError(null); }}
          className={`py-2 rounded-lg text-center transition-all ${
            mainTab === "REGISTER"
              ? "bg-white text-[#0B2C5C] shadow-xs border border-[#E2E8F0]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          New Registration
        </button>

        <button
          type="button"
          onClick={() => { setMainTab("FORGOT"); setError(null); }}
          className={`py-2 rounded-lg text-center transition-all ${
            mainTab === "FORGOT"
              ? "bg-white text-[#0B2C5C] shadow-xs border border-[#E2E8F0]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Forgot Password
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-[#EF4444] text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ================= 1. LOGIN TAB ================= */}
      {mainTab === "LOGIN" && (
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              User ID / Email / Registration Number
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C] focus:bg-white font-mono transition-colors shadow-xs"
                placeholder="e.g. 2025105002 or user@campus.edu"
              />
              <UserCheck className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-700 font-bold">Account Password</label>
              <button
                type="button"
                onClick={() => setMainTab("FORGOT")}
                className="text-[11px] text-[#0B2C5C] hover:underline font-bold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showLoginPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C] focus:bg-white font-mono transition-colors shadow-xs"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-[#0B2C5C] focus:outline-none"
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security CAPTCHA */}
          <div className="p-3 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">Security CAPTCHA</span>
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
              placeholder="ENTER CAPTCHA"
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

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-sm flex items-center justify-center space-x-2 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
          >
            <span>{isLoading ? "Authenticating..." : "Authenticate & Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* ================= 2. NEW REGISTRATION TAB ================= */}
      {mainTab === "REGISTER" && (
        <div>
          {/* STEP 1: FORM INPUT */}
          {regStep === "FORM" && (
            <form onSubmit={handleSendRegisterOtp} className="space-y-3.5 text-xs">
              {/* Role Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Registration Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole("STUDENT")}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-2 border transition-all ${
                      regRole === "STUDENT"
                        ? "bg-[#0B2C5C] text-white border-[#0B2C5C]"
                        : "bg-[#F8FAFC] text-slate-700 border-[#E2E8F0] hover:bg-slate-100"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole("FACULTY")}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-2 border transition-all ${
                      regRole === "FACULTY"
                        ? "bg-[#0B2C5C] text-white border-[#0B2C5C]"
                        : "bg-[#F8FAFC] text-slate-700 border-[#E2E8F0] hover:bg-slate-100"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Faculty Staff</span>
                  </button>
                </div>
              </div>

              {/* Identifier Field (Roll No / Employee ID) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {regRole === "STUDENT" ? "Roll Number / Registration ID *" : "Employee ID *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={regRole === "STUDENT" ? "e.g. 2025105099" : "e.g. EMP-FAC-102"}
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                />
              </div>

              {/* Email & Mobile Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@campus.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Department *</label>
                <select
                  required
                  value={regDeptId}
                  onChange={(e) => setRegDeptId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                >
                  {departments.length === 0 ? (
                    <option value="">Loading departments...</option>
                  ) : (
                    departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Student-specific: Course, Semester, Admission Year */}
              {regRole === "STUDENT" ? (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Course / Programme *</label>
                    <select
                      required
                      value={regCourseId}
                      onChange={(e) => setRegCourseId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                    >
                      {courses.length === 0 ? (
                        <option value="">No courses available</option>
                      ) : (
                        courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Current Semester *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={12}
                        value={regSemester}
                        onChange={(e) => setRegSemester(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Admission Year *</label>
                      <input
                        type="number"
                        required
                        min={2000}
                        max={2100}
                        value={regAdmissionYear}
                        onChange={(e) => setRegAdmissionYear(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Faculty-specific: Designation */
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Assistant Professor"
                    value={regDesignation}
                    onChange={(e) => setRegDesignation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                  />
                </div>
              )}

              {/* Optional RFID UID */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">RFID Card Tag ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 8976625E"
                  value={regRfid}
                  onChange={(e) => setRegRfid(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                />
              </div>



              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingReg}
                className="w-full py-3 px-4 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-sm flex items-center justify-center space-x-2 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
              >
                <span>{submittingReg ? "Generating Security OTP..." : "Send OTP →"}</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION STEP */}
          {regStep === "OTP" && (
            <form onSubmit={handleVerifyRegisterOtp} className="space-y-4 text-xs">
              {/* Development OTP Banner */}
              {devOtpCode && (
                <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 space-y-1 shadow-xs">
                  <div className="flex items-center space-x-2 text-cyan-800 font-bold uppercase text-[10px] tracking-wider">
                    <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>OTP (Development Mode)</span>
                  </div>
                  <div className="text-center font-mono font-black text-2xl tracking-widest text-[#0B2C5C] my-1">
                    {devOtpCode}
                  </div>
                  <p className="text-[11px] text-cyan-700 text-center">
                    Server-generated single-use verification passcode
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold">Enter 6-Digit OTP</label>
                  <span className="font-mono text-[11px] font-bold text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatTime(otpCountdown)}</span>
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full py-3 px-3 rounded-xl bg-slate-50 border border-slate-300 text-center font-mono font-black tracking-widest text-slate-900 text-lg focus:outline-none focus:border-[#0B2C5C] focus:bg-white"
                  placeholder="000000"
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setRegStep("FORM")}
                  className="text-slate-500 hover:text-slate-800 font-medium"
                >
                  ← Edit Details
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={submittingReg}
                  className="text-[#0B2C5C] font-bold hover:underline"
                >
                  Resend OTP Code
                </button>
              </div>

              <button
                type="submit"
                disabled={submittingReg || otpCountdown === 0}
                className="w-full py-3 px-4 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-sm flex items-center justify-center space-x-2 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
              >
                <span>{submittingReg ? "Verifying OTP..." : "Verify OTP & Submit"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 3: CONFIRMATION SCREEN */}
          {regStep === "CONFIRMATION" && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-amber-900">
                  Registration Submitted
                </h3>
                <div className="text-xs font-bold text-[#0B2C5C] mt-1 px-3 py-1 bg-white/80 rounded-lg inline-block border border-amber-200">
                  Status: PENDING ADMIN APPROVAL
                </div>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your account application has been logged. Please use your registered ID{" "}
                <span className="font-mono font-bold text-[#0B2C5C]">{regSuccessInfo?.registrationId}</span>{" "}
                to sign in once approved by the campus administrator.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMainTab("LOGIN");
                  setRegStep("FORM");
                  setLoginId(regSuccessInfo?.registrationId || "");
                }}
                className="w-full py-2.5 rounded-full bg-[#0B2C5C] text-white font-bold text-xs hover:bg-[#071E40] transition-colors"
              >
                Return to Sign In
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= 3. FORGOT PASSWORD TAB ================= */}
      {mainTab === "FORGOT" && (
        <div>
          {!otpForgotSent ? (
            <form onSubmit={handleSendForgotOtp} className="space-y-3.5 text-xs">
              <p className="text-slate-600">
                Enter your registered institutional email address to receive a single-use OTP for password recovery:
              </p>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={otpForgotEmail}
                  onChange={(e) => setOtpForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                  placeholder="user@campus.edu"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-sm flex items-center justify-center space-x-2"
              >
                <span>Send Reset OTP</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : forgotResetSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-center text-xs space-y-2 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <div className="font-bold">Password Reset Verified!</div>
              <div className="text-slate-600">You may now log in using your account credentials.</div>
            </div>
          ) : (
            <form onSubmit={handleVerifyForgotOtp} className="space-y-3.5 text-xs">
              {otpForgotCode && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
                  <div>OTP (Development Mode) sent to {otpForgotEmail}:</div>
                  <div className="font-mono font-black text-lg text-[#0B2C5C] text-center">{otpForgotCode}</div>
                </div>
              )}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpForgotInput}
                  onChange={(e) => setOtpForgotInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-center font-mono font-black tracking-widest text-slate-900 text-base focus:outline-none focus:border-[#0B2C5C]"
                  placeholder="000000"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showForgotNewPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={otpForgotNewPassword}
                    onChange={(e) => setOtpForgotNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                    placeholder="Min 8 chars"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-[#0B2C5C] focus:outline-none"
                  >
                    {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={forgotSubmitting}
                className="w-full py-3 px-4 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-sm disabled:opacity-50"
              >
                {forgotSubmitting ? "Verifying..." : "Verify OTP & Reset"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
