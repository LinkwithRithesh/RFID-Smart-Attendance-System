"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/services/api";
import { apiClient } from "@/services/apiClient";

// Kept as the original 3-value union — ProfileMenu.tsx and LoginCard.tsx
// strictly require exactly these three (roleIconMap/roleColorMap are typed
// to only these keys). The real backend has 10 roles; the adapter
// (mapBackendUserToFrontend in services/api.ts) collapses HOD/DEAN/
// ADMINISTRATOR/OFFICE_STAFF/LAB_ASSISTANT/SECURITY/HOUSEKEEPING/MAINTENANCE
// down to "ADMIN" for this field. The true backend role name is preserved
// on `realRole` for anything built later that needs to distinguish them.
export type UiRole = "ADMIN" | "FACULTY" | "STUDENT";

export interface AuthUser {
  id: number;
  userId: string;
  name: string;
  email: string;
  role: UiRole;
  realRole?: string; // the true backend role (e.g. "HOD", "SECURITY") before UI-bucket collapsing
  department: string;
  semester?: number;
  section?: string;
  phone?: string;
  rfidTag?: string;
  faceIdRegistered?: boolean;
  attendancePercentage?: number;
  status?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { loginId: string; password: string }) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore a persisted session if one exists.
    const savedToken = localStorage.getItem("cegov_token");
    const savedUser = localStorage.getItem("cegov_user");

    if (savedToken && savedUser) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a session from localStorage on mount; localStorage is only available client-side, so this can't run outside an effect.
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        apiClient.setTokens(savedToken, localStorage.getItem("cegov_refresh_token"));
      } catch (e) {
        localStorage.removeItem("cegov_token");
        localStorage.removeItem("cegov_refresh_token");
        localStorage.removeItem("cegov_user");
      }
    }
    setIsLoading(false);
  }, []);

  const persistSession = (authToken: string, authUser: AuthUser, refreshToken?: string | null) => {
    setUser(authUser);
    setToken(authToken);
    apiClient.setTokens(authToken, refreshToken);
    localStorage.setItem("cegov_token", authToken);
    if (refreshToken) {
      localStorage.setItem("cegov_refresh_token", refreshToken);
    }
    localStorage.setItem("cegov_user", JSON.stringify(authUser));
  };

  const login = async (credentials: { loginId: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      if (res.success && res.user) {
        persistSession(res.token, res.user, res.refreshToken);
        return res.user;
      }
      throw new Error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout(); // best-effort server-side refresh-token invalidation, fire-and-forget
    apiClient.clearTokens();
    setUser(null);
    setToken(null);
    localStorage.removeItem("cegov_token");
    localStorage.removeItem("cegov_refresh_token");
    localStorage.removeItem("cegov_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
