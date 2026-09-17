/*
 * ============================================================
 * RFID SMART ATTENDANCE SYSTEM
 * ESP32 + RC522 + LCD + Buzzer
 * ============================================================
 *
 * Architecture:
 *
 *   RFID Card
 *       |
 *       v
 *     ESP32
 *       |
 *       | POST /rfid
 *       v
 * Python Flask Gateway :5001
 *       |
 *       +--> RFID validation
 *       |
 *       +--> Camera + DeepFace
 *       |
 *       +--> Express /attendance/mark
 *                    |
 *                    v
 *                  MySQL
 *
 * ESP32 DOES NOT directly call /attendance/mark.
 *
 * ============================================================
 *
 * Required Arduino libraries:
 *   - MFRC522
 *   - LiquidCrystal_I2C
 *   - ArduinoJson
 *
 * Hardware:
 *   RC522 SS  = GPIO 5
 *   RC522 RST = GPIO 27
 *
 *   LCD SDA = GPIO 21
 *   LCD SCL = GPIO 22
 *
 *   Buzzer = GPIO 13
 *
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ============================================================
// WIFI CONFIGURATION
// ============================================================
#include "secrets.h"

// ============================================================
// CONFIGURATION: TIMEOUTS & INTERVALS
// ============================================================

const unsigned long PYTHON_TIMEOUT_MS = 30000;
const unsigned long HEARTBEAT_INTERVAL_MS = 60000;
const unsigned long DUPLICATE_SWIPE_COOLDOWN_MS = 3000;

// IMPORTANT:
// Replace this with your LAPTOP'S CURRENT IPv4 address.
//
// Example:
// http://192.168.137.1:5001
//
// The Python Flask gateway must run on port 5001.
const char* PYTHON_BASE = "http://192.168.137.1:5001";

// ============================================================
// DEVICE CONFIGURATION
// ============================================================

// This MUST match the device registered in your backend.
const char* DEVICE_CODE = "ESP32-ECE-01";

// IMPORTANT:
// Put the NEW rotated device API key here.
// Do not commit the real key to GitHub.

const char* FIRMWARE_VERSION = "1.0.0";

// ============================================================
// PIN CONFIGURATION
// ============================================================

// RC522
#define SS_PIN 5
#define RST_PIN 27

// Buzzer
#define BUZZER_PIN 13

// LCD
#define LCD_SDA 21
#define LCD_SCL 22

// ============================================================
// HARDWARE OBJECTS
// ============================================================

MFRC522 rfid(SS_PIN, RST_PIN);

LiquidCrystal_I2C lcd(0x27, 16, 2);

// ============================================================
// STATE
// ============================================================

unsigned long lastHeartbeat = 0;

String lastCardId = "";

unsigned long lastCardTime = 0;

// ============================================================
// FUNCTION PROTOTYPES
// ============================================================

void connectWiFi();

void sendHeartbeat();

void handleCardSwipe(const String& cardId);

void sendRFIDToPython(const String& cardId);

String uidToString(byte* buffer, byte size);

void showReadyScreen();

void beepShort();

void beepSuccess();

void beepDenied();

void showMessage(
  const String& line1,
  const String& line2,
  unsigned long delayMs
);

// ============================================================
// SETUP
// ============================================================

void setup() {

  Serial.begin(115200);

  delay(500);

  Serial.println();
  Serial.println("==========================================");
  Serial.println(" SMART RFID ATTENDANCE SYSTEM");
  Serial.println(" ESP32 TERMINAL");
  Serial.println("==========================================");
   Serial.println("================================");
Serial.println("RFID READY");
Serial.println("Waiting for card...");
Serial.println("================================");
  // ----------------------------------------------------------
  // BUZZER
  // ----------------------------------------------------------

  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);

  // ----------------------------------------------------------
  // LCD
  // ----------------------------------------------------------

  Wire.begin(LCD_SDA, LCD_SCL);

  lcd.init();

  lcd.backlight();

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("SMART ATTENDANCE");

  lcd.setCursor(0, 1);
  lcd.print("Initializing...");

  delay(1500);

  // ----------------------------------------------------------
  // RC522
  // ----------------------------------------------------------

 SPI.begin(18, 19, 23, 5);
rfid.PCD_Init();
showReadyScreen();
delay(100);

Serial.println("RC522 initialized.");

  delay(100);

  Serial.println("RC522 initialized.");

  // ----------------------------------------------------------
  // WIFI
  // ----------------------------------------------------------

  connectWiFi();

  // ----------------------------------------------------------
  // READY
  // ----------------------------------------------------------

  showReadyScreen();
}

// ============================================================
// MAIN LOOP
// ============================================================

void loop() {

  // ----------------------------------------------------------
  // WIFI
  // ----------------------------------------------------------

  if (WiFi.status() != WL_CONNECTED) {

    connectWiFi();

  }

  // ----------------------------------------------------------
  // HEARTBEAT
  // ----------------------------------------------------------

  /*if (
    WiFi.status() == WL_CONNECTED &&
    millis() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS
  ) {

    sendHeartbeat();

    lastHeartbeat = millis();
  }
*/
  // ----------------------------------------------------------
  // RFID
  // ----------------------------------------------------------

  if (!rfid.PICC_IsNewCardPresent()) {

    delay(50);

    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {

    delay(50);

    return;
  }

  // ----------------------------------------------------------
  // GET RFID UID
  // ----------------------------------------------------------

  String cardId = uidToString(
    rfid.uid.uidByte,
    rfid.uid.size
  );

  Serial.println();
  Serial.println("==========================================");
  Serial.println("RFID CARD DETECTED");
  Serial.println("CARD ID: " + cardId);
  Serial.println("==========================================");

  // ----------------------------------------------------------
  // STOP RFID COMMUNICATION
  // ----------------------------------------------------------

  rfid.PICC_HaltA();

  rfid.PCD_StopCrypto1();

  // ----------------------------------------------------------
  // DUPLICATE SWIPE PROTECTION
  // ----------------------------------------------------------

  if (
    cardId == lastCardId &&
    millis() - lastCardTime <
      DUPLICATE_SWIPE_COOLDOWN_MS
  ) {

    Serial.println(
      "Duplicate swipe ignored."
    );

    return;
  }

  lastCardId = cardId;

  lastCardTime = millis();

  // ----------------------------------------------------------
  // CARD DETECTED FEEDBACK
  // ----------------------------------------------------------

  beepShort();

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Card Detected");

  lcd.setCursor(0, 1);
  lcd.print(cardId);

  delay(1000);

  // ----------------------------------------------------------
  // PROCESS CARD
  // ----------------------------------------------------------

  handleCardSwipe(cardId);
}

// ============================================================
// WIFI CONNECTION
// ============================================================

void connectWiFi() {

  if (WiFi.status() == WL_CONNECTED) {

    return;
  }

  Serial.println();
  Serial.println("Connecting to WiFi...");

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");

  WiFi.mode(WIFI_STA);

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );

  int attempts = 0;

  while (
    WiFi.status() != WL_CONNECTED &&
    attempts < 30
  ) {

    delay(500);

    Serial.print(".");

    attempts++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println(
      "WiFi connected!"
    );

    Serial.print(
      "ESP32 IP: "
    );

    Serial.println(
      WiFi.localIP()
    );

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected");

    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());

    delay(2000);

  } else {

    Serial.println(
      "WiFi connection FAILED."
    );

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("WiFi FAILED");

    lcd.setCursor(0, 1);
    lcd.print("Check Network");

    delay(2000);
  }
}

// ============================================================
// CARD HANDLING
// ============================================================

void handleCardSwipe(
  const String& cardId
) {

  // ----------------------------------------------------------
  // FACE AUTHENTICATION REQUIRES PYTHON SERVER
  // ----------------------------------------------------------

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println();
    Serial.println(
      "WiFi unavailable."
    );

    Serial.println(
      "Attendance NOT marked."
    );

    Serial.println(
      "Face authentication requires"
    );

    Serial.println(
      "the Python gateway."
    );

    showMessage(
      "WiFi Required",
      "Try Again",
      2000
    );

    showReadyScreen();

    return;
  }

  // ----------------------------------------------------------
  // SEND RFID TO PYTHON
  // ----------------------------------------------------------

  showMessage(
    "RFID Verified?",
    "Starting Face...",
    1000
  );

  sendRFIDToPython(cardId);
}

// ============================================================
// SEND RFID TO PYTHON FLASK
// ============================================================

void sendRFIDToPython(
  const String& cardId
) {

  HTTPClient http;

  String url =
    String(PYTHON_BASE) +
    "/rfid";

  Serial.println();
  Serial.println(
    "Sending RFID to Python..."
  );

  Serial.println(
    "URL: " + url
  );

  // ----------------------------------------------------------
  // START HTTP
  // ----------------------------------------------------------

  http.begin(url);

  http.setTimeout(
    PYTHON_TIMEOUT_MS
  );

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  // ----------------------------------------------------------
  // JSON
  // Python endpoint expects:
  //
  // {
  //   "card_id": "89706"
  // }
  // ----------------------------------------------------------

  StaticJsonDocument<128> doc;

  doc["card_id"] = cardId;

  String body;

  serializeJson(
    doc,
    body
  );

  Serial.println(
    "Request: " + body
  );

  // ----------------------------------------------------------
  // POST
  // ----------------------------------------------------------

  int httpCode =
    http.POST(body);

  String response =
    http.getString();

  http.end();

  // ----------------------------------------------------------
  // RESULT
  // ----------------------------------------------------------

  Serial.println();
  Serial.println(
    "Python HTTP: "
    + String(httpCode)
  );

  Serial.println(
    "Python response: "
    + response
  );

  lcd.clear();

  // ----------------------------------------------------------
  // CONNECTION ERROR
  // ----------------------------------------------------------

  if (httpCode <= 0) {

    Serial.println();
    Serial.println(
      "PYTHON SERVER CONNECTION FAILED"
    );

    lcd.setCursor(0, 0);
    lcd.print("Server Error");

    lcd.setCursor(0, 1);
    lcd.print("Check Python");

    beepDenied();

    delay(2000);

    showReadyScreen();

    return;
  }

  // ----------------------------------------------------------
  // SUCCESS
  //
  // Python returns:
  //
  // SUCCESS_MATCH
  //
  // after:
  // RFID verified
  // +
  // Face verified
  // +
  // Backend attendance marked
  // ----------------------------------------------------------

  response.trim();

  if (
    response == "SUCCESS_MATCH"
  ) {

    Serial.println();
    Serial.println(
      "=========================================="
    );

    Serial.println(
      "RFID VERIFIED"
    );

    Serial.println(
      "FACE VERIFIED"
    );

    Serial.println(
      "ACCESS GRANTED"
    );

    Serial.println(
      "ATTENDANCE MARKED"
    );

    Serial.println(
      "=========================================="
    );

    lcd.setCursor(0, 0);
    lcd.print("ACCESS GRANTED");

    lcd.setCursor(0, 1);
    lcd.print("Attendance OK");

    beepSuccess();

    delay(2500);

    showReadyScreen();

    return;
  }

  // ----------------------------------------------------------
  // ALREADY MARKED
  // ----------------------------------------------------------

  if (
    response == "ALREADY_EXISTS"
  ) {

    Serial.println(
      "Attendance already marked."
    );

    lcd.setCursor(0, 0);
    lcd.print("ALREADY MARKED");

    lcd.setCursor(0, 1);
    lcd.print("Attendance");

    beepDenied();

    delay(2000);

    showReadyScreen();

    return;
  }

  // ----------------------------------------------------------
  // INVALID CARD
  // ----------------------------------------------------------

  if (
    response == "INVALID_CARD"
  ) {

    Serial.println(
      "Invalid or inactive RFID."
    );

    lcd.setCursor(0, 0);
    lcd.print("INVALID RFID");

    lcd.setCursor(0, 1);
    lcd.print("Access Denied");

    beepDenied();

    delay(2000);

    showReadyScreen();

    return;
  }

  // ----------------------------------------------------------
  // NO SESSION
  // ----------------------------------------------------------

  if (
    response == "NO_SESSION"
  ) {

    Serial.println(
      "No open attendance session."
    );

    lcd.setCursor(0, 0);
    lcd.print("NO SESSION");

    lcd.setCursor(0, 1);
    lcd.print("Contact Admin");

    beepDenied();

    delay(2000);

    showReadyScreen();

    return;
  }

  // ----------------------------------------------------------
  // FACE VERIFICATION FAILED
  //
  // Python currently returns a generic failure string
  // for failed face authentication.
  // ----------------------------------------------------------

  Serial.println();
  Serial.println(
    "RFID / FACE VERIFICATION FAILED"
  );

  lcd.setCursor(0, 0);
  lcd.print("ACCESS DENIED");

  lcd.setCursor(0, 1);
  lcd.print("Face Failed");

  beepDenied();

  delay(2500);

  showReadyScreen();
}

// ============================================================
// HEARTBEAT
// ============================================================

void sendHeartbeat() {

  if (
    WiFi.status() != WL_CONNECTED
  ) {

    return;
  }

  HTTPClient http;

  String url =
    String(PYTHON_BASE);

  // Python gateway does not need to relay heartbeat.
  // Heartbeat belongs directly to Express.
  //
  // Therefore use port 5000 backend directly here.
  //
  // Convert:
  // http://IP:5001
  // into:
  // http://IP:5000/api/v1/devices/heartbeat

  String backendUrl =
    url;

  backendUrl.replace(
    ":5001",
    ":5000"
  );

  backendUrl +=
    "/api/v1/devices/heartbeat";

  Serial.println();
  Serial.println(
    "Sending heartbeat..."
  );

  Serial.println(
    backendUrl
  );

  http.begin(
    backendUrl
  );

  http.setTimeout(5000);

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  http.addHeader(
    "X-Device-Code",
    DEVICE_CODE
  );

  http.addHeader(
    "X-Device-API-Key",
    DEVICE_API_KEY
  );

  StaticJsonDocument<128> doc;

  doc["firmwareVersion"] =
    FIRMWARE_VERSION;

  String body;

  serializeJson(
    doc,
    body
  );

  int statusCode =
    http.POST(body);

  String response =
    http.getString();

  Serial.print(
    "Heartbeat HTTP: "
  );

  Serial.println(
    statusCode
  );

  Serial.println(
    "Heartbeat response: "
    + response
  );

  http.end();
}

// ============================================================
// RFID UID → STRING
// ============================================================

String uidToString(
  byte* buffer,
  byte size
) {

  String result = "";

  for (
    byte i = 0;
    i < size;
    i++
  ) {

    if (
      buffer[i] < 0x10
    ) {

      result += "0";
    }

    result += String(
      buffer[i],
      HEX
    );
  }

  result.toUpperCase();

  return result;
}

// ============================================================
// LCD READY SCREEN
// ============================================================

void showReadyScreen() {

  lcd.clear();

  lcd.setCursor(0, 0);

  lcd.print(
    "SMART ATTENDANCE"
  );

  lcd.setCursor(0, 1);

  if (
    WiFi.status() ==
    WL_CONNECTED
  ) {

    lcd.print(
      "Scan ID Card..."
    );

  } else {

    lcd.print(
      "WiFi Offline"
    );
  }
}

// ============================================================
// LCD MESSAGE
// ============================================================

void showMessage(
  const String& line1,
  const String& line2,
  unsigned long delayMs
) {

  lcd.clear();

  lcd.setCursor(0, 0);

  lcd.print(
    line1.substring(0, 16)
  );

  lcd.setCursor(0, 1);

  lcd.print(
    line2.substring(0, 16)
  );

  delay(delayMs);
}

// ============================================================
// BUZZER
// ============================================================

void beepShort() {

  digitalWrite(
    BUZZER_PIN,
    HIGH
  );

  delay(100);

  digitalWrite(
    BUZZER_PIN,
    LOW
  );
}

// ============================================================

void beepSuccess() {

  digitalWrite(
    BUZZER_PIN,
    HIGH
  );

  delay(200);

  digitalWrite(
    BUZZER_PIN,
    LOW
  );
}

// ============================================================

void beepDenied() {

  digitalWrite(
    BUZZER_PIN,
    HIGH
  );

  delay(500);

  digitalWrite(
    BUZZER_PIN,
    LOW
  );
}