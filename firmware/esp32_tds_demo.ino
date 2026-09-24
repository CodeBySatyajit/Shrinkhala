/*
 * TDS Kit Visualizer - Comprehensive ESP32 Dual-Mode Firmware
 * 
 * Features:
 * 1. Station Mode (connects to your Wi-Fi router)
 * 2. SoftAP Fallback Mode (creates 'ESP32-TDS-KIT' hotspot at 192.168.4.1 if Wi-Fi router is unreachable)
 * 3. Built-in HTTP REST Server on port 80 for browser probing (/status)
 * 4. WebSocket Client streaming JSON events to Node.js backend
 * 5. Full compliance with the fixed JSON Data Structure protocol:
 *    - {"type":"structure","structure":"stack"|"queue"|"list"}
 *    - {"type":"push","id":"A1"} / {"type":"pop"}
 *    - {"type":"enqueue","id":"B2"} / {"type":"dequeue"}
 *    - {"type":"insert","id":"C3","after":"B2"} / {"type":"remove","id":"C3"}
 *    - {"type":"snapshot","structure":"queue","items":[{"id":"A1"},{"id":"B2"}]}
 * 
 * Hardware: ESP32 (WROOM, NodeMCU-32S, ESP32-S3)
 * Libraries: 
 *   - WebSockets by Markus Sattler (Install via Arduino Library Manager)
 *   - WiFi (built-in ESP32 core)
 *   - WebServer (built-in ESP32 core)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsClient.h>

// ---------------- 1. WI-FI CONFIGURATION ----------------
const char* wifi_ssid     = "YOUR_WIFI_SSID";
const char* wifi_password = "YOUR_WIFI_PASSWORD";

// SoftAP Hotspot settings (ESP32 acts as its own Wi-Fi router)
const char* ap_ssid       = "ESP32-TDS-KIT";
const char* ap_password   = "12345678"; // 8 chars minimum

// ---------------- 2. SERVER CONFIGURATION ----------------
// Your computer's local IP running the Node.js server (e.g. 192.168.1.X or 10.20.11.X)
// Check the "Connect ESP32 Wi-Fi" modal in the web app for your auto-detected IP!
const char* ws_server_ip   = "10.20.11.206"; 
const int   ws_server_port = 5000;
const char* ws_path        = "/?client=esp32";

// Objects
WebSocketsClient webSocket;
WebServer httpServer(80);

unsigned long lastEventTime = 0;
int eventStep = 0;
bool isWsConnected = false;

// ---------------- HTTP SERVER HANDLERS ----------------
void handleStatus() {
  httpServer.sendHeader("Access-Control-Allow-Origin", "*");
  String json = "{";
  json += "\"status\":\"online\",";
  json += "\"device\":\"ESP32-TDS-KIT\",";
  json += "\"ip\":\"" + (WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "\",";
  json += "\"uptime_ms\":" + String(millis()) + ",";
  json += "\"ws_connected\":" + String(isWsConnected ? "true" : "false");
  json += "}";
  httpServer.send(200, "application/json", json);
}

void handleRoot() {
  httpServer.sendHeader("Access-Control-Allow-Origin", "*");
  String html = "<html><body style='font-family:sans-serif;padding:2rem;background:#0f172a;color:#fff;'>";
  html += "<h2>📡 ESP32 TDS Kit Hardware Controller</h2>";
  html += "<p>Device IP: " + (WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "</p>";
  html += "<p>Relay Status: " + String(isWsConnected ? "<span style='color:#4ade80;'>Connected to Server</span>" : "<span style='color:#f87171;'>Connecting...</span>") + "</p>";
  html += "</body></html>";
  httpServer.send(200, "text/html", html);
}

// ---------------- WEBSOCKET CLIENT HANDLERS ----------------
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected from server relay");
      isWsConnected = false;
      break;
    case WStype_CONNECTED:
      Serial.printf("[WS] Connected to relay at %s:%d%s\n", ws_server_ip, ws_server_port, ws_path);
      isWsConnected = true;
      // Send initial hello snapshot
      webSocket.sendTXT("{\"type\":\"snapshot\",\"structure\":\"stack\",\"items\":[{\"id\":\"HW1\"},{\"id\":\"HW2\"}]}");
      break;
    case WStype_TEXT:
      Serial.printf("[WS RX] %s\n", payload);
      break;
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==============================================");
  Serial.println("  TDS Kit Visualizer - ESP32 Controller  ");
  Serial.println("==============================================");

  // Attempt Wi-Fi Station connection
  WiFi.mode(WIFI_AP_STA);
  Serial.printf("[WiFi] Connecting to %s...\n", wifi_ssid);
  WiFi.begin(wifi_ssid, wifi_password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Station Mode Connected!");
    Serial.print("[WiFi] Assigned Local IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Could not join router. Enabling SoftAP Hotspot...");
  }

  // Start SoftAP Hotspot as backup/direct connection
  WiFi.softAP(ap_ssid, ap_password);
  Serial.print("[SoftAP] Hotspot active: ");
  Serial.println(ap_ssid);
  Serial.print("[SoftAP] Gateway IP: ");
  Serial.println(WiFi.softAPIP());

  // Setup HTTP Web Server
  httpServer.on("/status", HTTP_GET, handleStatus);
  httpServer.on("/", HTTP_GET, handleRoot);
  httpServer.enableCORS(true);
  httpServer.begin();
  Serial.println("[HTTP] Web probe server started on port 80");

  // Setup WebSocket Client
  Serial.printf("[WebSocket] Connecting to ws://%s:%d%s\n", ws_server_ip, ws_server_port, ws_path);
  webSocket.begin(ws_server_ip, ws_server_port, ws_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(2500);
}

void loop() {
  httpServer.handleClient();
  webSocket.loop();

  // Periodically send sample data structure events every 3 seconds
  // Connect GPIO buttons or RFID reader to trigger these dynamically!
  if (isWsConnected && (millis() - lastEventTime > 3000)) {
    lastEventTime = millis();
    eventStep++;

    String msg = "";
    switch (eventStep % 7) {
      case 0:
        msg = "{\"type\":\"structure\",\"structure\":\"stack\"}";
        break;
      case 1:
        msg = "{\"type\":\"push\",\"id\":\"E" + String(eventStep) + "\"}";
        break;
      case 2:
        msg = "{\"type\":\"push\",\"id\":\"E" + String(eventStep + 1) + "\"}";
        break;
      case 3:
        msg = "{\"type\":\"pop\"}";
        break;
      case 4:
        msg = "{\"type\":\"structure\",\"structure\":\"queue\"}";
        break;
      case 5:
        msg = "{\"type\":\"enqueue\",\"id\":\"Q" + String(eventStep) + "\"}";
        break;
      case 6:
        msg = "{\"type\":\"dequeue\"}";
        break;
    }

    if (msg.length() > 0) {
      Serial.println("[WS TX -> Server] " + msg);
      webSocket.sendTXT(msg);
    }
  }
}
