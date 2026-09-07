export type ThemeMode = "light" | "dark";

export const themeConfig = {
  colors: {
    primary: {
      DEFAULT: "#1e3a8a", // Institutional Royal Navy
      light: "#3b82f6",
      dark: "#1e40af",
      hover: "#1d4ed8",
    },
    accent: {
      DEFAULT: "#059669", // Emerald Green (CeGov signature)
      light: "#10b981",
      dark: "#047857",
    },
    status: {
      active: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
      warning: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
      danger: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" },
      info: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
      offline: { bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20" },
    },
  },
  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  borderRadius: {
    card: "0.75rem", // 12px
    button: "0.5rem", // 8px
  },
  shadows: {
    cardLight: "0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -2px rgba(0, 0, 0, 0.03)",
    cardDark: "0 4px 20px -2px rgba(0, 0, 0, 0.4)",
  },
};
