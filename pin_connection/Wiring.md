nections_Converted.txt


# 🔌 Hardware Connections

This document describes the wiring connections between the **ESP32 DevKit** and
the peripherals used in the RFID Smart Attendance Management System.

---

# NodeMCU Pinout Overview

| Peripheral          | Interface      |
|---------------------|----------------|
| MFRC522 RFID Reader | SPI            |
| 16×2 LCD Display    | I2C            |
| Buzzer              | Digital Output |

---

# MFRC522 RFID Reader Connections (SPI)

| MFRC522 Pin | ESP32 DevKit Pin | Description               |
|-------------|------------------|---------------------------|
| 3.3V        | 3.3V             | Power Supply              |
| GND         | GND              | Ground                    |
| MISO        | D19 (GPIO 19)    | Master In / Slave Out     |
| MOSI        | D23 (GPIO 23)    | Master Out / Slave In     |
| SCK         | D18 (GPIO 18)    | SPI Clock                 |
| SDA (SS)    | D5 (GPIO 5)      | Chip Select (SS)          |
| RST         | D27 (GPIO 27)    | Reset                     |

> **Important:** The MFRC522 module must be powered using **3.3V only**.
> Connecting it to **5V** may permanently damage the module.

---

# 16×2 LCD Display (I2C)

| LCD Pin | ESP32 DevKit Pin | Description      |
|---------|------------------|------------------|
| VCC     | VIN (or 5V)      | Power Supply     |
| GND     | GND              | Ground           |
| SDA     | D21 (GPIO 21)    | I2C Data         |
| SCL     | D22 (GPIO 22)    | I2C Clock        |

**Default I2C Address:** `0x27`

> Some LCD I2C modules use the address `0x3F`. If the display is not detected,
> scan the I2C bus to determine the correct address.

---

# Buzzer Connections

| Active Buzzer Pin     | ESP32 DevKit Pin | Description              |
|-----------------------|------------------|--------------------------|
| Longer Pin / (+)      | D13 (GPIO 13)    | Digital Output Trigger   |
| Shorter Pin / (-)     | GND              | Ground                   |

---

# Communication Interfaces

| Interface | Peripheral          | ESP32 DevKit Pins       |
|-----------|---------------------|-------------------------|
| SPI       | MFRC522 RFID Reader | D5, D18, D19, D23, D27 |
| I2C       | 16×2 LCD Display    | D21, D22                |
| GPIO      | Buzzer              | D13                     |

---

# Wiring Notes

- Connect **all GND pins together**.
- Power the ESP32 DevKit using a stable **5V USB supply**.
- Use **short jumper wires** to minimize signal interference.
- Verify all wiring before powering the circuit.
- The MFRC522 communicates over the **SPI** interface, while the LCD uses **I2C**,
  allowing both peripherals to operate simultaneously.

---



