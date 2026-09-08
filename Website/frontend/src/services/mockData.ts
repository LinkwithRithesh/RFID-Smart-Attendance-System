// Centralized Mock Data Store for SmartAttend Prototype
// Architected to mirror realistic production schemas (students, faculty, courses, timetables,
// attendance telemetry, ESP32 IoT devices, tickets, notifications, audit logs, anomalies).

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  semester: number;
  section: string;
  rfidUid: string;
  faceRegistered: boolean;
  status: "ACTIVE" | "INACTIVE";
  parentName: string;
  parentPhone: string;
  address: string;
}

export interface Faculty {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  assignedCourses: string[];
  status: "ACTIVE" | "ON_LEAVE";
}

export interface Course {
  code: string;
  name: string;
  department: string;
  semester: number;
  credits: number;
  type: "Theory" | "Lab";
  facultyId: string;
  facultyName: string;
}

export interface Classroom {
  roomNumber: string;
  block: string;
  capacity: number;
  deviceId: string;
  deviceStatus: "ONLINE" | "OFFLINE";
  cameraNode: string;
  currentAttendance?: number;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  day: number;
  period: string;
  time: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  studentRoll: string;
  studentName: string;
  room: string;
  status: "PRESENT" | "ABSENT" | "OD" | "LATE";
  method: "RFID" | "AI Face Vision" | "Dual Verification" | "Manual Override";
  deviceId: string;
  confidence: number; // percentage
  livenessPassed: boolean;
}

export interface IoTDevice {
  id: string;
  code: string;
  location: string;
  ipAddress: string;
  macAddress: string;
  status: "ONLINE" | "OFFLINE";
  lastSeen: string;
  rfidReader: "CONNECTED" | "DISCONNECTED";
  lcdDisplay: "CONNECTED" | "DISCONNECTED";
  buzzer: "CONNECTED" | "DISCONNECTED";
  wifiStrength: number; // dBm e.g. -52
  firmwareVersion: string;
}

export interface ODRequest {
  id: string;
  studentRoll: string;
  studentName: string;
  department: string;
  date: string;
  endDate?: string;
  category: "Sports" | "Symposium" | "Medical" | "Hackathon" | "Personal";
  subject: string;
  reason: string;
  documentName: string;
  status: "SUBMITTED" | "FACULTY_APPROVED" | "APPROVED" | "REJECTED";
  facultyReviewer?: string;
  adminReviewer?: string;
  submittedAt: string;
}

export interface HelpDeskTicket {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorRole: "STUDENT" | "FACULTY" | "ADMIN";
  category: "RFID Hardware" | "Face Recognition" | "Attendance Correction" | "Portal Access" | "Network/IoT";
  subject: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    senderName: string;
    senderRole: "STUDENT" | "FACULTY" | "ADMIN";
    message: string;
    timestamp: string;
  }>;
}

export interface NotificationItem {
  id: string;
  targetRole: "ALL" | "STUDENT" | "FACULTY" | "ADMIN";
  targetUser?: string;
  title: string;
  message: string;
  time: string;
  type: "WARNING" | "SUCCESS" | "INFO" | "CRITICAL";
  read: boolean;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  role: "STUDENT" | "FACULTY" | "ADMIN";
  action: string;
  target: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

export interface AnomalyItem {
  id: string;
  timestamp: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  type: "DUPLICATE_SCAN" | "UNKNOWN_RFID" | "FACE_MISMATCH" | "LOW_CONFIDENCE" | "OUT_OF_SCHEDULE" | "DEVICE_OFFLINE";
  title: string;
  description: string;
  studentRoll?: string;
  studentName?: string;
  deviceId: string;
  room: string;
}

// -------------------------------------------------------------
// INITIAL DATA ARRAYS (Emptied for Real MySQL Data)
// -------------------------------------------------------------

export const initialStudents: Student[] = [];
export const initialFaculty: Faculty[] = [];
export const initialCourses: Course[] = [];
export const initialClassrooms: Classroom[] = [];
export const initialIoTDevices: IoTDevice[] = [];
export const generateHistoricalAttendance = (): AttendanceRecord[] => [];
export const initialAttendanceRecords: AttendanceRecord[] = [];
export const initialODRequests: ODRequest[] = [];
export const initialTickets: HelpDeskTicket[] = [];
export const initialNotifications: NotificationItem[] = [];
export const initialAuditLogs: AuditLogItem[] = [];
export const initialAnomalies: AnomalyItem[] = [];
