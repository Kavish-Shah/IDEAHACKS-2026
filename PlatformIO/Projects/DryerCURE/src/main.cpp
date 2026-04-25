#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==========================================
// 🛠️ CONFIGURATION ZONE (UPDATED PINS)
// ==========================================

// 1. Hardware Pins
const int PIN_I2C_SDA = 8;     
const int PIN_I2C_SCL = 9;     
const int PIN_ACCEL_X = 4;     // X-Axis
const int PIN_ACCEL_Y = 5;     // Y-Axis
const int PIN_ACCEL_Z = 6;     // Z-Axis
const int PIN_SPEAKER = 18;    // PWM pin for LM386 Audio Amp

// 2. Network & Backend
const char* WIFI_SSID = "YOUR_WIFI"; // likely will be hotspot from phone
const char* WIFI_PASS = "YOUR_PASS";
const char* SUPABASE_URL = "https://wkkszmswnevtfybmagab.supabase.co";
const char* SUPABASE_ANON_KEY = "sb_publishable_M9yPge4oGqda-2tK5-XYwQ_R3G-gj3h";

// 3. Logic & Timing
const int TEMP_HUM_INTERVAL = 20000; // 20 seconds
const int ACCEL_INTERVAL = 30000;    // 30 seconds
const int MOVEMENT_THRESHOLD = 150;  // Adjust if it triggers early/late

// ==========================================
// 🧠 GLOBAL VARIABLES
// ==========================================

Adafruit_AHTX0 aht;
unsigned long lastTempHumTime = 0;
unsigned long lastAccelTime = 0;

// Track previous accelerometer readings to calculate "Delta" (change)
int lastX = 0;
int lastY = 0;
int lastZ = 0;

// ==========================================
// 🔊 AUDIO "MESSAGES" (PWM TONES)
// ==========================================

void playMessage(int messageID) {
  // Setup PWM for speaker
  ledcSetup(0, 2000, 8); 
  ledcAttachPin(PIN_SPEAKER, 0);

  if (messageID == 1) {
    // Message 1: "System Active / Startup" (Two quick high beeps)
    Serial.println("Audio: Playing Message 1 (Startup)");
    ledcWriteTone(0, 1046); delay(150); ledcWriteTone(0, 0); delay(50);
    ledcWriteTone(0, 1318); delay(150); ledcWriteTone(0, 0);
  } 
  else if (messageID == 2) {
    // Message 2: "Measurement Update" (Short low blip)
    Serial.println("Audio: Playing Message 2 (Update)");
    ledcWriteTone(0, 880); delay(100); ledcWriteTone(0, 0);
  } 
  else if (messageID == 3) {
    // Message 3: "CYCLE DONE / No Movement" (Long alarm sequence)
    Serial.println("Audio: Playing Message 3 (Done Alarm)");
    for (int i = 0; i < 3; i++) {
      ledcWriteTone(0, 2000); delay(400); 
      ledcWriteTone(0, 0); delay(200);
    }
  }
}

// ==========================================
// 🔌 HELPER FUNCTIONS
// ==========================================

void connectWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
}

void updateSupabase(float temp, float humidity, int movement, String statusMsg) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  HTTPClient http;
  http.begin(SUPABASE_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

  JsonDocument doc;
  doc["temperature_c"] = temp;
  doc["humidity_rh"] = humidity;
  doc["movement_score"] = movement;
  doc["status"] = statusMsg;
  
  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);
  if (httpResponseCode > 0) {
    Serial.printf("Supabase POST Success. Status: %s\n", statusMsg.c_str());
  } else {
    Serial.printf("Supabase POST Failed: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

// ==========================================
// 🚀 MAIN SETUP & LOOP
// ==========================================

void setup() {
  Serial.begin(115200);

  // Init I2C and AHT20
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  if (!aht.begin(&Wire)) {
    Serial.println("Could not find AHT20! Check wiring.");
  }

  // Seed the initial accelerometer values
  lastX = analogRead(PIN_ACCEL_X);
  lastY = analogRead(PIN_ACCEL_Y);
  lastZ = analogRead(PIN_ACCEL_Z);

  connectWiFi();
  
  // Play startup message
  playMessage(1); 
  Serial.println("System Running. Timers started.");
}

void loop() {
  unsigned long currentMillis = millis();

  // ---------------------------------------------------------
  // TIMER 1: Every 20 Seconds (Temperature & Humidity)
  // ---------------------------------------------------------
  if (currentMillis - lastTempHumTime >= TEMP_HUM_INTERVAL) {
    lastTempHumTime = currentMillis;

    sensors_event_t humidityEvent, tempEvent;
    aht.getEvent(&humidityEvent, &tempEvent);
    
    float currentHum = humidityEvent.relative_humidity;
    float currentTemp = tempEvent.temperature;

    Serial.printf("--> 20s Timer: Temp: %.2fC | Hum: %.2f%%\n", currentTemp, currentHum);
    
    playMessage(2);
    updateSupabase(currentTemp, currentHum, -1, "Logging Environment"); 
  }

  // ---------------------------------------------------------
  // TIMER 2: Every 30 Seconds (Accelerometer & Completion Check)
  // ---------------------------------------------------------
  if (currentMillis - lastAccelTime >= ACCEL_INTERVAL) {
    lastAccelTime = currentMillis;

    // Read the current analog pins
    int curX = analogRead(PIN_ACCEL_X);
    int curY = analogRead(PIN_ACCEL_Y);
    int curZ = analogRead(PIN_ACCEL_Z);

    // Calculate total change across all 3 axes since the last reading
    int deltaX = abs(curX - lastX);
    int deltaY = abs(curY - lastY);
    int deltaZ = abs(curZ - lastZ);
    int movementScore = deltaX + deltaY + deltaZ;

    // Save current readings for the next comparison
    lastX = curX;
    lastY = curY;
    lastZ = curZ;

    Serial.printf("--> 30s Timer: Movement Score: %d\n", movementScore);

    // If the change is very small, the dryer is no longer tumbling
    if (movementScore < MOVEMENT_THRESHOLD) {
      Serial.println("NO MOVEMENT DETECTED. Triggering completion.");
      
      playMessage(3);
      updateSupabase(-1, -1, movementScore, "CYCLE COMPLETE"); 
    } else {
      updateSupabase(-1, -1, movementScore, "Tumbling");
    }
  }
}