// Centralized Mock Services Layer for SmartAttend Prototype
// Exposes data getters, reactive mutation subscriptions, and dynamic calculation logic
// (attendance %, shortage warning, streak, safe miss counts, audit logging).

import {
  Student,
  Faculty,
  Course,
  Classroom,
  AttendanceRecord,
  IoTDevice,
  ODRequest,
  HelpDeskTicket,
  NotificationItem,
  AuditLogItem,
  AnomalyItem,
  initialStudents,
  initialFaculty,
  initialCourses,
  initialClassrooms,
  initialIoTDevices,
  initialAttendanceRecords,
  initialODRequests,
  initialTickets,
  initialNotifications,
  initialAuditLogs,
  initialAnomalies,
} from "./mockData";

import { apiClient } from "./apiClient";

type Listener = () => void;

class MockDataStore {
  private students: Student[] = [...initialStudents];
  private faculty: Faculty[] = [...initialFaculty];
  private courses: Course[] = [...initialCourses];
  private classrooms: Classroom[] = [...initialClassrooms];
  private iotDevices: IoTDevice[] = [...initialIoTDevices];
  private attendanceRecords: AttendanceRecord[] = [...initialAttendanceRecords];
  private odRequests: ODRequest[] = [...initialODRequests];
  private tickets: HelpDeskTicket[] = [...initialTickets];
  private notifications: NotificationItem[] = [...initialNotifications];
  private auditLogs: AuditLogItem[] = [...initialAuditLogs];
  private anomalies: AnomalyItem[] = [...initialAnomalies];

  // Dynamic backend-hydrated caches
  private backendSubjectSummary: Map<string, any[]> = new Map();
  private backendOverallStats: Map<string, any> = new Map();
  private backendCalendars: Map<string, Record<number, any>> = new Map();

  private listeners: Set<Listener> = new Set();
  private isSyncing: boolean = false;
  private hasInitializedBackend: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      // Lazy background synchronization with real API if mocks are not forced
      setTimeout(() => this.syncFromBackend(), 100);
    }
  }

  private useMocks(): boolean {
    return process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // If not initialized yet, trigger a background sync
    if (!this.hasInitializedBackend && !this.useMocks()) {
      this.syncFromBackend();
    }
    return () => this.listeners.delete(listener);
  }

  public notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error("Listener error:", err);
      }
    });
  }

  /**
   * Background eager sync with the real Express/MySQL backend
   */
  public async syncFromBackend() {
    if (this.useMocks() || this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Fetch IoT Devices
      const devRes = await apiClient.get<any[]>("/devices");
      if (devRes.data && Array.isArray(devRes.data)) {
        this.iotDevices = devRes.data.map((d) => ({
          id: String(d.id),
          code: d.deviceCode || `ESP32-${d.id}`,
          location: d.location || "North Entrance Turnstile",
          ipAddress: d.ipAddress || "192.168.1.50",
          macAddress: d.macAddress || "30:AE:A4:07:0E:64",
          status: d.isOnline || d.status === "ACTIVE" ? "ONLINE" : "OFFLINE",
          lastSeen: d.secondsSinceHeartbeat !== undefined
            ? `${d.secondsSinceHeartbeat}s ago`
            : "Active",
          rfidReader: "CONNECTED",
          lcdDisplay: "CONNECTED",
          buzzer: "CONNECTED",
          wifiStrength: -58,
          firmwareVersion: d.firmwareVersion || "v2.4.1",
        }));
      }

      // 2. Fetch OD Requests
      const odRes = await apiClient.get<any[]>("/od-requests");
      if (odRes.data && Array.isArray(odRes.data)) {
        this.odRequests = odRes.data.map((r) => ({
          id: r.id || `OD-${r.id}`,
          studentRoll: r.studentRoll || "2025105002",
          studentName: r.studentName || "Student",
          department: r.department || "Computer Science & Engineering",
          date: r.date || new Date().toISOString().split("T")[0],
          endDate: r.endDate || r.date || new Date().toISOString().split("T")[0],
          category: r.category || "Symposium",
          subject: r.subject || "Academic",
          reason: r.reason || "Institutional OD",
          documentName: r.documentName || "OD_Proof.pdf",
          status: r.status || "SUBMITTED",
          facultyReviewer: r.facultyReviewer,
          adminReviewer: r.adminReviewer,
          submittedAt: r.submittedAt || new Date().toISOString(),
        }));
      }

      // 3. Fetch Help Desk Tickets
      const tktRes = await apiClient.get<any[]>("/helpdesk");
      if (tktRes.data && Array.isArray(tktRes.data)) {
        this.tickets = tktRes.data;
      }

      // 4. Fetch Audit Logs
      const auditRes = await apiClient.get<{ logs: any[] }>("/audit-logs");
      if (auditRes.data?.logs && Array.isArray(auditRes.data.logs)) {
        this.auditLogs = auditRes.data.logs.map((l: any) => ({
          id: String(l.id),
          timestamp: l.createdAt ? l.createdAt.replace("T", " ").substring(0, 19) : l.timestamp,
          user: l.user || "System",
          role: l.role || "ADMIN",
          action: l.action || "SYSTEM_AUDIT",
          target: l.target || "Resource",
          oldValue: l.oldValue || "N/A",
          newValue: l.newValue || "N/A",
          reason: l.reason || "Routine audit trail",
        }));
      }

      // 5. Fetch Notifications
      const notifRes = await apiClient.get<any[]>("/notifications");
      if (notifRes.data && Array.isArray(notifRes.data)) {
        this.notifications = notifRes.data.map((n: any) => ({
          id: String(n.id),
          title: n.title,
          message: n.message,
          time: n.createdAt ? n.createdAt.replace("T", " ").substring(0, 19) : "Just now",
          type: n.type || "INFO",
          targetRole: n.targetRole || "ALL",
          read: !!n.isRead,
        }));
      }

      this.hasInitializedBackend = true;
      this.notify();
    } catch (err) {
      console.warn("Backend sync fallback to mock store:", err);
    } finally {
      this.isSyncing = false;
    }
  }

  // --- Audit Logger ---
  public writeAuditLog(entry: {
    user: string;
    role: "STUDENT" | "FACULTY" | "ADMIN";
    action: string;
    target: string;
    oldValue: string;
    newValue: string;
    reason: string;
  }) {
    const log: AuditLogItem = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      ...entry,
    };
    this.auditLogs = [log, ...this.auditLogs];
    this.notify();
    return log;
  }

  // --- Students CRUD ---
  public getStudents(): Student[] {
    return [...this.students];
  }

  public getStudentByRoll(rollNo: string): Student | undefined {
    return this.students.find((s) => s.rollNo === rollNo);
  }

  public addStudent(student: Omit<Student, "id">, operator: { user: string; role: "ADMIN" }): Student {
    const newStudent: Student = {
      id: `STU-${Math.floor(100 + Math.random() * 900)}`,
      ...student,
    };
    this.students = [newStudent, ...this.students];
    this.writeAuditLog({
      user: operator.user,
      role: operator.role,
      action: "STUDENT_ENROLLED",
      target: `${newStudent.rollNo} (${newStudent.name})`,
      oldValue: "NONE",
      newValue: `DEPT: ${newStudent.department}, RFID: ${newStudent.rfidUid}`,
      reason: "New student institutional admission",
    });
    this.notify();
    return newStudent;
  }

  public updateStudent(rollNo: string, updates: Partial<Student>, operator: { user: string; role: "STUDENT" | "FACULTY" | "ADMIN"; reason?: string }): Student {
    const existing = this.students.find((s) => s.rollNo === rollNo);
    if (!existing) throw new Error("Student not found");

    const updated = { ...existing, ...updates };
    this.students = this.students.map((s) => (s.rollNo === rollNo ? updated : s));

    this.writeAuditLog({
      user: operator.user,
      role: operator.role,
      action: "STUDENT_PROFILE_UPDATED",
      target: `${rollNo} (${existing.name})`,
      oldValue: JSON.stringify({ phone: existing.phone, rfid: existing.rfidUid, status: existing.status }),
      newValue: JSON.stringify({ phone: updated.phone, rfid: updated.rfidUid, status: updated.status }),
      reason: operator.reason || "Profile credential update",
    });
    this.notify();
    return updated;
  }

  public deleteStudent(rollNo: string, operator: { user: string; role: "ADMIN"; reason: string }): boolean {
    const existing = this.students.find((s) => s.rollNo === rollNo);
    if (!existing) return false;

    this.students = this.students.filter((s) => s.rollNo !== rollNo);
    this.writeAuditLog({
      user: operator.user,
      role: operator.role,
      action: "STUDENT_RECORD_DELETED",
      target: `${rollNo} (${existing.name})`,
      oldValue: "ACTIVE ENROLLED",
      newValue: "DELETED",
      reason: operator.reason || "Student graduated / transfer",
    });
    this.notify();
    return true;
  }

  // --- Faculty CRUD ---
  public getFaculty(): Faculty[] {
    return [...this.faculty];
  }

  public addFaculty(fac: Omit<Faculty, "id">, operator: { user: string; role: "ADMIN" }): Faculty {
    const newFac: Faculty = {
      id: `FAC-${Math.floor(100 + Math.random() * 900)}`,
      ...fac,
    };
    this.faculty = [newFac, ...this.faculty];
    this.writeAuditLog({
      user: operator.user,
      role: operator.role,
      action: "FACULTY_ADDED",
      target: `${newFac.employeeId} (${newFac.name})`,
      oldValue: "NONE",
      newValue: `DEPT: ${newFac.department}`,
      reason: "Institutional appointment",
    });
    this.notify();
    return newFac;
  }

  public deleteFaculty(employeeId: string, operator: { user: string; role: "ADMIN"; reason: string }): boolean {
    const existing = this.faculty.find((f) => f.employeeId === employeeId);
    if (!existing) return false;

    this.faculty = this.faculty.filter((f) => f.employeeId !== employeeId);
    this.writeAuditLog({
      user: operator.user,
      role: operator.role,
      action: "FACULTY_DELETED",
      target: `${employeeId} (${existing.name})`,
      oldValue: "ACTIVE",
      newValue: "REMOVED",
      reason: operator.reason,
    });
    this.notify();
    return true;
  }

  // --- Courses & Classrooms ---
  public getCourses(): Course[] {
    return [...this.courses];
  }

  public addCourse(course: Course, operator: { user: string; role: "ADMIN" }): Course {
    this.courses = [course, ...this.courses];
    this.writeAuditLog({
      user: operator.user,
      role: operator.role,
      action: "COURSE_CREATED",
      target: `${course.code} - ${course.name}`,
      oldValue: "NONE",
      newValue: `Credits: ${course.credits}, Faculty: ${course.facultyName}`,
      reason: "Curriculum update",
    });
    this.notify();
    return course;
  }

  public getClassrooms(): Classroom[] {
    return [...this.classrooms];
  }

  // --- Attendance Analytics & Intelligence Calculations ---
  public getAttendanceRecords(studentRoll?: string): AttendanceRecord[] {
    if (!studentRoll) return [...this.attendanceRecords];
    return this.attendanceRecords.filter((r) => r.studentRoll === studentRoll);
  }

  public getSubjectAttendanceSummary(studentRoll: string = "2025105002") {
    // If we have cached backend summary, serve it
    if (this.backendSubjectSummary.has(studentRoll)) {
      return this.backendSubjectSummary.get(studentRoll)!;
    }

    // Trigger async fetch if real backend is targeted
    if (!this.useMocks() && typeof window !== "undefined") {
      apiClient
        .get<any[]>(`/attendance/subjects?studentId=${studentRoll}`)
        .then((res) => {
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            const mapped = res.data.map((sub: any) => ({
              code: sub.code || sub.subjectCode,
              name: sub.name || sub.subjectName,
              faculty: sub.faculty || sub.facultyName || "Faculty Incharge",
              held: sub.held ?? 30,
              attended: sub.attended ?? 26,
              absent: sub.absent ?? 4,
              od: sub.od ?? 0,
              late: sub.late ?? 0,
              percentage: sub.percentage ?? 86.7,
              status:
                sub.status === "ELIGIBLE" || sub.percentage >= 90
                  ? "ELIGIBLE"
                  : sub.percentage >= 75
                  ? "SAFE"
                  : sub.percentage >= 70
                  ? "WARNING"
                  : "SHORTAGE",
            }));
            this.backendSubjectSummary.set(studentRoll, mapped);
            this.notify();
          }
        })
        .catch(() => {});
    }

    const studentRecords = this.getAttendanceRecords(studentRoll);
    const summaryMap: Record<
      string,
      {
        code: string;
        name: string;
        faculty: string;
        held: number;
        attended: number;
        absent: number;
        od: number;
        late: number;
        percentage: number;
        status: "SAFE" | "WARNING" | "SHORTAGE" | "ELIGIBLE";
      }
    > = {};

    this.courses.forEach((c) => {
      const records = studentRecords.filter((r) => r.courseCode === c.code);
      const held = records.length || 30; // Fallback to course default if fresh
      const attended = records.filter((r) => r.status === "PRESENT" || r.status === "LATE" || r.status === "OD").length;
      const absent = records.filter((r) => r.status === "ABSENT").length;
      const od = records.filter((r) => r.status === "OD").length;
      const late = records.filter((r) => r.status === "LATE").length;
      const percentage = held > 0 ? Number(((attended / held) * 100).toFixed(1)) : 100;

      let status: "SAFE" | "WARNING" | "SHORTAGE" | "ELIGIBLE" = "SAFE";
      if (percentage >= 90) status = "ELIGIBLE";
      else if (percentage >= 75) status = "SAFE";
      else if (percentage >= 70) status = "WARNING";
      else status = "SHORTAGE";

      summaryMap[c.code] = {
        code: c.code,
        name: c.name,
        faculty: c.facultyName,
        held,
        attended,
        absent,
        od,
        late,
        percentage,
        status,
      };
    });

    return Object.values(summaryMap);
  }

  public getOverallStudentStats(studentRoll: string = "2025105002") {
    if (this.backendOverallStats.has(studentRoll)) {
      return this.backendOverallStats.get(studentRoll)!;
    }

    if (!this.useMocks() && typeof window !== "undefined") {
      apiClient
        .get<any>(`/attendance/summary?studentId=${studentRoll}`)
        .then((res) => {
          if (res.data) {
            const d = res.data;
            const mapped = {
              totalHeld: d.held ?? 180,
              totalAttended: d.attended ?? 158,
              totalAbsent: d.absent ?? 22,
              overallPercentage: d.percentage ?? 87.8,
              maxAllowedMisses: d.safeMisses ?? 6,
              classesNeededFor75: d.requiredTo75 ?? 0,
              attendanceStreak: d.streak ?? 12,
              isEligible: (d.percentage ?? 87.8) >= 75,
            };
            this.backendOverallStats.set(studentRoll, mapped);
            this.notify();
          }
        })
        .catch(() => {});
    }

    const subjects = this.getSubjectAttendanceSummary(studentRoll);
    const totalHeld = subjects.reduce((acc, curr) => acc + curr.held, 0);
    const totalAttended = subjects.reduce((acc, curr) => acc + curr.attended, 0);
    const totalAbsent = subjects.reduce((acc, curr) => acc + curr.absent, 0);
    const overallPercentage = totalHeld > 0 ? Number(((totalAttended / totalHeld) * 100).toFixed(1)) : 87.0;

    // Calculation for safe classes to miss: Attended / (TotalHeld + X) >= 0.75 => X = (Attended / 0.75) - TotalHeld
    const maxAllowedMisses = Math.max(0, Math.floor((totalAttended - 0.75 * totalHeld) / 0.75));

    // Calculation for classes needed if in shortage: (Attended + Y) / (TotalHeld + Y) >= 0.75 => Y = (0.75*TotalHeld - Attended) / 0.25
    const classesNeededFor75 = overallPercentage < 75 ? Math.max(0, Math.ceil((0.75 * totalHeld - totalAttended) / 0.25)) : 0;

    return {
      totalHeld,
      totalAttended,
      totalAbsent,
      overallPercentage,
      maxAllowedMisses,
      classesNeededFor75,
      attendanceStreak: 12, // 12 consecutive present sessions
      isEligible: overallPercentage >= 75,
    };
  }

  public getAttendanceCalendar(studentRoll: string, subjectCode: string, month: number = 7, year: number = 2026) {
    const key = `${studentRoll}_${subjectCode}_${month}_${year}`;
    if (this.backendCalendars.has(key)) {
      return this.backendCalendars.get(key)!;
    }

    if (!this.useMocks() && typeof window !== "undefined") {
      apiClient
        .get<any[]>(
          `/attendance/calendar?studentId=${studentRoll}&subject=${subjectCode}&month=${month}&year=${year}`
        )
        .then((res) => {
          if (res.data && Array.isArray(res.data)) {
            const calMap: Record<number, any> = {};
            res.data.forEach((r) => {
              const dayNum = r.date ? new Date(r.date).getUTCDate() : r.day;
              if (dayNum) {
                calMap[dayNum] = {
                  status: r.status,
                  time: r.time || "09:05 AM",
                  method: r.method || "RFID Turnstile",
                  device: r.deviceId || "ESP32-01",
                  confidence: r.confidence || 100,
                };
              }
            });
            this.backendCalendars.set(key, calMap);
            this.notify();
          }
        })
        .catch(() => {});
    }

    const monthStr = String(month).padStart(2, "0");
    const records = this.attendanceRecords.filter(
      (r) =>
        r.studentRoll === studentRoll &&
        r.courseCode === subjectCode &&
        r.date.startsWith(`${year}-${monthStr}`)
    );

    const calendarMap: Record<
      number,
      {
        status: "PRESENT" | "ABSENT" | "OD" | "LATE";
        time: string;
        method: string;
        device: string;
        confidence: number;
      }
    > = {};

    records.forEach((r) => {
      calendarMap[r.day] = {
        status: r.status,
        time: r.time,
        method: r.method,
        device: r.deviceId,
        confidence: r.confidence,
      };
    });

    return calendarMap;
  }

  public recordLiveAttendanceScan(event: {
    studentRoll: string;
    studentName: string;
    courseCode: string;
    room: string;
    method: "RFID" | "AI Face Vision" | "Dual Verification" | "Manual Override";
    status?: "PRESENT" | "LATE";
    deviceId?: string;
  }): AttendanceRecord {
    const todayStr = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const course = this.courses.find((c) => c.code === event.courseCode) || this.courses[0];

    const record: AttendanceRecord = {
      id: `REC-${Date.now()}`,
      date: todayStr,
      day: new Date().getDate(),
      period: "Period 1",
      time: nowTime,
      courseCode: course.code,
      courseName: course.name,
      facultyName: course.facultyName,
      studentRoll: event.studentRoll,
      studentName: event.studentName,
      room: event.room,
      status: event.status || "PRESENT",
      method: event.method,
      deviceId: event.deviceId || "ESP32-01",
      confidence: event.method.includes("Face") ? 99.2 : 100,
      livenessPassed: true,
    };

    this.attendanceRecords = [record, ...this.attendanceRecords];
    this.notify();
    return record;
  }

  public correctAttendance(recordId: string, newStatus: "PRESENT" | "ABSENT" | "OD" | "LATE", operator: { user: string; role: "FACULTY" | "ADMIN"; reason: string }) {
    const existing = this.attendanceRecords.find((r) => r.id === recordId);
    if (!existing) throw new Error("Record not found");

    const oldStatus = existing.status;
    existing.status = newStatus;
    existing.method = "Manual Override";

    // Attempt backend manual override if live
    if (!this.useMocks()) {
      apiClient
        .post("/attendance/manual", {
          recordId,
          status: newStatus,
          reason: operator.reason,
        })
        .catch((err) => console.warn("Backend manual correction deferred:", err));
    }

    this.writeAuditLog({
      user: operator.user,
      role: operator.role,
      action: "ATTENDANCE_CORRECTION",
      target: `${existing.studentRoll} (${existing.courseCode}) on ${existing.date}`,
      oldValue: oldStatus,
      newValue: newStatus,
      reason: operator.reason,
    });
    this.notify();
    return existing;
  }

  // --- OD Requests ---
  public getODRequests(studentRoll?: string): ODRequest[] {
    if (!studentRoll) return [...this.odRequests];
    return this.odRequests.filter((r) => r.studentRoll === studentRoll);
  }

  public submitODRequest(data: Omit<ODRequest, "id" | "status" | "submittedAt">): ODRequest {
    const newOD: ODRequest = {
      id: `OD-${Math.floor(100 + Math.random() * 900)}`,
      ...data,
      status: "SUBMITTED",
      submittedAt: new Date().toLocaleString(),
    };
    this.odRequests = [newOD, ...this.odRequests];

    if (!this.useMocks()) {
      apiClient
        .post("/od-requests", {
          fromDate: data.date,
          toDate: data.endDate || data.date,
          reason: data.reason,
          subject: data.subject,
          category: data.category,
        })
        .catch((err) => console.warn("Backend OD post deferred:", err));
    }

    this.writeAuditLog({
      user: data.studentRoll,
      role: "STUDENT",
      action: "OD_REQUEST_SUBMITTED",
      target: `${newOD.id} • ${newOD.subject}`,
      oldValue: "NONE",
      newValue: "SUBMITTED",
      reason: data.reason,
    });
    this.notify();
    return newOD;
  }

  public updateODStatus(id: string, status: "FACULTY_APPROVED" | "APPROVED" | "REJECTED", reviewer: { user: string; role: "FACULTY" | "ADMIN"; reason?: string }) {
    const req = this.odRequests.find((r) => r.id === id);
    if (!req) throw new Error("OD Request not found");

    const oldStatus = req.status;
    req.status = status;
    if (reviewer.role === "FACULTY") req.facultyReviewer = reviewer.user;
    if (reviewer.role === "ADMIN") req.adminReviewer = reviewer.user;

    if (!this.useMocks()) {
      const cleanId = id.replace("OD-", "");
      apiClient
        .patch(`/od-requests/${cleanId}/status`, {
          status: status === "FACULTY_APPROVED" ? "APPROVED" : status,
          reason: reviewer.reason,
        })
        .catch((err) => console.warn("Backend OD status update deferred:", err));
    }

    this.writeAuditLog({
      user: reviewer.user,
      role: reviewer.role,
      action: `OD_REQUEST_${status}`,
      target: `${id} (${req.studentName})`,
      oldValue: oldStatus,
      newValue: status,
      reason: reviewer.reason || "Verification of supporting documentation",
    });
    this.notify();
    return req;
  }

  // --- IoT Devices & Telemetry ---
  public getIoTDevices(): IoTDevice[] {
    return [...this.iotDevices];
  }

  public restartDevice(deviceId: string, operator: { user: string; role: "ADMIN" }) {
    const dev = this.iotDevices.find((d) => d.id === deviceId || d.code === deviceId);
    if (!dev) return false;

    dev.lastSeen = "Rebooting...";
    dev.status = "ONLINE";

    if (!this.useMocks()) {
      apiClient
        .post(`/devices/${dev.id}/restart`)
        .catch((err) => console.warn("Backend restart command deferred:", err));
    }

    this.writeAuditLog({
      user: operator.user,
      role: operator.role,
      action: "DEVICE_RESTART_TRIGGERED",
      target: `${dev.code} (${dev.location})`,
      oldValue: "RUNNING",
      newValue: "REBOOT_COMMAND_SENT",
      reason: "Routine gateway maintenance cycle",
    });
    this.notify();
    return true;
  }

  public testBuzzer(deviceId: string): boolean {
    const dev = this.iotDevices.find((d) => d.id === deviceId || d.code === deviceId);
    if (!dev) return false;
    dev.buzzer = "CONNECTED";

    if (!this.useMocks()) {
      apiClient
        .post(`/devices/${dev.id}/test-buzzer`)
        .catch((err) => console.warn("Backend test-buzzer command deferred:", err));
    }

    return true;
  }

  // --- Help Desk Tickets ---
  public getTickets(role: "STUDENT" | "FACULTY" | "ADMIN", userId?: string): HelpDeskTicket[] {
    if (role === "ADMIN") return [...this.tickets];
    return this.tickets.filter((t) => t.creatorId === userId);
  }

  public createTicket(data: {
    creatorId: string;
    creatorName: string;
    creatorRole: "STUDENT" | "FACULTY" | "ADMIN";
    category: HelpDeskTicket["category"];
    subject: string;
    priority: HelpDeskTicket["priority"];
    initialMessage: string;
  }): HelpDeskTicket {
    const ticketId = `TKT-${Math.floor(400 + Math.random() * 500)}`;
    const now = new Date().toLocaleString();
    const newTicket: HelpDeskTicket = {
      id: ticketId,
      creatorId: data.creatorId,
      creatorName: data.creatorName,
      creatorRole: data.creatorRole,
      category: data.category,
      subject: data.subject,
      priority: data.priority,
      status: "OPEN",
      assignedTo: "Support Helpdesk Specialist",
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: `MSG-${Date.now()}`,
          senderName: data.creatorName,
          senderRole: data.creatorRole,
          message: data.initialMessage,
          timestamp: now,
        },
      ],
    };
    this.tickets = [newTicket, ...this.tickets];

    if (!this.useMocks()) {
      apiClient
        .post("/helpdesk", {
          category: data.category,
          subject: data.subject,
          priority: data.priority,
          message: data.initialMessage,
        })
        .catch((err) => console.warn("Backend ticket create deferred:", err));
    }

    this.notify();
    return newTicket;
  }

  public replyToTicket(ticketId: string, message: { senderName: string; senderRole: "STUDENT" | "FACULTY" | "ADMIN"; text: string }): HelpDeskTicket {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");

    ticket.messages.push({
      id: `MSG-${Date.now()}`,
      senderName: message.senderName,
      senderRole: message.senderRole,
      message: message.text,
      timestamp: new Date().toLocaleString(),
    });
    ticket.updatedAt = new Date().toLocaleString();

    if (!this.useMocks()) {
      apiClient
        .post(`/helpdesk/${ticketId}/messages`, { message: message.text })
        .catch((err) => console.warn("Backend ticket reply deferred:", err));
    }

    this.notify();
    return ticket;
  }

  public updateTicketStatus(ticketId: string, status: HelpDeskTicket["status"], operator: { user: string; role: "ADMIN" }) {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.updatedAt = new Date().toLocaleString();

    if (!this.useMocks()) {
      apiClient
        .patch(`/helpdesk/${ticketId}/status`, { status })
        .catch((err) => console.warn("Backend ticket status deferred:", err));
    }

    this.writeAuditLog({
      user: operator.user,
      role: operator.role,
      action: "TICKET_STATUS_CHANGED",
      target: ticketId,
      oldValue: oldStatus,
      newValue: status,
      reason: `Help desk ticket lifecycle transition to ${status}`,
    });
    this.notify();
  }

  // --- Notifications ---
  public getNotifications(role: "STUDENT" | "FACULTY" | "ADMIN", userId?: string): NotificationItem[] {
    return this.notifications.filter(
      (n) => n.targetRole === "ALL" || n.targetRole === role || (userId && n.targetUser === userId)
    );
  }

  public markNotificationRead(id: string) {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.notify();
  }

  public markAllNotificationsRead(role: "STUDENT" | "FACULTY" | "ADMIN", userId?: string) {
    this.notifications = this.notifications.map((n) => {
      if (n.targetRole === "ALL" || n.targetRole === role || (userId && n.targetUser === userId)) {
        return { ...n, read: true };
      }
      return n;
    });
    this.notify();
  }

  // --- Audit Logs & Anomalies ---
  public getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogs];
  }

  public getAnomalies(): AnomalyItem[] {
    return [...this.anomalies];
  }
}

// Global Singleton Instance
export const mockService = new MockDataStore();
