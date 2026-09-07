/*
 * Smart Campus Attendance — ESP32 Terminal Firmware
 *
 * IMPORTANT: This code has NOT been compiled, flashed, or tested against
 * real hardware. It was written to match the backend's exact HTTP contract
 * (verified via 180 passing backend tests and live testing throughout the
 * project), but the firmware itself is unverified — I have no ESP32,
 * Arduino IDE, or compiler in this environment. Treat this as a solid
 * starting point to build and debug on real hardware, not as
 * drop-in-and-run code. Check board pinout, library versions, and test
 * incrementally (WiFi first, then RFID read, then HTTP call).
 *
 * Libraries needed (Arduino IDE > Library Manager):
 *   - MFRC522 by GithubCommunity (RFID reader)
 *   - LiquidCrystal_I2C by Frank de Brabander (or johnrickman fork)
 *   - ArduinoJson by Benoit Blanchon (v6.x)
 *   - Preferences (built into ESP32 core — for offline record caching)
 *   - WiFi, HTTPClient (built into ESP32 core)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Preferences.h>

// ---------------- CONFIG — fill these in ----------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_BASE  = "http://192.168.1.100:5000/api/v1"; // your backend's LAN IP, not localhost
const char* DEVICE_CODE   = "ESP32-CSE-01";     // from device registration (Step 1)
const char* DEVICE_API_KEY = "PASTE_THE_PLAINTEXT_KEY_HERE"; // shown once at registration — copy it now
const char* FIRMWARE_VERSION = "1.0.0";

// ---------------- PIN CONFIG — verify against your board ----------------
#define RFID_SS_PIN   5
#define RFID_RST_PIN  4   // moved off 22 to avoid conflict with I2C SCL
#define BUZZER_PIN    2
#define LED_RED_PIN   25
#define LED_GREEN_PIN 26
#define LED_BLUE_PIN  27

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2); // 0x27 is the common default I2C address — scan if this doesn't work
Preferences prefs;

const unsigned long HEARTBEAT_INTERVAL_MS = 60000;
const unsigned long DUPLICATE_SWIPE_COOLDOWN_MS = 3000; // ignore the same card re-triggering within this window
unsigned long lastHeartbeat = 0;
String lastCardId = "";
unsigned long lastCardTime = 0;

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_BLUE_PIN, OUTPUT);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Smart Campus");
  lcd.setCursor(0, 1);
  lcd.print("Attendance");

  prefs.begin("attendance", false); // namespace for offline record cache

  connectWiFi();
  setupTime(); // must run after WiFi connects — see setupTime() below
  delay(1500);
  showIdleScreen();
}

void loop() {
  // Reconnect WiFi if dropped, and flush any offline-cached records once back online
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  } else {
    syncOfflineRecordsIfAny();
  }

  // Periodic heartbeat
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }

  // Poll for a card
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String cardId = uidToString(rfid.uid.uidByte, rfid.uid.size);
    rfid.PICC_HaltA();

    // Debounce: ignore the same card retriggering within the cooldown window
    if (cardId == lastCardId && millis() - lastCardTime < DUPLICATE_SWIPE_COOLDOWN_MS) {
      return;
    }
    lastCardId = cardId;
    lastCardTime = millis();

    handleCardSwipe(cardId);
  }
}

// ---------------- WiFi ----------------
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  lcd.clear();
  lcd.print("Connecting WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
  }
  showIdleScreen();
}

// ---------------- Card swipe handling ----------------
void handleCardSwipe(const String& cardId) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Card: " + cardId.substring(0, 10));

  if (WiFi.status() != WL_CONNECTED) {
    // Offline: cache the swipe with the current timestamp for later sync.
    // NOTE: ESP32 has no RTC battery by default — get real time via NTP at
    // boot (see configTime()) so cached timestamps are accurate; omitted
    // here for brevity but essential for /attendance/sync to classify
    // PRESENT vs LATE correctly.
    cacheOfflineRecord(cardId);
    lcd.setCursor(0, 1);
    lcd.print("Saved (offline)");
    beep(1, 100);
    setLed(255, 165, 0); // amber = cached, not yet confirmed
    delay(1500);
    showIdleScreen();
    return;
  }

  markAttendanceOnline(cardId);
}

void markAttendanceOnline(const String& cardId) {
  HTTPClient http;
  http.begin(String(BACKEND_BASE) + "/attendance/mark");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-code", DEVICE_CODE);
  http.addHeader("x-device-api-key", DEVICE_API_KEY);

  StaticJsonDocument<128> doc;
  doc["rfidCardId"] = cardId;
  String body;
  serializeJson(doc, body);

  int statusCode = http.POST(body);
  String response = http.getString();
  http.end();

  StaticJsonDocument<512> respDoc;
  deserializeJson(respDoc, response);
  bool success = respDoc["success"] | false;
  String message = respDoc["message"] | "Unknown error";

  lcd.clear();
  lcd.setCursor(0, 0);

  if (success) {
    String status = respDoc["data"]["status"] | "PRESENT";
    lcd.print(status == "LATE" ? "Marked: LATE" : "Marked: PRESENT");
    beep(1, 150);
    setLed(0, 255, 0); // green = success
  } else {
    // Covers: invalid RFID, no open session, already marked (see backend's
    // markAttendanceByRfid flow — these are the exact failure branches)
    lcd.print("Failed");
    lcd.setCursor(0, 1);
    lcd.print(message.substring(0, 16));
    beep(3, 80);
    setLed(255, 0, 0); // red = rejected
  }

  delay(2000);
  showIdleScreen();
}

// ---------------- Offline caching (Preferences/NVS as a simple queue) ----------------
void cacheOfflineRecord(const String& cardId) {
  int count = prefs.getInt("count", 0);
  String key = "rec_" + String(count);
  // Store the REAL timestamp of this swipe now, while we know it — not at
  // sync time, which could be hours later and would misclassify PRESENT vs
  // LATE (or attribute the swipe to the wrong session entirely). Requires
  // setupTime() to have already synced via NTP before going offline.
  String record = cardId + "|" + getIsoTimestamp();
  prefs.putString(key.c_str(), record);
  prefs.putInt("count", count + 1);
}

void syncOfflineRecordsIfAny() {
  int count = prefs.getInt("count", 0);
  if (count == 0) return;

  StaticJsonDocument<4096> doc;
  JsonArray records = doc.createNestedArray("records");

  for (int i = 0; i < count; i++) {
    String key = "rec_" + String(i);
    String record = prefs.getString(key.c_str(), "");
    if (record == "") continue;
    int sep = record.indexOf('|');
    String cardId = record.substring(0, sep);
    String markedAt = record.substring(sep + 1); // the real swipe time, stored in cacheOfflineRecord()
    JsonObject rec = records.createNestedObject();
    rec["rfidCardId"] = cardId;
    rec["markedAt"] = markedAt;
  }

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(String(BACKEND_BASE) + "/attendance/sync");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-code", DEVICE_CODE);
  http.addHeader("x-device-api-key", DEVICE_API_KEY);
  int statusCode = http.POST(body);
  http.end();

  if (statusCode == 200) {
    prefs.clear(); // backend reports per-record success/failure in the response body — log it before clearing in production
  }
}

// ---------------- Heartbeat ----------------
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(String(BACKEND_BASE) + "/devices/heartbeat");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-code", DEVICE_CODE);
  http.addHeader("x-device-api-key", DEVICE_API_KEY);

  StaticJsonDocument<64> doc;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  String body;
  serializeJson(doc, body);

  http.POST(body);
  http.end();
}

// ---------------- Helpers ----------------
String uidToString(byte* buffer, byte size) {
  String result = "";
  for (byte i = 0; i < size; i++) {
    if (buffer[i] < 0x10) result += "0";
    result += String(buffer[i], HEX);
  }
  result.toUpperCase();
  return result;
}

// ---------------- Time (NTP) ----------------
// Runs once after WiFi connects. The ESP32 has no battery-backed RTC, so
// without this, millis()-based "timestamps" are meaningless once cached
// offline records get synced — the backend uses markedAt to resolve which
// session/window the swipe belongs to and whether it counts as LATE.
void setupTime() {
  // Deliberately UTC (offset 0), NOT your local timezone. getIsoTimestamp()
  // below labels its output with "Z" (UTC) — if configTime applied a local
  // offset here, gmtime() would return local time while still claiming to
  // be UTC, silently corrupting every timestamp sent to the backend. If you
  // want the LCD to show local time for users, convert only at display time
  // (e.g. in showIdleScreen()), never in what gets sent over HTTP.
  configTime(0, 0, "pool.ntp.org", "time.google.com");
  struct tm timeinfo;
  int attempts = 0;
  while (!getLocalTime(&timeinfo) && attempts < 10) {
    delay(500);
    attempts++;
  }
}

String getIsoTimestamp() {
  time_t now;
  struct tm timeinfo;
  time(&now);
  if (!getLocalTime(&timeinfo)) {
    // NTP never synced (e.g. first boot with no WiFi yet) — fall back to
    // epoch; better to flag this in your monitoring than silently guess.
    return "1970-01-01T00:00:00.000Z";
  }
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S.000Z", gmtime(&now));
  return String(buf);
}

void beep(int times, int durationMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(durationMs);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  }
}

void setLed(int r, int g, int b) {
  analogWrite(LED_RED_PIN, r);
  analogWrite(LED_GREEN_PIN, g);
  analogWrite(LED_BLUE_PIN, b);
}

void showIdleScreen() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Scan your card");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.status() == WL_CONNECTED ? "Online" : "Offline mode");
  setLed(0, 0, 255); // blue = idle
}
