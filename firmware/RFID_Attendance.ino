#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

//-------------------- WiFi --------------------//

const char* ssid = "Orbit";
const char* password = "";

//---------------- Google Script ----------------//

String GOOGLE_SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbyzd-WAp3ibXVf9ogW0hfwq__X44W6CcVFCs62uJxs0LYSVSsAU9wf5SYdays9B8rBp/exec";

//---------------- RC522 Pins ----------------//

#define SS_PIN 5
#define RST_PIN 27

MFRC522 rfid(SS_PIN, RST_PIN);

//---------------- LCD ----------------//

LiquidCrystal_I2C lcd(0x27,16,2);

//---------------- Buzzer ----------------//

#define BUZZER 4

//---------------- Student / Tag Database ----------------//
// UID -> Name mapping as provided:
// 01020304 = Blue
// 11223344 = Green
// 55667788 = Yellow
// AABBCCDD = Red
// 04112233 = NFC
// C0FFEE99 = Key fob

struct Student
{
  String uid;
  String name;
  String regno;
  String dept;
};

Student students[] =
{
  {"01020304","Sivadhinesh","2025105001","ECE-I"},
  {"11223344","Ritheshwaran","2025105002","ECE-I"},
  {"55667788","Altaf hussain","2025105003","ECE-J"},
  {"AABBCCDD","Chandru","2025105004","ECE-J"},
  {"04112233","Akash","2025105005","ECE-I"},
  {"C0FFEE99","Chinmaiyi","2025105006","ECE-J"}
};

int totalStudents =
sizeof(students)/sizeof(students[0]);

//---------------- Functions ----------------//

void beep(int duration)
{
  digitalWrite(BUZZER,HIGH);
  delay(duration);
  digitalWrite(BUZZER,LOW);
}

String getUID()
{
  String uid="";

  for(byte i=0;i<rfid.uid.size;i++)
  {
    if(rfid.uid.uidByte[i]<0x10)
      uid+="0";

    uid+=String(rfid.uid.uidByte[i],HEX);
  }

  uid.toUpperCase();

  return uid;
}

int findStudent(String uid)
{
  for(int i=0;i<totalStudents;i++)
  {
    if(uid==students[i].uid)
      return i;
  }

  return -1;
}

//---------------- Setup ----------------//

void setup()
{
  Serial.begin(115200);

  pinMode(BUZZER,OUTPUT);
  digitalWrite(BUZZER,LOW);

  lcd.init();
  lcd.backlight();

  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("RFID Attendance");

  lcd.setCursor(0,1);
  lcd.print("Connecting...");

  WiFi.begin(ssid,password);

  while(WiFi.status()!=WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected");

  lcd.clear();
  lcd.print("WiFi Connected");

  SPI.begin();

  rfid.PCD_Init();

  delay(2000);

  lcd.clear();
  lcd.print("Scan RFID Card");

  beep(150);
}

//-----------------------------------------------------
// Send Attendance to Google Sheets
//-----------------------------------------------------

void sendAttendance(Student s)
{
  if (WiFi.status() != WL_CONNECTED)
  {
    lcd.clear();
    lcd.print("WiFi Error");
    return;
  }

  String url = GOOGLE_SCRIPT_URL;

  url += "?name=" + s.name;
  url += "&regno=" + s.regno;
  url += "&uid=" + s.uid;
  url += "&dept=" + s.dept;
  url += "&status=Present";

  url.replace(" ", "%20");

  Serial.println(url);

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;

  http.begin(client, url);

  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

  int httpCode = http.GET();

  Serial.print("HTTP Code : ");
  Serial.println(httpCode);

  if (httpCode > 0)
  {
    String payload = http.getString();

    Serial.println(payload);

    lcd.clear();

    if (payload.indexOf("Attendance Recorded") != -1)
    {
      lcd.print("Attendance");
      lcd.setCursor(0,1);
      lcd.print("Recorded");
      beep(150);
    }
    else if (payload.indexOf("Already Marked") != -1)
    {
      lcd.print("Already");
      lcd.setCursor(0,1);
      lcd.print("Marked");
      beep(100);
      delay(100);
      beep(100);
    }
    else
    {
      lcd.print("Server Reply");
      Serial.println(payload);
    }
  }
  else
  {
    Serial.print("HTTP Error : ");
    Serial.println(http.errorToString(httpCode));

    lcd.clear();
    lcd.print("HTTP Failed");
    lcd.setCursor(0,1);
    lcd.print(httpCode);

    beep(500);
  }

  http.end();

  delay(2000);

  lcd.clear();
  lcd.print("Scan RFID Card");
}

//-----------------------------------------------------
// Read RFID Card
//-----------------------------------------------------

void readRFID()
{
    if(!rfid.PICC_IsNewCardPresent())
        return;

    if(!rfid.PICC_ReadCardSerial())
        return;

    String uid=getUID();

    Serial.print("UID : ");
    Serial.println(uid);

    int student=findStudent(uid);

    if(student==-1)
    {
        lcd.clear();

        lcd.print("Invalid Card");

        lcd.setCursor(0,1);

        lcd.print(uid);

        beep(700);

        delay(2000);

        lcd.clear();

        lcd.print("Scan RFID Card");

        rfid.PICC_HaltA();

        return;
    }

    lcd.clear();

    lcd.print("Welcome");

    lcd.setCursor(0,1);

    lcd.print(students[student].name);

    delay(1000);

    sendAttendance(students[student]);

    rfid.PICC_HaltA();
}

//-----------------------------------------------------
// Loop
//-----------------------------------------------------

void loop()
{
  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED)
  {
    lcd.clear();
    lcd.print("Reconnecting");

    WiFi.disconnect();
    WiFi.begin(ssid, password);

    unsigned long startTime = millis();

    while (WiFi.status() != WL_CONNECTED &&
           millis() - startTime < 10000)
    {
      delay(500);
      Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED)
    {
      Serial.println("\nWiFi Reconnected");

      lcd.clear();
      lcd.print("WiFi OK");

      beep(100);

      delay(1000);

      lcd.clear();
      lcd.print("Scan RFID Card");
    }
    else
    {
      Serial.println("\nWiFi Failed");

      lcd.clear();
      lcd.print("WiFi Failed");

      delay(2000);

      return;
    }
  }

  readRFID();

  delay(100);
}
