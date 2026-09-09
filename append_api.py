import re

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/services/api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we don't duplicate
if 'getAdminStats' not in content:
    # We find the last bracket before "export const api =" and insert inside export const api
    new_apis = '''
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
    const data = await apiFetch("/od");
    return { success: true, data: data.data };
  },
  async submitODRequest(payload: any) {
    const data = await apiFetch("/od", { method: "POST", body: JSON.stringify(payload) });
    return { success: true, data: data.data };
  },
  async updateODStatus(id: number, status: string, notes?: string) {
    const data = await apiFetch(/od//status, { method: "PATCH", body: JSON.stringify({ status, remarks: notes }) });
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
    const data = await apiFetch(/helpdesk//replies, { method: "POST", body: JSON.stringify(payload) });
    return { success: true, data: data.data };
  },
  async updateTicketStatus(id: number, status: string, notes?: string) {
    const data = await apiFetch(/helpdesk//status, { method: "PATCH", body: JSON.stringify({ status, notes }) });
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
'''
    # Append inside export const api = { ... }
    # Find the closing brace of export const api
    # Actually simpler: append before the very last };? Wait, api is not the last export.
    # I'll just find the "  async getDevices() {" and insert before it
    content = content.replace('  async getDevices() {', new_apis + '\n  async getDevices() {')
    
    with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/services/api.ts', 'w', encoding='utf-8') as f:
        f.write(content)
