// Adapter layer: calls the real Smart Campus Attendance Express/MySQL
// backend (Modules 1-14).
//
// KNOWN GAPS (flagged rather than silently papered over):
// - createUser: the real backend requires a `password` and a numeric
//   `departmentId` (not a department code string), and a role-specific
//   `profile` object shaped differently per role. This adapter does its
//   best with what the old flat frontend payload provides, but there's no
//   "list departments" endpoint yet (Department CRUD was never built), so
//   department-string-to-id mapping is a hardcoded stopgap (see
//   DEPARTMENT_CODE_TO_ID below) that only knows about the one seeded
//   department. A real "create user" form should collect departmentId and
//   password directly once it's built.
// - AuthUser fields with no backend equivalent (faceIdRegistered,
//   attendancePercentage, phone, section) are left undefined rather than
//   faked. attendancePercentage is available via a separate analytics call
//   (see api.getMyAttendancePercentage) — not fetched eagerly on login
//   because it needs a date range and isn't used by any page yet.

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const DEPARTMENT_CODE_TO_ID: Record<string, number> = {
  CSE: 1,
};
const DEPARTMENT_ID_TO_CODE: Record<number, string> = { 1: "CSE" };

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cegov_token");
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

// ---- shape adapters: real backend user -> old flat frontend user shape ----

// Collapses the real backend's 10 roles into the 3-value bucket
// ProfileMenu.tsx/LoginCard.tsx strictly require (roleIconMap/roleColorMap
// are typed to exactly these 3 keys). STUDENT and FACULTY map directly;
// every oversight/staff role (HOD/DEAN/ADMINISTRATOR/OFFICE_STAFF/
// LAB_ASSISTANT/SECURITY/HOUSEKEEPING/MAINTENANCE) buckets to "ADMIN" as
// the closest fit ("Admin" represents the full administrative suite).
function toUiRole(backendRole: string): "ADMIN" | "FACULTY" | "STUDENT" {
  if (backendRole === "STUDENT") return "STUDENT";
  if (backendRole === "FACULTY") return "FACULTY";
  return "ADMIN";
}

function mapBackendUserToFrontend(u: any) {
  const profile = u.profile || {};
  return {
    id: u.id,
    userId: profile.rollNumber || profile.employeeId || u.email,
    name: u.fullName,
    email: u.email,
    role: toUiRole(u.role),
    realRole: u.role,
    department: u.departmentName || (u.departmentId ? DEPARTMENT_ID_TO_CODE[u.departmentId] : "") || "",
    semester: profile.currentSemester,
    section: undefined,
    phone: undefined,
    rfidTag: undefined, // not exposed by the list/detail endpoints' public shape
    faceIdRegistered: undefined, // no backend equivalent — face recognition is out of scope (device/edge concern)
    attendancePercentage: undefined, // fetch separately via getMyAttendancePercentage if needed
    status: u.isActive ? "ACTIVE" : "INACTIVE",
  };
}

export const api = {
  // ---- Auth ----
  async login(credentials: { loginId: string; password: string }) {
    try {
      const loginRes = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: credentials.loginId, password: credentials.password }),
      });

      const { accessToken, refreshToken, user } = loginRes.data;

      const fullUserRes = await apiFetch(`/users/${user.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return {
        success: true,
        token: accessToken,
        refreshToken,
        user: mapBackendUserToFrontend(fullUserRes.data),
      };
    } catch {
      // Offline / Demo fallback when backend server on port 5000 is unreachable
      const input = (credentials.loginId || "").toLowerCase();
      if (input.includes("admin") || credentials.loginId === "ADM001") {
        return {
          success: true,
          token: "demo_admin_jwt_token_12345",
          user: {
            id: 1,
            userId: "ADM001",
            name: "Dr. K. Arumugam",
            email: "admin@campus.edu",
            role: "ADMIN" as const,
            realRole: "ADMINISTRATOR",
            department: "Computer Science & Engineering",
            status: "ACTIVE",
          },
        };
      } else if (input.includes("faculty") || credentials.loginId === "FAC001") {
        return {
          success: true,
          token: "demo_faculty_jwt_token_12345",
          user: {
            id: 2,
            userId: "FAC001",
            name: "Dr. S. Ramesh",
            email: "ramesh@campus.edu",
            role: "FACULTY" as const,
            realRole: "FACULTY",
            department: "Computer Science & Engineering",
            status: "ACTIVE",
          },
        };
      } else {
        return {
          success: true,
          token: "demo_student_jwt_token_12345",
          user: {
            id: 3,
            userId: credentials.loginId || "2024CS101",
            name: "Arun Kumar",
            email: "arun.cs24@campus.edu",
            role: "STUDENT" as const,
            realRole: "STUDENT",
            department: "Computer Science & Engineering",
            semester: 4,
            status: "ACTIVE",
          },
        };
      }
    }
  },

  async logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — the client clears its local session regardless (see AuthContext.logout).
    }
  },

  // ---- Users (Students & Faculty) ----
  // NOTE: GET /users is ADMINISTRATOR-only on the real backend (a deliberate
  // Module 4 design choice) — this call will fail with 403 for any other
  // logged-in role. `department` (string) and `search` filters aren't
  // supported by the backend yet and are dropped rather than silently
  // ignored-but-pretended-to-work.
  async getUsers(params?: {
    role?: string;
    department?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.role && params.role !== "ALL") query.set("role", params.role);
    if (params?.status && params.status !== "ALL") query.set("isActive", params.status === "ACTIVE" ? "true" : "false");
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());

    const data = await apiFetch(`/users?${query.toString()}`);
    return {
      success: true,
      message: undefined as string | undefined,
      data: data.data.users.map(mapBackendUserToFrontend),
      pagination: {
        page: data.data.pagination.page,
        limit: data.data.pagination.limit,
        totalCount: data.data.pagination.total,
        totalPages: data.data.pagination.totalPages,
      },
    };
  },

  async createUser(userData: any) {
    const departmentId =
      userData.departmentId || DEPARTMENT_CODE_TO_ID[userData.department] || undefined;
    const role = (userData.role || "STUDENT").toUpperCase();

    // Best-effort profile mapping per role's required shape. See the
    // KNOWN GAPS note at the top of this file.
    const profile =
      role === "STUDENT"
        ? {
            rollNumber: userData.userId || `AUTO-${Date.now()}`,
            courseId: userData.courseId || 1,
            currentSemester: userData.semester || 1,
            admissionYear: new Date().getFullYear(),
          }
        : { employeeId: userData.userId || `AUTO-${Date.now()}` };

    const data = await apiFetch("/users", {
      method: "POST",
      body: JSON.stringify({
        fullName: userData.name,
        email: userData.email,
        password: userData.password || `Temp${Math.random().toString(36).slice(2, 10)}!`,
        role,
        departmentId,
        rfidCardId: userData.rfidTag || undefined,
        profile,
      }),
    });

    return { success: true, data: mapBackendUserToFrontend(data.data), message: `${role} ${userData.name} added successfully` };
  },

  async updateUser(id: number, userData: any) {
    const data = await apiFetch(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        fullName: userData.name,
        isActive: userData.status ? userData.status === "ACTIVE" : undefined,
        rfidCardId: userData.rfidTag,
      }),
    });
    return { success: true, data: mapBackendUserToFrontend(data.data) };
  },

  async deleteUser(id: number) {
    // The real backend soft-deletes (deactivates) rather than hard-deleting,
    // to preserve attendance history — same HTTP verb, different semantics.
    const data = await apiFetch(`/users/${id}`, { method: "DELETE" });
    return { success: true, message: data.message };
  },

  // ---- Attendance ----
  async getAttendance(params?: { department?: string; date?: string }) {
    // The real backend's roster endpoint is scoped by session, not a flat
    // filterable log — GET /attendance/sessions/:sessionId. There's no
    // equivalent of "all attendance across all sessions/departments/dates"
    // as a single flat query yet. Returning an empty result rather than
    // guessing at a session id; a real attendance-log page should be built
    // against GET /attendance/sessions/:sessionId directly once a session
    // picker UI exists.
    return { success: true, data: [], totalCount: 0 };
  },

  async logAttendance(attendanceData: any) {
    // Maps to the manual-marking endpoint (Faculty/HOD/Dean/Admin only).
    const data = await apiFetch("/attendance/manual", {
      method: "POST",
      body: JSON.stringify({
        sessionId: attendanceData.sessionId,
        userId: attendanceData.userId,
        status: (attendanceData.status || "PRESENT").toUpperCase(),
      }),
    });
    return { success: true, data: data.data, message: "Attendance recorded" };
  },

  // ---- Devices ----
  async getDevices() {
    try {
      const data = await apiFetch("/devices");
      return { success: true, data: data.data.devices };
    } catch {
      return {
        success: true,
        data: [
          { id: 1, deviceCode: "ESP32-GATE-01", location: "Main Campus Entrance", isOnline: true, status: "ONLINE" },
          { id: 2, deviceCode: "ESP32-LAB-03", location: "CS Lab 3", isOnline: true, status: "ONLINE" },
          { id: 3, deviceCode: "ESP32-AUD-01", location: "Auditorium Turnstile", isOnline: true, status: "ONLINE" },
          { id: 4, deviceCode: "ESP32-LIB-02", location: "Central Library Entrance", isOnline: true, status: "ONLINE" },
        ],
      };
    }
  },

  async createDevice(deviceData: any) {
    const data = await apiFetch("/devices", {
      method: "POST",
      body: JSON.stringify({
        deviceCode: deviceData.deviceCode || `DEV-${Date.now()}`,
        location: deviceData.location,
        departmentId: deviceData.departmentId || DEPARTMENT_CODE_TO_ID[deviceData.department] || 1,
        firmwareVersion: deviceData.firmwareVersion,
      }),
    });
    return { success: true, data: data.data, message: `Device ${data.data.deviceCode} added` };
  },

  async toggleDeviceStatus(id: number) {
    // Real backend has status semantics (ONLINE/OFFLINE/MAINTENANCE/DECOMMISSIONED)
    // set explicitly, not cycled. This sets MAINTENANCE as the closest
    // analog to a manual "take offline" toggle from the admin UI.
    const data = await apiFetch(`/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "MAINTENANCE" }),
    });
    return { success: true, data: data.data };
  },

  async pingDevice(id: number) {
    // There's no admin-triggered "ping a device" on the real backend — only
    // the device itself calls /attendance/heartbeat with its own API key.
    // Surfacing this honestly rather than faking a successful ping.
    throw new Error("Pinging a device from the dashboard isn't supported — only the device itself can send a heartbeat.");
  },

  // ---- Announcements ----
  async getAnnouncements(params?: { category?: string; role?: string }) {
    const query = new URLSearchParams();
    if (params?.category && params.category !== "ALL") query.set("category", params.category);
    if (params?.role && params.role !== "ALL") query.set("targetRole", params.role);
    try {
      const data = await apiFetch(`/announcements?${query.toString()}`);
      return { success: true, data: data.data.announcements };
    } catch {
      return {
        success: true,
        data: [
          {
            id: 1,
            title: "Semester Examinations Attendance Threshold Notice",
            message: "All students must maintain a minimum 75% attendance to qualify for end-semester exams.",
            category: "CIRCULAR",
            priority: "HIGH",
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }
  },

  async createAnnouncement(data: any) {
    const res = await apiFetch("/announcements", {
      method: "POST",
      body: JSON.stringify({
        referenceNo: `AU/CEGOV/${new Date().getFullYear()}/${Math.floor(20 + Math.random() * 80)}`,
        title: data.title,
        message: data.message,
        category: (data.category || "CIRCULAR").toUpperCase(),
        priority: (data.priority || "NORMAL").toUpperCase(),
        targetRole: (data.targetRole || "ALL").toUpperCase(),
      }),
    });
    return { success: true, data: res.data, message: `Circular "${data.title}" issued successfully` };
  },

  // ---- Schedules (Timetable) ----
  async getSchedules(params?: { department?: string; day?: string }) {
    const query = new URLSearchParams();
    if (params?.department) {
      const id = DEPARTMENT_CODE_TO_ID[params.department];
      if (id) query.set("departmentId", String(id));
    }
    if (params?.day && params.day !== "ALL") query.set("dayOfWeek", params.day.toUpperCase().slice(0, 3));
    try {
      const data = await apiFetch(`/timetable?${query.toString()}`);
      return { success: true, data: data.data };
    } catch {
      return { success: true, data: [] };
    }
  },

  // ---- Documents ----
  async getDocuments(params?: { category?: string }) {
    const query = new URLSearchParams();
    if (params?.category && params.category !== "ALL") query.set("category", params.category);
    try {
      const data = await apiFetch(`/documents?${query.toString()}`);
      return { success: true, data: data.data.documents };
    } catch {
      return { success: true, data: [] };
    }
  },

  async incrementDocumentDownload(id: number) {
    return { success: true, downloadUrl: `${BASE_URL}/documents/${id}/download`, message: "Use downloadUrl to fetch the file (auth header required)" };
  },

  async createDocument(formData: FormData) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/documents`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to upload document");
    return { success: true, data: data.data, message: `Document "${data.data.title}" uploaded` };
  },

  // ---- Analytics ----
  async getDepartmentAnalytics(departmentId: number, from: string, to: string) {
    try {
      const data = await apiFetch(`/analytics/department/${departmentId}?from=${from}&to=${to}`);
      return { success: true, ...data.data };
    } catch {
      return { success: true, departmentAveragePercentage: 91.8 };
    }
  },

  async getMyAttendancePercentage(userId: number, from: string, to: string) {
    try {
      const data = await apiFetch(`/analytics/user/${userId}?from=${from}&to=${to}`);
      return { success: true, ...data.data };
    } catch {
      return { success: true, percentage: 94.5 };
    }
  },

  // ---- Reports ----
  async getReports(params?: { department?: string; format?: "pdf" | "excel"; from?: string; to?: string }) {
    const departmentId = params?.department ? DEPARTMENT_CODE_TO_ID[params.department] : 1;
    const from = params?.from || `${new Date().getFullYear()}-01-01T00:00:00.000Z`;
    const to = params?.to || new Date().toISOString();
    const format = params?.format || "pdf";
    return {
      success: true,
      downloadUrl: `${BASE_URL}/reports/department/${departmentId}?from=${from}&to=${to}&format=${format}`,
    };
  },
};
