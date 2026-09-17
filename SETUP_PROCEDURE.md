# Full System Setup Procedure

This guide details the step-by-step procedure to set up the RFID-Smart-Attendance-System locally from GitHub, along with common errors you might encounter and how to fix them.

## 1. Prerequisites Installation
Ensure you have the following installed on your system before proceeding:
- **Git**
- **Node.js** (v16 or higher) and npm
- **MySQL Server** (Ensure the MySQL service is running)
- **Python** (v3.8 - v3.11 recommended)
- **Arduino IDE** (Optional, for hardware flashing)

Clone the repository to your machine:
```bash
git clone https://github.com/LinkwithRithesh/RFID-Smart-Attendance-System.git
cd RFID-Smart-Attendance-System
```

---

## 2. Database Setup (MySQL)
The application relies on a MySQL database to store users, attendance logs, and sessions.

**Steps:**
1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
4. Load the database schema and seed data into your local MySQL server. Run the following commands (you will be prompted for your MySQL root password):
   ```bash
   mysql -u root -p < prisma/schema.sql
   mysql -u root -p smart_campus_attendance < prisma/seed.sql
   mysql -u root -p smart_campus_attendance < prisma/seed-admin.sql
   ```

### ⚠️ Common Errors & Troubleshooting (Database)
- **Error:** `ERROR 1045 (28000): Access denied for user 'root'@'localhost'`
  - *Fix:* You typed the wrong password, or your MySQL username is different. Replace `root` with your actual MySQL username.
- **Error:** `ERROR 1049 (42000): Unknown database 'smart_campus_attendance'`
  - *Fix:* You missed running the first command `mysql -u root -p < prisma/schema.sql` which creates the database. Run it first.
- **Error:** `mysql is not recognized as an internal or external command`
  - *Fix:* Add the MySQL `bin` folder to your system's Environment Variables (PATH).

---

## 3. Backend Setup (Node.js API)
The backend acts as the bridge between the hardware/AI and the database.

**Steps:**
1. In the `backend` folder, copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *(On Windows, you can just duplicate the file manually and name it `.env`)*
2. Open the `.env` file and update the `DATABASE_URL` with your MySQL credentials:
   ```env
   DATABASE_URL="mysql://YOUR_USERNAME:YOUR_PASSWORD@localhost:3306/smart_campus_attendance"
   ```
3. Start the backend development server:
   ```bash
   npm run dev
   ```

### ⚠️ Common Errors & Troubleshooting (Backend)
- **Error:** `PrismaClientInitializationError: Authentication failed against database server`
  - *Fix:* Your username or password in the `.env` file is incorrect. Check the `DATABASE_URL`.
- **Error:** `Error: listen EADDRINUSE: address already in use :::5000`
  - *Fix:* Another application is using port 5000. Stop the other app, or change the `PORT` in the `.env` file.

---

## 4. Frontend Setup (Next.js Dashboard)
The Next.js web application is the user interface for Admins, Faculty, and Students.

**Steps:**
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Create the environment file:
   ```bash
   cp .env.local.example .env.local
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

### ⚠️ Common Errors & Troubleshooting (Frontend)
- **Error:** Frontend shows "Network Error" or cannot fetch data.
  - *Fix:* Ensure your backend server (step 3) is currently running. Check that `NEXT_PUBLIC_API_URL` in `.env.local` points to the correct backend URL.

---

## 5. AI Face Recognition Setup (Python)
The facial recognition module verifies a user's face alongside their RFID scan.

**Steps:**
1. Open a new terminal and navigate to the AI module:
   ```bash
   cd face-recognition
   ```
2. Create and activate a Python virtual environment (Recommended):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install opencv-python requests flask deepface tf-keras
   ```
4. Run the Python server:
   ```bash
   python code.py
   ```

### ⚠️ Common Errors & Troubleshooting (AI / Python)
- **Error:** `ModuleNotFoundError: No module named 'cv2'` (or other modules)
  - *Fix:* The dependencies were not installed correctly. Ensure you activated the virtual environment and ran the `pip install` command successfully.
- **Error:** `Could not open camera.`
  - *Fix:* Your webcam is being used by another application (like Zoom/Teams) or you haven't granted the terminal permission to access the camera.
- **Error:** `SMARTATTEND CONNECTION ERROR`
  - *Fix:* The Node.js backend server is not running on port 5000. Start the backend first.

---

## 6. Hardware Setup (ESP32 / ESP8266)
If you have the physical hardware components:

**Steps:**
1. Open the `firmware/` folder in the Arduino IDE.
2. Update the Wi-Fi credentials (`SSID` and `PASSWORD`) in the code.
3. Update the `BACKEND_URL` to point to the local IP address of your computer running the Node.js backend.
4. Select your board (ESP32/NodeMCU) and COM port, then upload the code.

### ⚠️ Common Errors & Troubleshooting (Hardware)
- **Error:** Hardware fails to connect to Wi-Fi.
  - *Fix:* Check if the SSID and password are correct. Remember that ESP8266/ESP32 modules only support 2.4GHz Wi-Fi networks, not 5GHz.
- **Error:** `A fatal error occurred: Failed to connect to ESP32: Timed out waiting for packet header`
  - *Fix:* Hold the "BOOT" button on your ESP32 board while it is connecting/uploading in the Arduino IDE.

---
*Setup Complete! You can now navigate to the Web Dashboard at `http://localhost:3000` to interact with the system.*
