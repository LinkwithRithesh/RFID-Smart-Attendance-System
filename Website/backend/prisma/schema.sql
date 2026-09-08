-- Smart Campus Attendance Management System
-- MySQL 8.0 DDL — Module 2
-- Order matters: tables are created in dependency order; the one circular
-- reference (departments.hod_user_id <-> users.department_id) is resolved
-- with a deferred ALTER TABLE after both tables exist.

-- ============ RBAC ============
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- ============ ORG STRUCTURE ============
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  hod_user_id INT NULL, -- FK added after users table exists
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============ CENTRAL IDENTITY / AUTH ============
-- One row per human in the system regardless of role. Role-specific
-- attributes live in the profile tables below, not here.
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  department_id INT NULL,
  phone VARCHAR(20) NULL,
  rfid_card_id VARCHAR(100) UNIQUE,
  face_embedding_path VARCHAR(255),
  refresh_token_hash VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  INDEX idx_users_dept_active (department_id, is_active)
);

ALTER TABLE departments
  ADD CONSTRAINT fk_departments_hod
  FOREIGN KEY (hod_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============ ACADEMICS ============
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  department_id INT NOT NULL,
  duration_semesters TINYINT NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  course_id INT NOT NULL,
  semester TINYINT NOT NULL,
  credits TINYINT NOT NULL DEFAULT 3,
  faculty_id INT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============ ROLE-SPECIFIC PROFILES (one table per role) ============
CREATE TABLE student_profiles (
  user_id INT PRIMARY KEY,
  roll_number VARCHAR(30) NOT NULL UNIQUE,
  course_id INT NOT NULL,
  current_semester TINYINT NOT NULL,
  admission_year YEAR NOT NULL,
  parent_name VARCHAR(150) NULL,
  parent_phone VARCHAR(20) NULL,
  address VARCHAR(255) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
);

CREATE TABLE faculty_profiles (
  user_id INT PRIMARY KEY,
  employee_id VARCHAR(30) NOT NULL UNIQUE,
  designation VARCHAR(100),
  joining_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE hod_profiles (
  user_id INT PRIMARY KEY,
  employee_id VARCHAR(30) NOT NULL UNIQUE,
  department_id INT NOT NULL,
  appointed_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

CREATE TABLE dean_profiles (
  user_id INT PRIMARY KEY,
  employee_id VARCHAR(30) NOT NULL UNIQUE,
  appointed_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE administrator_profiles (
  user_id INT PRIMARY KEY,
  employee_id VARCHAR(30) NOT NULL UNIQUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE office_staff_profiles (
  user_id INT PRIMARY KEY,
  employee_id VARCHAR(30) NOT NULL UNIQUE,
  desk_location VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE lab_assistant_profiles (
  user_id INT PRIMARY KEY,
  employee_id VARCHAR(30) NOT NULL UNIQUE,
  lab_name VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE security_profiles (
  user_id INT PRIMARY KEY,
  employee_id VARCHAR(30) NOT NULL UNIQUE,
  shift VARCHAR(20),
  post_location VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE housekeeping_profiles (
  user_id INT PRIMARY KEY,
  employee_id VARCHAR(30) NOT NULL UNIQUE,
  shift VARCHAR(20),
  zone VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE maintenance_profiles (
  user_id INT PRIMARY KEY,
  employee_id VARCHAR(30) NOT NULL UNIQUE,
  shift VARCHAR(20),
  specialization VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============ DEVICES (ESP32 terminals) ============
CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_code VARCHAR(50) NOT NULL UNIQUE,
  api_key_hash VARCHAR(255) NOT NULL,
  location VARCHAR(150),
  department_id INT NOT NULL,
  status ENUM('ONLINE','OFFLINE','MAINTENANCE','DECOMMISSIONED') NOT NULL DEFAULT 'OFFLINE',
  firmware_version VARCHAR(20),
  last_heartbeat_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

-- ============ TIMETABLE ============
CREATE TABLE timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  faculty_id INT NOT NULL,
  department_id INT NOT NULL,
  room_number VARCHAR(20),
  day_of_week ENUM('MON','TUE','WED','THU','FRI','SAT','SUN') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  semester TINYINT NOT NULL,
  academic_year VARCHAR(9) NOT NULL, -- e.g. '2025-2026'
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  INDEX idx_timetable_dept_day (department_id, day_of_week)
);

-- ============ ATTENDANCE ============
-- session_type generalizes the model: CLASS sessions come from the timetable
-- engine; WORKER_SHIFT sessions cover Security/Housekeeping/Maintenance/etc.;
-- EVENT covers one-off manual sessions. This keeps a single Attendance +
-- AttendanceSessions pair for every role instead of per-role variants.
CREATE TABLE attendance_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_type ENUM('CLASS','WORKER_SHIFT','EVENT') NOT NULL,
  timetable_id INT NULL,
  subject_id INT NULL,
  faculty_id INT NULL,
  department_id INT NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('SCHEDULED','OPEN','CLOSED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  override_type ENUM('NONE','EMERGENCY','DEAN','ADMIN','HOD') NOT NULL DEFAULT 'NONE',
  opened_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (timetable_id) REFERENCES timetable(id) ON DELETE SET NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (opened_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sessions_dept_status (department_id, status),
  INDEX idx_sessions_dept_date (department_id, session_date),
  INDEX idx_sessions_dept_type_date (department_id, session_type, session_date),
  INDEX idx_sessions_faculty_date (faculty_id, session_date)
);

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  device_id INT NULL,
  method ENUM('RFID_FACE','MANUAL') NOT NULL,
  status ENUM('PRESENT','LATE','ABSENT') NOT NULL,
  marked_at DATETIME NOT NULL,
  is_synced BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE = pending offline sync
  synced_at DATETIME NULL,
  UNIQUE KEY uq_session_user (session_id, user_id), -- one attendance record per user per session
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
  INDEX idx_attendance_user_status (user_id, status)
);

-- ============ NOTIFICATIONS ============
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  channel ENUM('EMAIL','PUSH') NOT NULL,
  type ENUM('ATTENDANCE_CONFIRMATION','LOW_ATTENDANCE_ALERT','GENERAL') NOT NULL,
  status ENUM('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_created (user_id, created_at)
);

-- ============ LEAVE REQUESTS ============
CREATE TABLE leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason VARCHAR(500),
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  approved_by INT NULL,
  decided_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============ AUDIT LOGS ============
CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT NULL, -- NULL = system-generated action
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NULL,
  metadata JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============ ANNOUNCEMENTS ============
-- target_role is a loose VARCHAR ('ALL' or one of the 10 role names) rather
-- than a DB enum/FK — validated at the application layer (zod), which is
-- simpler than an 11-value enum or a join to roles for a purely informational
-- broadcast-scope field.
CREATE TABLE announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_no VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  category ENUM('CIRCULAR','ALERT','DEVICE_STATUS','EXAM','GENERAL') NOT NULL,
  priority ENUM('URGENT','HIGH','NORMAL') NOT NULL DEFAULT 'NORMAL',
  target_role VARCHAR(20) NULL DEFAULT 'ALL',
  issued_by_id INT NULL,
  date_issued DATE NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issued_by_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_announcements_category (category),
  INDEX idx_announcements_target_role (target_role)
);

-- ============ DOCUMENTS ============
-- Official forms/certificates, uploaded via Multer (the file-upload package
-- in the tech stack that hadn't been used by any prior module).
CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  category ENUM('CERTIFICATE','LEAVE','CIRCULAR','GUIDELINES') NOT NULL,
  description TEXT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes INT NOT NULL,
  downloads_count INT NOT NULL DEFAULT 0,
  uploaded_by_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_documents_category (category)
);
