# ESP32 Attendance Terminal Firmware

**Status: written to match the backend's exact API contract, but never compiled or
run against real hardware.** Unlike the backend/frontend in this project (180
backend tests passing, real MySQL/SMTP/file-upload integration tests, clean
TypeScript builds), this firmware has zero execution verification — there's no
ESP32, Arduino toolchain, or compiler available in the environment this was
written in. Two real bugs were caught by re-reading the code carefully before
shipping it (a timezone double-offset bug, and a bug that would have discarded
the real swipe time in favor of "now" at sync time) — there may be others that
only show up once this actually runs on hardware. Build and debug incrementally:
WiFi connection first, then RFID reads over serial, then the HTTP call, then
offline caching.

## What this firmware does

- Reads RFID cards (MFRC522), debounces repeat swipes
- Calls `POST /attendance/mark` when online; shows PRESENT/LATE/failure on the LCD with buzzer/LED feedback
- Caches swipes locally (ESP32 NVS/Preferences) when offline, with a real NTP-synced timestamp
- Flushes the offline cache via `POST /attendance/sync` once WiFi reconnects
- Sends a heartbeat every 60s via `POST /devices/heartbeat`

## What this firmware does NOT do

**Face recognition.** The backend's `/attendance/mark` trusts that face confirmation
already happened before it's called — it has no face-matching logic itself (no CV
library in the backend's stack; this was a deliberate scope boundary from early in
the project). This firmware is RFID-only. To add face confirmation, you need one of:
1. On-device matching on the ESP32-CAM (e.g. ESP-WHO / ESP-EYE) that gates the RFID call
2. A separate inference service the device calls before `/mark` (not part of this backend)
3. Accept RFID-only for now — get the system working end-to-end first

## Setup

1. **Register the device first** (from an admin session):
   ```bash
   curl -X POST http://<backend-host>:5000/api/v1/devices \
     -H "Authorization: Bearer <admin accessToken>" \
     -H "Content-Type: application/json" \
     -d '{"deviceCode":"ESP32-CSE-01","location":"CSE Block Entrance","departmentId":1}'
   ```
   Copy the returned `apiKey` immediately — it's shown exactly once.

2. **Arduino IDE > Library Manager**, install:
   - `MFRC522` (GithubCommunity)
   - `LiquidCrystal_I2C` (Frank de Brabander or johnrickman fork)
   - `ArduinoJson` (Benoit Blanchon, v6.x)
   - ESP32 board support package (WiFi/HTTPClient/Preferences ship with it)

3. Edit the CONFIG block at the top of `esp32_attendance_terminal.ino`:
   `WIFI_SSID`, `WIFI_PASSWORD`, `BACKEND_BASE` (your backend's **LAN IP**, not
   `localhost` — the ESP32 is a separate device on the network), `DEVICE_CODE`,
   `DEVICE_API_KEY` (from step 1).

4. Set your timezone's NTP offset if you want the LCD to show local time —
   **do not** change the UTC offset in `setupTime()` itself (see the comment
   there; that offset must stay 0 for timestamps sent to the backend to be
   correct — only convert for display, never for what gets sent over HTTP).

## Wiring (verify against your specific board's pinout — not verified here)

| Component | ESP32 Pin |
|---|---|
| MFRC522 SDA/SS | GPIO5 |
| MFRC522 SCK | GPIO18 |
| MFRC522 MOSI | GPIO23 |
| MFRC522 MISO | GPIO19 |
| MFRC522 RST | GPIO4 |
| MFRC522 3.3V/GND | 3.3V, GND (**not 5V**) |
| I2C LCD SDA | GPIO21 |
| I2C LCD SCL | GPIO22 |
| Buzzer | GPIO2 |
| RGB LED R/G/B | GPIO25/26/27 |

ESP32-CAM is a separate board — connect it independently (own WiFi or serial
link to the main ESP32), don't try to share the SPI/I2C bus above with it.

## Testing checklist (do this in order, on real hardware)

1. Flash with just `WiFi.begin()` + `Serial.println(WiFi.localIP())` — confirm WiFi works before adding anything else
2. Add the RFID read loop, print card UIDs to Serial — confirm reads work before adding HTTP
3. Add the `/attendance/mark` call against a real backend with an actual OPEN attendance session — confirm the full online path
4. Disconnect WiFi mid-test, swipe a card, reconnect — confirm the offline cache syncs correctly and `markedAt` is accurate (check the synced record's timestamp against when you actually swiped)
5. Only then wire up the LCD/buzzer/LED polish
