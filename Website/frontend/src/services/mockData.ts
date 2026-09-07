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
// INITIAL IN-MEMORY DATA
// -------------------------------------------------------------

export const initialStudents: Student[] = [
  {
    id: "STU-001",
    rollNo: "2025105002",
    name: "RITHESHWARAN A",
    email: "2025105002@student.annauniv.edu",
    phone: "9345641567",
    department: "Electronics & Communication Engg",
    semester: 3,
    section: "A",
    rfidUid: "E2-00-41-89-6F",
    faceRegistered: true,
    status: "ACTIVE",
    parentName: "Anand K.",
    parentPhone: "9840123456",
    address: "12, Gandhi Road, Adyar, Chennai - 600020",
  },
  {
    id: "STU-002",
    rollNo: "2024CS101",
    name: "Arun Kumar",
    email: "arun.cs24@campus.edu",
    phone: "9876543210",
    department: "Computer Science & Engineering",
    semester: 3,
    section: "A",
    rfidUid: "A4-F1-88-29-10",
    faceRegistered: true,
    status: "ACTIVE",
    parentName: "Kumaravel M.",
    parentPhone: "9876543211",
    address: "45, Greenways Road, Chennai - 600028",
  },
  {
    id: "STU-003",
    rollNo: "2024CS104",
    name: "Kavitha R",
    email: "kavitha.cs24@campus.edu",
    phone: "9445123890",
    department: "Computer Science & Engineering",
    semester: 3,
    section: "A",
    rfidUid: "C1-44-88-7A-09",
    faceRegistered: true,
    status: "ACTIVE",
    parentName: "Ramesh N.",
    parentPhone: "9445123891",
    address: "8, Lake View Street, Velachery, Chennai",
  },
  {
    id: "STU-004",
    rollNo: "2024CS112",
    name: "Deepak V",
    email: "deepak.cs24@campus.edu",
    phone: "9123456780",
    department: "Computer Science & Engineering",
    semester: 3,
    section: "B",
    rfidUid: "D8-19-4A-6E-55",
    faceRegistered: false,
    status: "ACTIVE",
    parentName: "Venkatesh S.",
    parentPhone: "9123456789",
    address: "19, Rajaji Nagar, Guindy, Chennai",
  },
  {
    id: "STU-005",
    rollNo: "2025105018",
    name: "Priya M",
    email: "priya.ece25@student.annauniv.edu",
    phone: "9898989898",
    department: "Electronics & Communication Engg",
    semester: 3,
    section: "A",
    rfidUid: "B2-99-12-FE-44",
    faceRegistered: true,
    status: "ACTIVE",
    parentName: "Murugan P.",
    parentPhone: "9898989899",
    address: "24, Anna Nagar 2nd Avenue, Chennai",
  },
];

export const initialFaculty: Faculty[] = [
  {
    id: "FAC-001",
    employeeId: "FAC001",
    name: "Dr. S. Ramesh",
    email: "ramesh@campus.edu",
    phone: "9444012345",
    department: "Computer Science & Engineering",
    designation: "Associate Professor & IoT Coordinator",
    assignedCourses: ["EC3401", "CS3401"],
    status: "ACTIVE",
  },
  {
    id: "FAC-002",
    employeeId: "FAC002",
    name: "Dr. K. Arumugam",
    email: "arumugam@campus.edu",
    phone: "9444054321",
    department: "Electronics & Communication Engg",
    designation: "Professor & HOD",
    assignedCourses: ["EC3402"],
    status: "ACTIVE",
  },
  {
    id: "FAC-003",
    employeeId: "FAC003",
    name: "Prof. N. Venkatesh",
    email: "venkatesh@campus.edu",
    phone: "9444098765",
    department: "Electronics & Communication Engg",
    designation: "Assistant Professor",
    assignedCourses: ["EC3403", "EC3411"],
    status: "ACTIVE",
  },
  {
    id: "FAC-004",
    employeeId: "FAC004",
    name: "Dr. M. Chitra",
    email: "chitra@campus.edu",
    phone: "9444077889",
    department: "Electronics & Communication Engg",
    designation: "Associate Professor",
    assignedCourses: ["EC3404"],
    status: "ACTIVE",
  },
];

export const initialCourses: Course[] = [
  {
    code: "EC3401",
    name: "Electromagnetic Fields",
    department: "Electronics & Communication Engg",
    semester: 3,
    credits: 4,
    type: "Theory",
    facultyId: "FAC-001",
    facultyName: "Dr. S. Ramesh",
  },
  {
    code: "EC3402",
    name: "Signals & Systems",
    department: "Electronics & Communication Engg",
    semester: 3,
    credits: 4,
    type: "Theory",
    facultyId: "FAC-002",
    facultyName: "Dr. K. Arumugam",
  },
  {
    code: "EC3403",
    name: "Analog Circuits Design",
    department: "Electronics & Communication Engg",
    semester: 3,
    credits: 3,
    type: "Theory",
    facultyId: "FAC-003",
    facultyName: "Prof. N. Venkatesh",
  },
  {
    code: "EC3404",
    name: "Digital Communications",
    department: "Electronics & Communication Engg",
    semester: 3,
    credits: 3,
    type: "Theory",
    facultyId: "FAC-004",
    facultyName: "Dr. M. Chitra",
  },
  {
    code: "EC3411",
    name: "Analog & Digital Circuits Lab",
    department: "Electronics & Communication Engg",
    semester: 3,
    credits: 2,
    type: "Lab",
    facultyId: "FAC-003",
    facultyName: "Prof. N. Venkatesh",
  },
  {
    code: "CS3401",
    name: "Algorithms & Data Structures",
    department: "Computer Science & Engineering",
    semester: 3,
    credits: 4,
    type: "Theory",
    facultyId: "FAC-001",
    facultyName: "Dr. S. Ramesh",
  },
];

export const initialClassrooms: Classroom[] = [
  { roomNumber: "Room 302", block: "Block A", capacity: 65, deviceId: "ESP32-01", deviceStatus: "ONLINE", cameraNode: "CAM-302", currentAttendance: 54 },
  { roomNumber: "Room 304", block: "Block A", capacity: 60, deviceId: "ESP32-02", deviceStatus: "ONLINE", cameraNode: "CAM-304", currentAttendance: 48 },
  { roomNumber: "Lab 2", block: "Core Engineering Block", capacity: 35, deviceId: "ESP32-03", deviceStatus: "ONLINE", cameraNode: "CAM-LAB2", currentAttendance: 32 },
  { roomNumber: "Lab 3", block: "Core Engineering Block", capacity: 40, deviceId: "ESP32-04", deviceStatus: "ONLINE", cameraNode: "CAM-LAB3", currentAttendance: 36 },
  { roomNumber: "Room 105", block: "Block B", capacity: 70, deviceId: "ESP32-05", deviceStatus: "OFFLINE", cameraNode: "CAM-105", currentAttendance: 0 },
];

export const initialIoTDevices: IoTDevice[] = [
  {
    id: "DEV-101",
    code: "ESP32-01",
    location: "Block A - Room 302",
    ipAddress: "192.168.1.101",
    macAddress: "24:6F:28:B1:3A:90",
    status: "ONLINE",
    lastSeen: "2 seconds ago",
    rfidReader: "CONNECTED",
    lcdDisplay: "CONNECTED",
    buzzer: "CONNECTED",
    wifiStrength: -52,
    firmwareVersion: "v4.2.1-prod",
  },
  {
    id: "DEV-102",
    code: "ESP32-02",
    location: "Block A - Room 304",
    ipAddress: "192.168.1.102",
    macAddress: "24:6F:28:B1:4C:12",
    status: "ONLINE",
    lastSeen: "4 seconds ago",
    rfidReader: "CONNECTED",
    lcdDisplay: "CONNECTED",
    buzzer: "CONNECTED",
    wifiStrength: -58,
    firmwareVersion: "v4.2.1-prod",
  },
  {
    id: "DEV-103",
    code: "ESP32-03",
    location: "Core Block - Lab 2",
    ipAddress: "192.168.1.103",
    macAddress: "24:6F:28:B1:8E:77",
    status: "ONLINE",
    lastSeen: "1 second ago",
    rfidReader: "CONNECTED",
    lcdDisplay: "CONNECTED",
    buzzer: "CONNECTED",
    wifiStrength: -48,
    firmwareVersion: "v4.2.1-prod",
  },
  {
    id: "DEV-104",
    code: "ESP32-04",
    location: "Core Block - Lab 3",
    ipAddress: "192.168.1.104",
    macAddress: "24:6F:28:B1:9F:33",
    status: "ONLINE",
    lastSeen: "5 seconds ago",
    rfidReader: "CONNECTED",
    lcdDisplay: "CONNECTED",
    buzzer: "CONNECTED",
    wifiStrength: -62,
    firmwareVersion: "v4.2.0-prod",
  },
  {
    id: "DEV-105",
    code: "ESP32-05",
    location: "Block B - Room 105",
    ipAddress: "192.168.1.105",
    macAddress: "24:6F:28:B2:1A:05",
    status: "OFFLINE",
    lastSeen: "18 minutes ago",
    rfidReader: "DISCONNECTED",
    lcdDisplay: "CONNECTED",
    buzzer: "CONNECTED",
    wifiStrength: -89,
    firmwareVersion: "v4.1.8-legacy",
  },
  {
    id: "DEV-106",
    code: "ESP32-06",
    location: "Campus Entrance Main Turnstile",
    ipAddress: "192.168.1.106",
    macAddress: "24:6F:28:B3:01:88",
    status: "ONLINE",
    lastSeen: "Just now",
    rfidReader: "CONNECTED",
    lcdDisplay: "CONNECTED",
    buzzer: "CONNECTED",
    wifiStrength: -44,
    firmwareVersion: "v4.2.1-prod",
  },
];

// Helper to seed realistic July & August & September 2026 logs for student 2025105002
function generateHistoricalAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const courses = [
    { code: "EC3401", name: "Electromagnetic Fields", faculty: "Dr. S. Ramesh", room: "Room 302", dev: "ESP32-01" },
    { code: "EC3402", name: "Signals & Systems", faculty: "Dr. K. Arumugam", room: "Room 302", dev: "ESP32-01" },
    { code: "EC3403", name: "Analog Circuits Design", faculty: "Prof. N. Venkatesh", room: "Room 304", dev: "ESP32-02" },
    { code: "EC3404", name: "Digital Communications", faculty: "Dr. M. Chitra", room: "Room 302", dev: "ESP32-01" },
    { code: "EC3411", name: "Analog & Digital Circuits Lab", faculty: "Prof. N. Venkatesh", room: "Lab 2", dev: "ESP32-03" },
  ];

  // July 2026 dates (1-31)
  const statusMapEC3403: Record<number, "PRESENT" | "ABSENT" | "OD" | "LATE"> = {
    1: "PRESENT", 2: "PRESENT", 3: "ABSENT", 6: "PRESENT", 7: "ABSENT", 8: "ABSENT",
    9: "PRESENT", 10: "OD", 13: "PRESENT", 14: "LATE", 15: "ABSENT", 16: "ABSENT",
    17: "PRESENT", 20: "ABSENT", 21: "ABSENT", 22: "PRESENT", 23: "ABSENT", 24: "OD",
    27: "PRESENT", 28: "PRESENT", 29: "ABSENT", 30: "PRESENT", 31: "ABSENT"
  };

  for (let day = 1; day <= 31; day++) {
    const dayOfWeek = (day % 7);
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    courses.forEach((c, idx) => {
      let status: "PRESENT" | "ABSENT" | "OD" | "LATE" = "PRESENT";
      let method: "RFID" | "AI Face Vision" | "Dual Verification" | "Manual Override" = "RFID";
      let conf = 98.6 + (Math.random() * 1.3);

      if (c.code === "EC3403") {
        status = statusMapEC3403[day] || (day % 3 === 0 ? "ABSENT" : "PRESENT");
      } else {
        if (day === 8 || day === 21) status = "ABSENT";
        else if (day === 10 || day === 24) status = "OD";
        else if (day === 14) status = "LATE";
      }

      if (status === "PRESENT" || status === "LATE") {
        method = idx % 2 === 0 ? "RFID" : "AI Face Vision";
        if (day % 5 === 0) method = "Dual Verification";
        if (status === "LATE") method = "Manual Override";
      } else {
        conf = 0;
      }

      records.push({
        id: `REC-2026-07-${day}-${c.code}`,
        date: `2026-07-${String(day).padStart(2, "0")}`,
        day,
        period: `Period ${idx + 1}`,
        time: status === "LATE" ? "09:18 AM" : `09:${String(Math.floor(Math.random() * 4) + 1).padStart(2, "0")} AM`,
        courseCode: c.code,
        courseName: c.name,
        facultyName: c.faculty,
        studentRoll: "2025105002",
        studentName: "RITHESHWARAN A",
        room: c.room,
        status,
        method,
        deviceId: c.dev,
        confidence: status === "ABSENT" ? 0 : Number(conf.toFixed(1)),
        livenessPassed: status !== "ABSENT",
      });
    });
  }

  // September 2026 current days (1-4)
  for (let day = 1; day <= 4; day++) {
    courses.forEach((c, idx) => {
      records.push({
        id: `REC-2026-09-${day}-${c.code}`,
        date: `2026-09-${String(day).padStart(2, "0")}`,
        day,
        period: `Period ${idx + 1}`,
        time: `09:${String(Math.floor(Math.random() * 3) + 1).padStart(2, "0")} AM`,
        courseCode: c.code,
        courseName: c.name,
        facultyName: c.faculty,
        studentRoll: "2025105002",
        studentName: "RITHESHWARAN A",
        room: c.room,
        status: "PRESENT",
        method: "RFID",
        deviceId: c.dev,
        confidence: 99.4,
        livenessPassed: true,
      });
    });
  }

  return records;
}

export const initialAttendanceRecords: AttendanceRecord[] = generateHistoricalAttendance();

export const initialODRequests: ODRequest[] = [
  {
    id: "OD-901",
    studentRoll: "2025105002",
    studentName: "RITHESHWARAN A",
    department: "Electronics & Communication Engg",
    date: "2026-07-10",
    category: "Symposium",
    subject: "EC3401 Electromagnetic Fields",
    reason: "Attending National Level Robotics Symposium at IIT Madras",
    documentName: "symposium_invitation.pdf",
    status: "APPROVED",
    facultyReviewer: "Dr. S. Ramesh",
    adminReviewer: "Dr. K. Arumugam",
    submittedAt: "2026-07-05 10:30 AM",
  },
  {
    id: "OD-902",
    studentRoll: "2025105002",
    studentName: "RITHESHWARAN A",
    department: "Electronics & Communication Engg",
    date: "2026-07-24",
    category: "Sports",
    subject: "EC3403 Analog Circuits Design",
    reason: "Inter-College Basketball Quarterfinals representing Anna University team",
    documentName: "sports_selection_cert.pdf",
    status: "APPROVED",
    facultyReviewer: "Prof. N. Venkatesh",
    adminReviewer: "Dr. K. Arumugam",
    submittedAt: "2026-07-20 02:15 PM",
  },
  {
    id: "OD-903",
    studentRoll: "2024CS101",
    studentName: "Arun Kumar",
    department: "Computer Science & Engineering",
    date: "2026-09-12",
    category: "Hackathon",
    subject: "CS3401 Algorithms & Data Structures",
    reason: "Participating in Smart India Hackathon Grand Finale round in Pune",
    documentName: "sih_shortlist_letter.pdf",
    status: "FACULTY_APPROVED",
    facultyReviewer: "Dr. S. Ramesh",
    submittedAt: "2026-09-02 11:20 AM",
  },
  {
    id: "OD-904",
    studentRoll: "2025105002",
    studentName: "RITHESHWARAN A",
    department: "Electronics & Communication Engg",
    date: "2026-09-18",
    category: "Symposium",
    subject: "EC3404 Digital Communications",
    reason: "Presenting research paper on 5G Beamforming Antenna Array at IEEE TechCon",
    documentName: "ieee_paper_acceptance.pdf",
    status: "SUBMITTED",
    submittedAt: "2026-09-04 08:45 AM",
  },
];

export const initialTickets: HelpDeskTicket[] = [
  {
    id: "TKT-401",
    creatorId: "2025105002",
    creatorName: "RITHESHWARAN A",
    creatorRole: "STUDENT",
    category: "RFID Hardware",
    subject: "MFRC522 Card Scan Not Registering at Room 302 Turnstile",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignedTo: "IoT Field Engineer (K. Selvan)",
    createdAt: "2026-09-03 09:30 AM",
    updatedAt: "2026-09-03 11:15 AM",
    messages: [
      {
        id: "M-1",
        senderName: "RITHESHWARAN A",
        senderRole: "STUDENT",
        message: "My RFID card UID (E2-00-41-89-6F) was tapped at Room 302 during Period 1 today, but the ESP32 red buzzer sounded with 'UID UNRECOGNIZED'.",
        timestamp: "2026-09-03 09:30 AM",
      },
      {
        id: "M-2",
        senderName: "K. Selvan",
        senderRole: "ADMIN",
        message: "Checking ESP32-01 MQTT broker logs. Antenna coil calibration was adjusted this morning. Please retry scanning at turnstile 1.",
        timestamp: "2026-09-03 11:15 AM",
      },
    ],
  },
  {
    id: "TKT-402",
    creatorId: "2025105002",
    creatorName: "RITHESHWARAN A",
    creatorRole: "STUDENT",
    category: "Attendance Correction",
    subject: "Correct Attendance for Analog Circuits Lab on 28 Aug",
    priority: "MEDIUM",
    status: "RESOLVED",
    assignedTo: "HOD Office Staff",
    createdAt: "2026-08-29 02:00 PM",
    updatedAt: "2026-08-30 04:30 PM",
    messages: [
      {
        id: "M-1",
        senderName: "RITHESHWARAN A",
        senderRole: "STUDENT",
        message: "Marked absent despite completing the lab experiment and submitting observation note. Staff signed observation attached.",
        timestamp: "2026-08-29 02:00 PM",
      },
      {
        id: "M-2",
        senderName: "HOD Office Staff",
        senderRole: "ADMIN",
        message: "Verified with Prof. N. Venkatesh. Attendance record corrected to PRESENT with audit trail entry LOG-8799.",
        timestamp: "2026-08-30 04:30 PM",
      },
    ],
  },
  {
    id: "TKT-403",
    creatorId: "FAC001",
    creatorName: "Dr. S. Ramesh",
    creatorRole: "FACULTY",
    category: "Face Recognition",
    subject: "Camera Node CAM-302 Lighting Angle Causing False Rejections",
    priority: "MEDIUM",
    status: "OPEN",
    assignedTo: "AI Vision Engineer",
    createdAt: "2026-09-04 08:30 AM",
    updatedAt: "2026-09-04 08:30 AM",
    messages: [
      {
        id: "M-1",
        senderName: "Dr. S. Ramesh",
        senderRole: "FACULTY",
        message: "Morning sunlight entering Room 302 east window creates backlight glare on CAM-302 lens, causing 4 students to fail liveness check. Please install lens hood or adjust contrast threshold.",
        timestamp: "2026-09-04 08:30 AM",
      },
    ],
  },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: "NOTIF-1",
    targetRole: "STUDENT",
    targetUser: "2025105002",
    title: "Critical Attendance Shortage Alert",
    message: "Your attendance in Analog Circuits Design (EC3403) is 65.7%. You need 8 consecutive classes to reach the mandatory 75% cutoff.",
    time: "15 mins ago",
    type: "CRITICAL",
    read: false,
  },
  {
    id: "NOTIF-2",
    targetRole: "STUDENT",
    targetUser: "2025105002",
    title: "OD Request Approved",
    message: "Your OD request for the Robotics Symposium (OD-901) has been approved by HOD & Registrar.",
    time: "1 hour ago",
    type: "SUCCESS",
    read: false,
  },
  {
    id: "NOTIF-3",
    targetRole: "ALL",
    title: "ESP32 Firmware Upgrade Complete",
    message: "ESP32 firmware v4.2.1-prod deployed across Block A turnstiles. Reduced scan latency to 380ms.",
    time: "3 hours ago",
    type: "INFO",
    read: true,
  },
  {
    id: "NOTIF-4",
    targetRole: "FACULTY",
    targetUser: "FAC001",
    title: "Pending OD Requests Awaiting Action",
    message: "2 student OD requests for Hackathon & Paper presentation require first-level faculty review.",
    time: "4 hours ago",
    type: "WARNING",
    read: false,
  },
];

export const initialAuditLogs: AuditLogItem[] = [
  {
    id: "LOG-9001",
    timestamp: "2026-09-04 09:18:24",
    user: "FAC001 (Dr. S. Ramesh)",
    role: "FACULTY",
    action: "ATTENDANCE_MANUAL_OVERRIDE",
    target: "2025105002 (RITHESHWARAN A) • EC3401",
    oldValue: "ABSENT",
    newValue: "LATE (PRESENT)",
    reason: "Student delayed by 15 mins due to University bus breakdown on Route 14",
  },
  {
    id: "LOG-9002",
    timestamp: "2026-09-03 15:40:12",
    user: "ADM001 (Dr. K. Arumugam)",
    role: "ADMIN",
    action: "OD_REQUEST_FINAL_APPROVAL",
    target: "OD-901 • 2025105002",
    oldValue: "SUBMITTED",
    newValue: "APPROVED",
    reason: "National level robotics symposium official selection certificate verified",
  },
  {
    id: "LOG-9003",
    timestamp: "2026-09-02 11:20:45",
    user: "ADM001 (Dr. K. Arumugam)",
    role: "ADMIN",
    action: "RFID_UID_REASSIGNMENT",
    target: "2024CS101 (Arun Kumar)",
    oldValue: "A4-F1-00-11-22",
    newValue: "A4-F1-88-29-10",
    reason: "Reported lost smartcard replaced with new cryptographic Mifare DesFire card",
  },
  {
    id: "LOG-9004",
    timestamp: "2026-09-01 16:05:30",
    user: "ADM001 (Dr. K. Arumugam)",
    role: "ADMIN",
    action: "DEVICE_REGISTERED",
    target: "ESP32-06 (Main Turnstile)",
    oldValue: "UNREGISTERED",
    newValue: "PROVISIONED (192.168.1.106)",
    reason: "New entrance gate turnstile controller deployed",
  },
];

export const initialAnomalies: AnomalyItem[] = [
  {
    id: "ANO-301",
    timestamp: "Today 09:12:04 AM",
    severity: "HIGH",
    type: "DUPLICATE_SCAN",
    title: "Duplicate RFID Tap Prevented",
    description: "Card UID A4-F1-88-29-10 scanned twice within 3.4 seconds at Room 302 entrance",
    studentRoll: "2024CS101",
    studentName: "Arun Kumar",
    deviceId: "ESP32-01",
    room: "Room 302",
  },
  {
    id: "ANO-302",
    timestamp: "Today 08:58:19 AM",
    severity: "CRITICAL",
    type: "UNKNOWN_RFID",
    title: "Unregistered RFID Card Detected",
    description: "MFRC522 read UID 99-AA-BB-CC-01 not bound to any enrolled university record. Turnstile locked.",
    deviceId: "ESP32-06",
    room: "Campus Entrance",
  },
  {
    id: "ANO-303",
    timestamp: "Today 08:50:41 AM",
    severity: "MEDIUM",
    type: "LOW_CONFIDENCE",
    title: "AI Face Confidence Threshold Drop (71.2%)",
    description: "Camera node CAM-302 flagged low facial similarity due to backlight obstruction.",
    studentRoll: "2024CS112",
    studentName: "Deepak V",
    deviceId: "CAM-302",
    room: "Room 302",
  },
  {
    id: "ANO-304",
    timestamp: "Yesterday 04:15:00 PM",
    severity: "HIGH",
    type: "DEVICE_OFFLINE",
    title: "ESP32-05 WiFi Heartbeat Timeout",
    description: "MQTT Ping timeout exceeded 60s for Block B Room 105. Device transitioned to offline.",
    deviceId: "ESP32-05",
    room: "Room 105",
  },
];
