# Hardware Connections

This document describes the wiring connections between the ESP32 DevKit V1 and the peripherals used in the RFID Smart Attendance Management System.

---

# ESP32 Pinout Overview

| Peripheral | Interface |
|------------|-----------|
| MFRC522 RFID Reader | SPI |
| LCD Display (16×2) | I2C |
| Buzzer | Digital Output |

---

# RC522 RFID Reader Connections (SPI)

| RC522 Pin | ESP32 Pin | Description |
|-----------|-----------|-------------|
| SDA (SS) | GPIO 5 | SPI Chip Select |
| SCK | GPIO 18 | SPI Clock |
| MOSI | GPIO 23 | Master Out Slave In |
| MISO | GPIO 19 | Master In Slave Out |
| RST | GPIO 27 | RFID Reset |
| 3.3V | 3.3V | Power Supply |
| GND | GND | Ground |

> **Note:** The MFRC522 module must be powered using **3.3V**. Supplying **5V** may permanently damage the module.

---

# 16×2 LCD Display (I2C)

| LCD Pin | ESP32 Pin | Description |
|----------|-----------|-------------|
| SDA | GPIO 21 | I2C Data |
| SCL | GPIO 22 | I2C Clock |
| VCC | VIN (5V) | Power Supply |
| GND | GND | Ground |

> **Default I2C Address:** `0x27`

---

# Buzzer

| Buzzer Pin | ESP32 Pin | Description |
|------------|-----------|-------------|
| Positive (+) | GPIO 4 | Digital Output |
| Negative (-) | GND | Ground |

---

# Communication Interfaces

| Interface | Used By | ESP32 Pins |
|------------|----------|------------|
| SPI | MFRC522 RFID Reader | GPIO 5, 18, 19, 23, 27 |
| I2C | LCD Display | GPIO 21, 22 |
| GPIO | Buzzer | GPIO 4 |

---

# Wiring Notes

- Connect **all GND pins** together.
- Ensure the ESP32 receives a stable **5V USB supply**.
- Use short jumper wires to reduce signal interference.
- Verify all wiring before powering the circuit.
- The MFRC522 communicates over the **SPI** interface, while the LCD uses **I2C**, allowing both peripherals to operate simultaneously.

---

# Wiring Diagram

Refer to the project circuit diagram:

```text
images/Circuit_Diagram.jpeg
```

or view it directly from the repository.
