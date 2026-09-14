/*
 * RFID-Based Smart Attendance Management System (Reliability-Hardened)
 *
 * Author      : Ritheshwaran A
 * Platform    : ESP8266 (NodeMCU)
 * RFID Module : MFRC522
 * Display     : 16x2 LCD (I2C)
 * Cloud       : Google Sheets via Google Apps Script
 *
 * Changes vs original:
 *  - Non-blocking WiFi connect/reconnect (no more infinite/long blocking loops)
 *  - HTTP request retries with backoff
 *  - Fixed-size char buffers instead of String concatenation for URL building
 *    (reduces heap fragmentation on long-running ESP8266 deployments)
 *  - Explicit watchdog feeding around longer delays
 *  - Device stays usable (LCD + card scan) even while WiFi is down;
 *    failed uploads are retried automatically
 *  - Cleaned up buzzer patterns
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <SPI.h>
#include <Wire.h>
#include <MFRC522.h>
#include <LiquidCrystal_I2C.h>

// Project Configuration
#include "config.h"
#include "secrets.h"

// ---------------- Google Script ----------------
// NOTE: no trailing semicolon inside the string literal!
String GOOGLE_SCRIPT_URL = SCRIPT_URL;

// ---------------- RC522 Pins ----------------
#define SS_PIN  D4
#define RST_PIN D3

// ---------------- Buzzer ----------------
#define BUZZER D8

MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);
BearSSL::WiFiClientSecure secureClient;

// ---------------- State ----------------
String lastUID = "";
unsigned long lastScan = 0;

// WiFi connection state machine (non-blocking)
enum WifiState { WIFI_CONNECTING, WIFI_CONNECTED_STATE, WIFI_RETRY_WAIT };
WifiState wifiState = WIFI_CONNECTING;
unsigned long wifiStateChangedAt = 0;
const unsigned long WIFI_CONNECT_TIMEOUT_MS = 10000;  // give up after 10s, then wait & retry
const unsigned long WIFI_RETRY_INTERVAL_MS  = 5000;   // wait 5s before trying again
bool wifiEverConnected = false;

// Pending upload (queued if WiFi/HTTP not ready at scan time)
struct Student {
  const char* uid;
  const char* name;
  const char* regno;
  const char* dept;
};

Student students[] = {
  { "63D37530", "Sivadhinesh",         "2025105001", "ECE-I" },
  { "8970625E", "Ritheshwaran",        "2025105002", "ECE-I" },
  { "C0FFEE99", "Chinmaiyi",           "2025105006", "ECE-J" },
  { "29A5575E", "T N GokulaKrishnan",  "2025105519", "ECE-J" },
  {"99D66D5E","Keshav Praveen","2025105514","ECE-I"}
};
const int totalStudents = sizeof(students) / sizeof(students[0]);

bool uploadPending = false;
int pendingStudentIdx = -1;
int uploadRetries = 0;
const int MAX_UPLOAD_RETRIES = 3;
unsigned long nextUploadAttemptAt = 0;

// ---------------- Helpers ----------------

void beep(int duration) {
  digitalWrite(BUZZER, HIGH);
  delay(duration);
  digitalWrite(BUZZER, LOW);
  yield();  // feed watchdog after any delay >= a few hundred ms
}

String getUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

int findStudent(const String &uid) {
  for (int i = 0; i < totalStudents; i++) {
    if (uid == students[i].uid) return i;
  }
  return -1;
}

void showScanPrompt() {
  lcd.clear();
  lcd.print(wifiState == WIFI_CONNECTED_STATE ? "Scan RFID Card" : "Scan (Offline)");
}

// URL-encode a small set of characters we actually need (space) using a fixed buffer.
// Avoids repeated String concatenation / fragmentation.
void buildAttendanceURL(char *buf, size_t bufSize, const Student &s) {
  // Build into buf using snprintf, then replace spaces with %20 in-place.
  snprintf(buf, bufSize,
           "%s?name=%s&regno=%s&uid=%s&dept=%s&status=Present",
           SCRIPT_URL, s.name, s.regno, s.uid, s.dept);

  // In-place space -> %20 would grow the string, so instead do a second pass
  // into a temp buffer only if there are spaces (names can contain spaces).
  static char encoded[256];
  size_t j = 0;
  for (size_t i = 0; buf[i] != '\0' && j < sizeof(encoded) - 4; i++) {
    if (buf[i] == ' ') {
      encoded[j++] = '%';
      encoded[j++] = '2';
      encoded[j++] = '0';
    } else {
      encoded[j++] = buf[i];
    }
  }
  encoded[j] = '\0';
  strncpy(buf, encoded, bufSize - 1);
  buf[bufSize - 1] = '\0';
}

// ---------------- WiFi (non-blocking) ----------------

void startWifiConnect() {
  lcd.clear();
  lcd.print("Connecting WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  wifiState = WIFI_CONNECTING;
  wifiStateChangedAt = millis();
}

void updateWifi() {
  switch (wifiState) {
    case WIFI_CONNECTING:
      if (WiFi.status() == WL_CONNECTED) {
        wifiState = WIFI_CONNECTED_STATE;
        wifiEverConnected = true;
        Serial.println("\nWiFi Connected: " + WiFi.localIP().toString());
        lcd.clear();
        lcd.print("WiFi OK");
        beep(80);
        delay(200);
        showScanPrompt();
      } else if (millis() - wifiStateChangedAt > WIFI_CONNECT_TIMEOUT_MS) {
        Serial.println("WiFi connect timed out, will retry");
        wifiState = WIFI_RETRY_WAIT;
        wifiStateChangedAt = millis();
        showScanPrompt();  // device stays usable offline
      }
      break;

    case WIFI_CONNECTED_STATE:
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi dropped");
        wifiState = WIFI_RETRY_WAIT;
        wifiStateChangedAt = millis();
        showScanPrompt();
      }
      break;

    case WIFI_RETRY_WAIT:
      if (millis() - wifiStateChangedAt > WIFI_RETRY_INTERVAL_MS) {
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        wifiState = WIFI_CONNECTING;
        wifiStateChangedAt = millis();
      }
      break;
  }
}

// ---------------- Upload ----------------

void queueUpload(int studentIdx) {
  uploadPending = true;
  pendingStudentIdx = studentIdx;
  uploadRetries = 0;
  nextUploadAttemptAt = millis();  // attempt immediately
}

// Returns true on success, false on failure (caller decides on retry)
bool attemptUpload(const Student &s) {
  if (wifiState != WIFI_CONNECTED_STATE) return false;

  static char url[256];
  buildAttendanceURL(url, sizeof(url), s);

  Serial.println(url);

  HTTPClient http;
  http.setTimeout(4000);
  secureClient.setInsecure();
  secureClient.stop();

  if (!http.begin(secureClient, url)) {
    Serial.println("http.begin failed");
    return false;
  }
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

  int httpCode = http.GET();
  Serial.print("HTTP Code : ");
  Serial.println(httpCode);

  bool success = false;

  if (httpCode > 0) {
    String payload = http.getString();
    Serial.println(payload);

    lcd.clear();
    if (payload.indexOf("Attendance Recorded") != -1) {
      lcd.print("Attendance");
      lcd.setCursor(0, 1);
      lcd.print("Recorded");
      beep(80);
      success = true;
    } else if (payload.indexOf("Already Marked") != -1) {
      lcd.print("Already");
      lcd.setCursor(0, 1);
      lcd.print("Marked");
      beep(1000);
      delay(150);
      beep(500);
      success = true;  // server handled it; no need to retry
    } else {
      lcd.print("Server Reply?");
      Serial.println(payload);
      success = false;
    }
  } else {
    Serial.print("HTTP Error : ");
    Serial.println(http.errorToString(httpCode));
    lcd.clear();
    lcd.print("Upload Failed");
    lcd.setCursor(0, 1);
    lcd.print(httpCode);
    beep(400);
  }

  http.end();
  return success;
}

void updatePendingUpload() {
  if (!uploadPending) return;
  if (millis() < nextUploadAttemptAt) return;

  if (wifiState != WIFI_CONNECTED_STATE) {
    // Keep waiting for WiFi to come back; don't burn retries while offline.
    nextUploadAttemptAt = millis() + 1000;
    return;
  }

  const Student &s = students[pendingStudentIdx];
  bool ok = attemptUpload(s);

  if (ok) {
    uploadPending = false;
    pendingStudentIdx = -1;
    delay(200);
    showScanPrompt();
    return;
  }

  uploadRetries++;
  if (uploadRetries >= MAX_UPLOAD_RETRIES) {
    Serial.println("Giving up on this upload after max retries");
    lcd.clear();
    lcd.print("Upload Failed");
    lcd.setCursor(0, 1);
    lcd.print("Try scan again");
    beep(500);
    delay(1500);
    uploadPending = false;
    pendingStudentIdx = -1;
    showScanPrompt();
    return;
  }

  // Exponential-ish backoff: 1s, 2s, 4s...
  unsigned long backoff = 1000UL << (uploadRetries - 1);
  nextUploadAttemptAt = millis() + backoff;
  Serial.printf("Retry %d/%d in %lums\n", uploadRetries, MAX_UPLOAD_RETRIES, backoff);
}

// ---------------- RFID ----------------

void readRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uid = getUID();

  if (uid == lastUID && millis() - lastScan < 3000) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  lastUID = uid;
  lastScan = millis();
  Serial.print("UID : ");
  Serial.println(uid);

  int student = findStudent(uid);

  if (student == -1) {
    lcd.clear();
    lcd.print("Invalid Card");
    lcd.setCursor(0, 1);
    lcd.print(uid);
    beep(700);
    delay(1500);
    yield();
    showScanPrompt();
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  lcd.clear();
  lcd.print("Welcome");
  String name = students[student].name;

if (name.length() <= 16)
{
    lcd.setCursor(0,1);
    lcd.print(name);
    delay(300);
}
else
{
    for (int i = 0; i <= name.length() - 16; i++)
    {
        lcd.setCursor(0,1);
        lcd.print("                "); // Clear line
        lcd.setCursor(0,1);
        lcd.print(name.substring(i, i + 16));
        delay(250);
    }
}
  beep(60);
  delay(2000);
  yield();

  lcd.clear();
  lcd.print(wifiState == WIFI_CONNECTED_STATE ? "Uploading..." : "Queued (No WiFi)");

  queueUpload(student);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// ---------------- Setup / Loop ----------------

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, LOW);

  Wire.begin(D2, D1);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("RFID Attendance");
  lcd.setCursor(0, 1);
  lcd.print("Starting...");
  delay(100);
  SPI.begin();
  rfid.PCD_Init();

  startWifiConnect();
}

void loop() {
  updateWifi();
  updatePendingUpload();
  readRFID();

  yield();
  delay(20);
}
