# RFID-Based Smart Attendance Management System Using ESP32 and Google Sheets

An IoT-based attendance management system that automates attendance recording using RFID technology and cloud storage. Each student is assigned an RFID card with a unique UID. When scanned, the ESP32 verifies the UID, displays the student's information on an LCD, provides buzzer feedback, and uploads the attendance to Google Sheets in real time through Google Apps Script.

---

## Features

- RFID-based attendance system
- ESP32 with built-in Wi-Fi
- Real-time Google Sheets integration
- LCD status display
- Buzzer notifications
- Duplicate attendance prevention
- Cloud-based attendance records

---

## Hardware Components

| Component | Purpose |
|-----------|---------|
| ESP32 DevKit V1 | Main controller |
| MFRC522 RFID Reader | Reads RFID cards |
| RFID Cards/Tags | Student identification |
| 16×2 LCD (I2C) | Displays messages |
| Buzzer | Audio indication |

---

## Software

- Arduino IDE
- Google Apps Script
- Google Sheets
- Wokwi Simulator

---

## Project Structure

```
RFID-Smart-Attendance-System
│
├── firmware
├── hardware
├── google-apps-script
├── docs
├── images
├── wokwi
├── README.md
└── LICENSE
```

---

## Working Principle

1. ESP32 connects to Wi-Fi.
2. LCD prompts the user to scan an RFID card.
3. RFID reader reads the UID.
4. ESP32 verifies the UID.
5. Student information is displayed.
6. Attendance is uploaded to Google Sheets.
7. LCD confirms attendance.
8. Buzzer provides audio feedback.

---

## LCD Messages

### Startup

```
RFID Attendance
Connecting...
```

### Ready

```
Scan RFID Card
```

### Valid Card

```
Welcome
Student Name
```

### Attendance Recorded

```
Attendance
Recorded
```

### Duplicate Attendance

```
Already
Marked
```

### Invalid Card

```
Invalid
Card
```

---

## Buzzer Indications

| Event | Sound |
|-------|-------|
| Startup | Short Beep |
| Attendance Recorded | Short Beep |
| Duplicate | Two Short Beeps |
| Invalid Card | Long Beep |

---

## Advantages

- Fast attendance recording
- Reduces manual work
- Real-time cloud storage
- Low-cost implementation
- Easy to scale

---

## Limitations

- RFID cards can be shared.
- Internet connection required.
- Student data is hardcoded.
- HTTPS requests are limited in Wokwi.

---

## Future Enhancements

- Face Recognition
- Fingerprint Authentication
- Firebase Integration
- Teacher Dashboard
- Mobile App
- Attendance Analytics

---

## License

MIT License