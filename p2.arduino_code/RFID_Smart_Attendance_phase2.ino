#include <WiFi.h>
#include <HTTPClient.h>

#include <SPI.h>
#include <MFRC522.h>

#include <Wire.h>
#include <LiquidCrystal_I2C.h>


// ============================================================
// WIFI SETTINGS
// ============================================================

const char* WIFI_SSID = "KESHAVPRAVEEN 1579";
const char* WIFI_PASSWORD = "KE$#@V311007";

// IP address of the laptop running Flask
const char* LAPTOP_IP = "192.168.137.1";

const int SERVER_PORT = 5000;


// ============================================================
// PIN CONFIGURATION
// ============================================================

// RC522
#define SS_PIN       5
#define RST_PIN      27

// Buzzer
#define BUZZER_PIN   13

// LCD
// SDA = GPIO21
// SCL = GPIO22


// ============================================================
// DEVICES
// ============================================================

MFRC522 mfrc522(
  SS_PIN,
  RST_PIN
);

LiquidCrystal_I2C lcd(
  0x27,
  16,
  2
);


// ============================================================
// WIFI CONNECTION
// ============================================================

void connectWiFi() {

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");

  Serial.println();
  Serial.println("Connecting to WiFi...");

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


  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("WiFi connected!");

    Serial.print("ESP32 IP: ");
    Serial.println(
      WiFi.localIP()
    );


    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected");

    lcd.setCursor(0, 1);

    // Show last part of IP
    lcd.print(
      WiFi.localIP()
    );

    delay(2000);
  }


  // ----------------------------------------------------------
  // FAILURE
  // ----------------------------------------------------------

  else {

    Serial.println(
      "WiFi connection FAILED"
    );

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("WiFi FAILED");

    lcd.setCursor(0, 1);
    lcd.print("Check Settings");

    delay(2000);
  }
}


// ============================================================
// SEND RFID CARD TO PYTHON
// ============================================================

String sendCardToPython(
  String cardID
) {

  // ----------------------------------------------------------
  // Check Wi-Fi
  // ----------------------------------------------------------

  if (
    WiFi.status() != WL_CONNECTED
  ) {

    Serial.println(
      "WiFi disconnected."
    );

    connectWiFi();

    if (
      WiFi.status() != WL_CONNECTED
    ) {

      return "FAIL_UNKNOWN";
    }
  }


  // ----------------------------------------------------------
  // Build Flask URL
  // ----------------------------------------------------------

  String url =
    "http://" +
    String(LAPTOP_IP) +
    ":" +
    String(SERVER_PORT) +
    "/rfid";


  Serial.print(
    "Sending request to: "
  );

  Serial.println(url);


  // ----------------------------------------------------------
  // Start HTTP
  // ----------------------------------------------------------

  HTTPClient http;

  http.begin(url);

  http.addHeader(
    "Content-Type",
    "application/json"
  );


  // ----------------------------------------------------------
  // JSON DATA
  // ----------------------------------------------------------

  String json =
    "{\"card_id\":\"" +
    cardID +
    "\"}";


  Serial.print(
    "Sending JSON: "
  );

  Serial.println(json);


  // ----------------------------------------------------------
  // POST REQUEST
  // ----------------------------------------------------------

  int httpCode =
    http.POST(json);


  Serial.print(
    "HTTP Response Code: "
  );

  Serial.println(
    httpCode
  );


  String response = "";


  // ----------------------------------------------------------
  // SERVER RESPONSE
  // ----------------------------------------------------------

  if (
    httpCode > 0
  ) {

    response =
      http.getString();

    response.trim();


    Serial.print(
      "Server Response: "
    );

    Serial.println(
      response
    );
  }


  // ----------------------------------------------------------
  // HTTP ERROR
  // ----------------------------------------------------------

  else {

    Serial.print(
      "HTTP Error: "
    );

    Serial.println(
      http.errorToString(
        httpCode
      )
    );

    response =
      "FAIL_UNKNOWN";
  }


  http.end();


  return response;
}


// ============================================================
// BUZZER - SHORT BEEP
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
// BUZZER - SUCCESS
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
// BUZZER - REGISTRATION
// ============================================================

void beepRegistration() {

  beepShort();

  delay(100);

  beepShort();
}


// ============================================================
// BUZZER - DENIED
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


// ============================================================
// SHOW SERVER RESULT
// ============================================================

void showResult(
  String result
) {

  result.trim();


  // ==========================================================
  // ATTENDANCE SUCCESS
  // ==========================================================

  if (
    result == "SUCCESS_MATCH"
  ) {

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("ACCESS GRANTED");

    lcd.setCursor(0, 1);
    lcd.print("Attendance OK");


    beepSuccess();

    delay(2500);
  }


  // ==========================================================
  // REGISTRATION SUCCESS
  // ==========================================================

  else if (
    result == "SUCCESS_REG"
  ) {

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("CARD REGISTERED");

    lcd.setCursor(0, 1);
    lcd.print("Saved");


    beepRegistration();

    delay(2500);
  }


  // ==========================================================
  // CARD ALREADY EXISTS
  // ==========================================================

  else if (
    result == "ALREADY_EXISTS"
  ) {

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("ALREADY");

    lcd.setCursor(0, 1);
    lcd.print("REGISTERED");


    beepDenied();

    delay(2000);
  }


  // ==========================================================
  // UNKNOWN / FAILED
  // ==========================================================

  else {

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("ACCESS DENIED");

    lcd.setCursor(0, 1);
    lcd.print("AUTH FAILED");


    beepDenied();

    delay(2000);
  }
}


// ============================================================
// SHOW READY SCREEN
// ============================================================

void showReadyScreen() {

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("SMART ATTENDANCE");

  lcd.setCursor(0, 1);
  lcd.print("Scan ID Card...");
}


// ============================================================
// SETUP
// ============================================================

void setup() {

  // ----------------------------------------------------------
  // Serial is ONLY for debugging now.
  // Python does NOT use COM9 anymore.
  // ----------------------------------------------------------

  Serial.begin(
    115200
  );


  // ----------------------------------------------------------
  // Buzzer
  // ----------------------------------------------------------

  pinMode(
    BUZZER_PIN,
    OUTPUT
  );

  digitalWrite(
    BUZZER_PIN,
    LOW
  );


  // ----------------------------------------------------------
  // LCD
  // ----------------------------------------------------------

  Wire.begin(
    21,
    22
  );

  lcd.init();

  lcd.backlight();

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("SMART ATTENDANCE");

  delay(1500);


  // ----------------------------------------------------------
  // SPI / RFID
  // ----------------------------------------------------------

  SPI.begin();

  mfrc522.PCD_Init();


  Serial.println(
    "RC522 initialized."
  );


  // ----------------------------------------------------------
  // Wi-Fi
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
  // Make sure Wi-Fi is connected
  // ----------------------------------------------------------

  if (
    WiFi.status() != WL_CONNECTED
  ) {

    connectWiFi();

    delay(500);
  }


  // ----------------------------------------------------------
  // Check for RFID card
  // ----------------------------------------------------------

  if (
    !mfrc522.PICC_IsNewCardPresent()
  ) {

    delay(50);

    return;
  }


  if (
    !mfrc522.PICC_ReadCardSerial()
  ) {

    delay(50);

    return;
  }


  // ----------------------------------------------------------
  // BUILD RFID UID
  // ----------------------------------------------------------

  String cardID = "";


  for (
    byte i = 0;
    i < mfrc522.uid.size;
    i++
  ) {

    if (
      mfrc522.uid.uidByte[i] < 0x10
    ) {

      cardID += "0";
    }


    cardID += String(
      mfrc522.uid.uidByte[i],
      HEX
    );
  }


  cardID.toUpperCase();


  // ----------------------------------------------------------
  // SERIAL DEBUG
  // ----------------------------------------------------------

  Serial.print(
    "RFID Card Detected: "
  );

  Serial.println(
    cardID
  );


  // ----------------------------------------------------------
  // CARD DETECTED BEEP
  // ----------------------------------------------------------

  beepShort();


  // ----------------------------------------------------------
  // LCD - SHOW CARD
  // ----------------------------------------------------------

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Card Detected");

  lcd.setCursor(0, 1);
  lcd.print(cardID);

  delay(800);


  // ----------------------------------------------------------
  // LCD - CONTACT LAPTOP
  // ----------------------------------------------------------

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Contacting");

  lcd.setCursor(0, 1);
  lcd.print("Laptop...");


  // ----------------------------------------------------------
  // SEND RFID THROUGH WIFI
  // ----------------------------------------------------------

  String result =
    sendCardToPython(
      cardID
    );


  // ----------------------------------------------------------
  // SHOW RESULT
  // ----------------------------------------------------------

  showResult(
    result
  );


  // ----------------------------------------------------------
  // STOP RFID COMMUNICATION
  // ----------------------------------------------------------

  mfrc522.PICC_HaltA();

  mfrc522.PCD_StopCrypto1();


  // ----------------------------------------------------------
  // RETURN TO READY
  // ----------------------------------------------------------

  showReadyScreen();


  delay(500);
}