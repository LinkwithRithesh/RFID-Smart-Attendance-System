/**
 * SmartAttend Centralized Real API Client
 *
 * Requirements fulfilled:
 * 1. Prefixes all requests with NEXT_PUBLIC_API_BASE_URL (defaults to http://localhost:5000/api/v1).
 * 2. Attaches JWT Bearer token from memory/in-memory session state.
 * 3. Handles 401 Unauthorized by attempting a silent refresh-token rotation once, then redirecting to /login on failure.
 * 4. Centralizes error handling so every page/call gets a consistent shape: { data, error }.
 * 5. Supports standard JSON payloads and multipart/form-data.
 */

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status?: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000/api/v1";
  }

  public setTokens(accessToken: string | null, refreshToken?: string | null) {
    this.token = accessToken;
    if (refreshToken !== undefined) {
      this.refreshToken = refreshToken;
    }
  }

  public getToken(): string | null {
    return this.token || (typeof window !== "undefined" ? localStorage.getItem("cegov_token") : null);
  }

  public getRefreshToken(): string | null {
    return this.refreshToken;
  }

  public clearTokens() {
    this.token = null;
    this.refreshToken = null;
  }

  private onRefreshed(newToken: string) {
    this.refreshSubscribers.forEach((callback) => callback(newToken));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...((options.headers as Record<string, string>) || {}),
    };

    const activeToken = this.getToken();
    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized with silent token rotation
      if (response.status === 401 && retryCount === 0) {
        if (!this.refreshToken) {
          this.handleAuthFailure();
          return {
            data: null,
            error: "Session expired. Please sign in again.",
            status: 401,
          };
        }

        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const refreshSuccess = await this.attemptTokenRefresh();
          this.isRefreshing = false;

          if (refreshSuccess) {
            this.onRefreshed(this.token!);
            return this.request<T>(endpoint, options, retryCount + 1);
          } else {
            this.handleAuthFailure();
            return {
              data: null,
              error: "Session expired. Please sign in again.",
              status: 401,
            };
          }
        }

        // Wait for active refresh to complete
        return new Promise((resolve) => {
          this.addRefreshSubscriber((newToken) => {
            const retryHeaders = {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            };
            resolve(
              this.request<T>(
                endpoint,
                { ...options, headers: retryHeaders },
                retryCount + 1
              )
            );
          });
        });
      }

      // Parse response body safely
      let parsedJson: any = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        parsedJson = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => "");
        parsedJson = { text };
      }

      if (!response.ok) {
        const errorMessage =
          parsedJson?.message ||
          parsedJson?.error ||
          `Request failed with status ${response.status}`;
        return {
          data: null,
          error: errorMessage,
          status: response.status,
        };
      }

      // Backend wraps payload inside { success: true, message: "...", data: ... }
      const responseData =
        parsedJson && typeof parsedJson === "object" && "data" in parsedJson
          ? parsedJson.data
          : parsedJson;

      return {
        data: responseData as T,
        error: null,
        status: response.status,
      };
    } catch (err: any) {
      return {
        data: null,
        error: err?.message || "Network error. Please check your connectivity.",
        status: 0,
      };
    }
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!res.ok) return false;

      const body = await res.json().catch(() => null);
      if (body?.data?.accessToken) {
        this.token = body.data.accessToken;
        if (typeof window !== "undefined") {
          localStorage.setItem("cegov_token", body.data.accessToken);
        }
        if (body.data.refreshToken) {
          this.refreshToken = body.data.refreshToken;
          if (typeof window !== "undefined") {
            localStorage.setItem("cegov_refresh_token", body.data.refreshToken);
          }
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private handleAuthFailure() {
  this.clearTokens();

  if (typeof window !== "undefined") {
    localStorage.removeItem("cegov_token");
    localStorage.removeItem("cegov_refresh_token");
    localStorage.removeItem("cegov_user");

    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }
}

  // Convenience verbs
  public get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  public post<T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: "POST",
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public patch<T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
  }

  public delete<T = any>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }

  // Direct blob download helper for exports (PDF / CSV / XLSX)
  public async downloadBlob(
    endpoint: string,
    filename: string,
    headers?: Record<string, string>
  ): Promise<{ success: boolean; error: string | null }> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    try {
      const authHeader: Record<string, string> = this.token
        ? { Authorization: `Bearer ${this.token}` }
        : {};

      const res = await fetch(url, {
        headers: { ...authHeader, ...headers },
      });

      if (!res.ok) {
        return { success: false, error: `Failed to export file (${res.status})` };
      }

      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err?.message || "File download failed" };
    }
  }
}

export const apiClient = new ApiClient();

export function getToken(): string | null {
  return apiClient.getToken();
}

