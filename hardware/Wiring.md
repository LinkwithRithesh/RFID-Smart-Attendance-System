# Hardware Connections

## RC522 → ESP32

| RC522 | ESP32 |
|-------|-------|
| SDA | GPIO 5 |
| SCK | GPIO 18 |
| MOSI | GPIO 23 |
| MISO | GPIO 19 |
| RST | GPIO 27 |
| 3.3V | 3.3V |
| GND | GND |

---

## LCD (I2C)

| LCD | ESP32 |
|------|-------|
| SDA | GPIO 21 |
| SCL | GPIO 22 |
| VCC | VIN (5V) |
| GND | GND |

---

## Buzzer

| Buzzer | ESP32 |
|---------|-------|
| + | GPIO 4 |
| - | GND |