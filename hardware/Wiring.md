# 🔌 Hardware Connections

This document describes the wiring connections between the **NodeMCU ESP8266** and the peripherals used in the RFID Smart Attendance Management System.

---

# NodeMCU Pinout Overview

| Peripheral | Interface |
|------------|-----------|
| MFRC522 RFID Reader | SPI |
| 16×2 LCD Display | I2C |
| Buzzer | Digital Output |

---

# MFRC522 RFID Reader Connections (SPI)

| MFRC522 Pin | NodeMCU Pin | Description |
|-------------|-------------|-------------|
| SDA (SS) | D4 (GPIO2) | SPI Chip Select |
| SCK | D5 (GPIO14) | SPI Clock |
| MOSI | D7 (GPIO13) | Master Out Slave In |
| MISO | D6 (GPIO12) | Master In Slave Out |
| RST | D3 (GPIO0) | RFID Reset |
| VCC | 3.3V | Power Supply |
| GND | GND | Ground |

> **Important:** The MFRC522 module must be powered using **3.3V only**. Connecting it to **5V** may permanently damage the module.

---

# 16×2 LCD Display (I2C)

| LCD Pin | NodeMCU Pin | Description |
|----------|-------------|-------------|
| SDA | D2 (GPIO4) | I2C Data |
| SCL | D1 (GPIO5) | I2C Clock |
| VCC | VIN (5V) | Power Supply |
| GND | GND | Ground |

**Default I2C Address:** `0x27`

> Some LCD I2C modules use the address `0x3F`. If the display is not detected, scan the I2C bus to determine the correct address.

---

# Buzzer Connections

| Buzzer Pin | NodeMCU Pin | Description |
|------------|-------------|-------------|
| Positive (+) | D8 (GPIO15) | Digital Output |
| Negative (-) | GND | Ground |

---

# Communication Interfaces

| Interface | Peripheral | NodeMCU Pins |
|------------|------------|--------------|
| SPI | MFRC522 RFID Reader | D3, D4, D5, D6, D7 |
| I2C | 16×2 LCD Display | D1, D2 |
| GPIO | Buzzer | D8 |

---

# Wiring Notes

- Connect **all GND pins together**.
- Power the NodeMCU using a stable **5V USB supply**.
- Use **short jumper wires** to minimize signal interference.
- Verify all wiring before powering the circuit.
- The MFRC522 communicates over the **SPI** interface, while the LCD uses **I2C**, allowing both peripherals to operate simultaneously.

---

# Wiring Diagram

Refer to the circuit diagram included in this repository:

```text
images/Circuit_Diagram.png
```

Alternatively, open the image directly from the **images/** folder in the repository.