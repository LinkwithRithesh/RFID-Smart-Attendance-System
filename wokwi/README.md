# Wokwi Simulation

The simulation for this project was developed using an **ESP32 DevKit V1**, while the physical implementation uses a **NodeMCU ESP8266**.

## Why ESP32?

Wokwi provides better simulation support for the peripherals used in this project, including:

- MFRC522 RFID Reader
- I2C LCD Display
- Buzzer

The application logic, RFID handling, LCD operation, and attendance workflow remain the same. Only the microcontroller and GPIO assignments differ between the simulation and the physical implementation.

## Simulation

- **Simulator:** Wokwi
- **Board:** ESP32 DevKit V1

Project Link:

https://wokwi.com/projects/468725509737183233

> **Note:** Google Apps Script communication may not work correctly in Wokwi due to HTTPS/TLS limitations. The complete system functions correctly on the physical NodeMCU ESP8266 hardware.