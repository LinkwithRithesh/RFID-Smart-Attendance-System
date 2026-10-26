"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BrandingPanel } from "@/components/login/BrandingPanel";
import { Loader } from "@/components/common/Loader";

function RegisterContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-800 font-sans">
        <Loader text="Loading SmartAttend Registration..." />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] overflow-x-hidden font-sans">
      <BrandingPanel initialTab="REGISTER" />
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader text="Loading..." /></main>}>
      <RegisterContent />
    </Suspense>
  );
}
