import { apiClient } from "./apiClient";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export interface LoginCredentials {
  loginId?: string;
  password?: string;
}

export interface User {
  id: number;
  userId: string;
  name: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "ADMIN";
  realRole: string;
  department: string;
  semester?: number;
  phone?: string;
  status: "ACTIVE" | "INACTIVE";
  rfidTag?: string;
  faceIdRegistered?: boolean;
  attendancePercentage?: number;
}

export interface StudentRow {
  id: number;           // users.id â€” use for update/delete
  rollNumber: string;   // profile.rollNumber
  fullName: string;
  email: string;
  departmentName: string;
  rfidCardId: string | null;
  hasFaceEmbedding: boolean;
}

const BACKEND_TO_UI_ROLE_MAP: Record<string, "STUDENT" | "FACULTY" | "ADMIN"> = {
  ADMINISTRATOR: "ADMIN",
  SYSTEM_ADMIN: "ADMIN",
  FACULTY: "FACULTY",
  HOD: "FACULTY",
  DEAN: "FACULTY",
  STUDENT: "STUDENT",
  OFFICE_STAEF: "ADMIN",
  LAB_ASSISTANT: "FACULTY",
  SECURITY: "ADMIN",
  HOUSEKEEPING: "ADMIN",
  MAINTENANCE: "ADMIN",
};

// TODO: replace with real departments API (see api.getDepartments())
const DEPARTMENT_CODE_TO_ID: Record<string, number> = {
  ECE: 1,
  "Electronics & Communication Engg": 1,
  CSE: 2,
  "Computer Science & Engineering": 2,
  IT: 3,
  "Information Technology": 3,
  MECH: 4,
  "Mechanical Engineering": 4,
  EEE: 5,
  "Electrical & Electronics Engg": 5,
  CIVIL: 6,
  "Civil Engineering": 6,
  MATHS: 7,
  "Science & Humanities": 7,
};

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = apiClient.getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

function mapBackendUserToFrontend(u: any): User {
  const backendRole = u.role?.name || u.role || "STUDENT";
  const mappedRole = BACKEND_TO_UI_ROLE_MAP[backendRole] || "STUDENT";

  return {
    id: u.id,
    userId:
      u.studentProfile?.rollNumber ||
      u.facultyProfile?.employeeId ||
      u.administratorProfile?.employeeId ||
      `USER-${u.id}`,
    name: u.fullName,
    email: u.email,
    role: mappedRole,
    realRole: backendRole,
    department: u.department?.name || "General",
    semester: u.studentProfile?.currentSemester,
    phone: undefined,
    rfidTag: u.rfidCardId || undefined,
    faceIdRegistered: u.hasFaceEmbedding ?? undefined,
    attendancePercentage: undefined,
    status: u.isActive ? "ACTIVE" : "INACTIVE",
  };
}

export const api = {
  // ---- Auth ----
  async login(credentials: { loginId: string; password: string}) {
    const loginRes = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: credentials.loginId, password: credentials.password }),

    });

    const { accessToken, refreshToken, user } = loginRes.data;

    const fullUserRes = await apiFetch(`/users/${user.id}`, {
      headers: { Authorization: `Bearer ${accessToken}`},
    });

    return {
      success: true,

      token: accessToken,
      refreshToken,
      user: mapBackendUserToFrontend(fullUserRes.data),
    };
  },

  async logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Best-effort
    }
  },

  async register(registrationData: any) {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(registrationData),
    });
    return { success: true, message: data.message, devOtp: data.data?.devOtp, email: data.data?.email };
  },

  async verifyRegisterOtp(email: string, otp: string) {
    const data = await apiFetch("/auth/register/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
    return { success: true, data: data.data, message: data.message };
  },

  async getPendingRegistrations() {
    const data = await apiFetch("/admin/registrations/pending");
    return { success: true, data: data.data };
  },

  async getPendingRegistrationDetail(id: number) {
    const data = await apiFetch(`/admin/registrations/${id}`);
    return { success: true, data: data.data };
  },

  async approveRegistration(id: number) {
    const data = await apiFetch(`/admin/registrations/${id}/approve`, {
      method: "PATCH",
    });
    return { success: true, message: data.message, data: data.data };
  },

  async rejectRegistration(id: number, reason?: string) {
    const data = await apiFetch(`/admin/registrations/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
    return { success: true, message: data.message, data: data.data };
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const data = await apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    return { success: true, message: data.message };
  },

  // ---- Users (Students & Faculty) ----
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
        totalCount: data.data.pagination.totalUsers || data.data.pagination.total || 0,
        totalUsers: data.data.pagination.totalUsers || data.data.pagination.total || 0,
        totalPages: data.data.pagination.totalPages,
      },
    };
  },

  async getUserProfile(id: number) {
    const res = await apiFetch(`/users/${id}`);
    return { success: true, data: res.data };
  },

  async createUser(userData: any) {
    const data = await apiFetch("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    return { success: true, data: mapBackendUserToFrontend(data.data), message: "User created" };
  },

  async updateUserProfile(id: number, userData: any) {
    const data = await apiFetch(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        phone: userData.phone,
        email: userData.email,
        profile: {
          parentName: userData.parentName,
          parentPhone: userData.parentPhone,
          address: userData.address,
        }
      }),
    });
    return { success: true, data: data.data };
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
    const data = await apiFetch(`/users/${id}`, { method: "DELETE" });
    return { success: true, message: data.message };
  },

  async getStudents(params?: { department?: string; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    query.set("role", "STUDENT");
    query.set("limit", String(params?.limit || 100));
    if (params?.page) query.set("page", String(params.page));
    if (params?.department && params.department !== "ALL") query.set("department", params.department);
    if (params?.search) query.set("search", params.search);

    const data = await apiFetch(`/users?${query.toString()}`);
    const rawUsers: any[] = data.data.users || [];
    const students: StudentRow[] = rawUsers.map((u: any) => ({
      id: u.id,
      rollNumber: u.studentProfile?.rollNumber || u.profile?.rollNumber || `STU-${u.id}`,
      fullName: u.fullName,
      email: u.email,
      departmentName: u.department?.name || u.departmentName || "General",
      rfidCardId: u.rfidCardId || null,
      hasFaceEmbedding: !!u.hasFaceEmbedding,
    }));

    return {
      success: true,
      data: students,
      pagination: data.data.pagination,
    };
  },

  // ---- Departments & Courses ----
  async getDepartments() {
    const data = await apiFetch("/departments");
    return { success: true, data: data.data as { id: number; name: string; code: string }[] };
  },

  async getCoursesByDepartment(departmentId?: number) {
    const query = departmentId ? `?departmentId=${departmentId}` : "";
    const data = await apiFetch(`/courses${query}`);
    return { success: true, data: data.data as { id: number; code: string; name: string; departmentId?: number; department?: string }[] };
  },


  // ---- Attendance ----
  async getAttendance(params?: {
    studentId?: string;
    courseCode?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.studentId) query.set("studentId", params.studentId);
    if (params?.courseCode) query.set("courseCode", params.courseCode);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);

    const data = await apiFetch(`/attendance/summary?${query.toString()}`);
    return {
      success: true,
      data: data.data,
      totalCount: data.data?.held || 0,
    };
  },

  async recordAttendance(recordData: any) {
    const data = await apiFetch("/attendance/manual", {
      method: "POST",
      body: JSON.stringify({
        sessionId: recordData.sessionId || 1,
        userId: recordData.userId,
        status: recordData.status || "PRESENT",
        reason: recordData.reason || "Manual override",
      }),
    });
    return { success: true, data: data.data, message: "Attendance recorded" };
  },

  // ---- Devices ----

  // ---- Dashboard Analytics ----
  async getAdminStats() {
    const data = await apiFetch("/dashboard/stats");
    return { success: true, data: data.data };
  },
  async getStudentStats() {
    const data = await apiFetch("/dashboard/student/stats");
    return { success: true, data: data.data };
  },

  // ---- OD Requests ----
  async getODRequests() {
    const data = await apiFetch("/od-requests");
    return { success: true, data: data.data };
  },
  async submitODRequest(payload: any) {
    const data = await apiFetch("/od-requests", { method: "POST", body: JSON.stringify(payload) });
    return { success: true, data: data.data };
  },
  async updateODStatus(id: number, status: string, notes?: string) {
    const data = await apiFetch(`/od-requests/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, remarks: notes }) });
    return { success: true, data: data.data };
  },

  // ---- Helpdesk ----
  async getTickets() {
    const data = await apiFetch("/helpdesk");
    return { success: true, data: data.data };
  },
  async createTicket(payload: any) {
    const data = await apiFetch("/helpdesk", { method: "POST", body: JSON.stringify(payload) });
    return { success: true, data: data.data };
  },
  async replyToTicket(id: number, payload: any) {
    const data = await apiFetch(`/helpdesk/${id}/replies`, { method: "POST", body: JSON.stringify(payload) });
    return { success: true, data: data.data };
  },
  async updateTicketStatus(id: number, status: string, notes?: string) {
    const data = await apiFetch(`/helpdesk/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, notes }) });
    return { success: true, data: data.data };
  },

  // ---- Audit Logs ----
  async getAuditLogs() {
    const data = await apiFetch("/audit-logs");
    return { success: true, data: data.data };
  },

  // ---- Analytics & Anomalies ----
  async getAnomalies() {
    const data = await apiFetch("/analytics/anomalies");
    return { success: true, data: data.data };
  },
  
  // ---- Attendance Extended ----
  async getOverallStudentStats(rollNumber?: string) {
    return this.getStudentStats(); // fallback to dashboard stats
  },
  async getSubjectAttendanceSummary(rollNumber?: string) {
    // Return empty for now if no specific route
    return { success: true, data: [] };
  },
  async getClassrooms() {
    return { success: true, data: [] };
  },

  async getDevices() {
    const data = await apiFetch("/devices");
    return { success: true, data: data.data.devices };
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
    const data = await apiFetch(`/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "MAINTENANCE" }),
    });
    return { success: true, data: data.data };
  },

  async pingDevice(id: number) {
    throw new Error("pinging a device is not supported");
  },

  // ---- Announcements ----
  async getAnnouncements(params?: { category?: string; role?: string }) {
    const query = new URLSearchParams();
    if (params?.category && params.category !== "ALL") query.set("category", params.category);
    if (params?.role && params.role !== "ALL") query.set("targetRole", params.role);
    const data = await apiFetch(`/announcements?${query.toString()}`);
    return { success: true, data: data.data.announcements };
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
    const data = await apiFetch(`/timetable?${query.toString()}`);
    return { success: true, data: data.data };
  },

  // ---- Documents ----
  async getDocuments(params?: { category?: string }) {
    const query = new URLSearchParams();
    if (params?.category && params.category !== "ALL") query.set("category", params.category);
    const data = await apiFetch(`/documents?${query.toString()}`);
    return { success: true, data: data.data.documents };
  },

  async incrementDocumentDownload(id: number) {
    return { success: true, downloadUrl: `${BASE_URL}/documents/${id}/download`, message: "Use downloadUrl to fetch the file" };
  },

  async createDocument(formData: FormData) {
    const token = apiClient.getToken();
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
    const data = await apiFetch(`/analytics/department/${departmentId}?from=${from}&to=${to}`);
    return { success: true, ...data.data };
  },

  async getMyAttendancePercentage(userId: number, from: string, to: string) {
    const data = await apiFetch(`/analytics/user/${userId}?from=${from}&to=${to}`);
    return { success: true, ...data.data };
  },

  // ---- Reports ----
  async getReports(params: { department: string; format: "pdf" | "excel"; from: string; to: string }) {
    const query = new URLSearchParams({
      department: params.department,
      format: params.format,
      from: params.from,
      to: params.to,
    });
    return {
      success: true,
      downloadUrl: `${BASE_URL}/reports/export?${query.toString()}`,
    };
  },
};
