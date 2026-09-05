# 🛠 Hardware Components

This document lists the hardware components required to build the RFID Smart Attendance Management System.

| Component | Specification | Quantity | Purpose |
|-----------|---------------|:--------:|---------|
| ESP8266 Development Board | NodeMCU ESP8266 | 1 | Main microcontroller with built-in Wi-Fi |
| RFID Reader | MFRC522 (13.56 MHz) | 1 | Reads RFID card and tag UIDs |
| RFID Cards/Tags | MIFARE Classic 13.56 MHz | Multiple | Student identification |
| LCD Display | 16×2 LCD with I2C Module | 1 | Displays attendance status and system messages |
| Buzzer | Active Buzzer (3.3V/5V) | 1 | Provides audible feedback for successful and unsuccessful scans |
| Breadboard | Standard Solderless Breadboard | 1 | Prototyping and testing |
| Jumper Wires | Male-to-Male / Male-to-Female | As Required | Electrical connections between components |
| USB Cable | USB Type-A to Micro-USB | 1 | Programming and powering the ESP8266 |

---

## Hardware Summary

| Category | Details |
|----------|---------|
| Microcontroller | NodeMCU ESP8266 |
| RFID Communication | SPI |
| LCD Communication | I2C |
| Network Connectivity | Built-in Wi-Fi |
| Power Supply | USB 5V |

---

## Notes

- The **MFRC522 RFID module operates only at 3.3V**.
- The **NodeMCU ESP8266 provides built-in Wi-Fi**, eliminating the need for an external Wi-Fi module.
- Ensure all components share a **common ground (GND)** for reliable operation.
- Additional RFID cards or tags can be added without hardware modifications.