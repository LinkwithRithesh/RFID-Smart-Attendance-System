import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "SmartAttend — University Attendance & IoT Portal",
  description: "Institutional Attendance Portal — RFID, AI Face Vision & ESP32 Telemetry",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#0B2C5C] selection:text-white">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
