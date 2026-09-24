/*
 * TDS Kit Visualizer - ESP32 Firmware Example
 * 
 * Hardware: ESP32 Dev Module (WROOM / NodeMCU-32S)
 * Library required: WebSockets by Markus Sattler (install via Arduino Library Manager)
 * 
 * This sketch connects your ESP32 to your local Wi-Fi network, connects to your
 * Node.js WebSocket relay server at ws://<YOUR_COMPUTER_IP>:5000, and sends
 * JSON-formatted data structure events.
 */

#include <WiFi.h>
#include <WebSocketsClient.h>

// ---------------- WIFI CREDENTIALS ----------------
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ---------------- SERVER CONFIGURATION ----------------
// Replace with the local IPv4 address of your computer running the Node.js server!
// (Find it on Windows using: ipconfig)
const char* ws_server_ip = "192.168.1.100"; 
const int   ws_server_port = 5000;
const char* ws_path        = "/";

WebSocketsClient webSocket;
unsigned long lastEventTime = 0;
int stepCounter = 0;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected from server");
      break;
    case WStype_CONNECTED:
      Serial.printf("[WS] Connected to server: %s\n", payload);
      // Announce initial snapshot
      webSocket.sendTXT("{\"type\":\"snapshot\",\"structure\":\"stack\",\"items\":[{\"id\":\"E1\"},{\"id\":\"E2\"}]}");
      break;
    case WStype_TEXT:
      Serial.printf("[WS] Server Response: %s\n", payload);
      break;
    case WStype_BIN:
    case WStype_ERROR:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=== TDS Kit ESP32 Controller ===");
  Serial.printf("Connecting to WiFi: %s\n", ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[WiFi] Connected!");
  Serial.print("[WiFi] IP Address: ");
  Serial.println(WiFi.localIP());

  // WebSocket Server Setup
  webSocket.begin(ws_server_ip, ws_server_port, ws_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(3000); // Reconnect every 3 seconds if dropped
}

void loop() {
  webSocket.loop();

  // Periodically send sample events (every 3 seconds)
  // In real hardware, trigger these from GPIO sensors/buttons/RFID!
  if (millis() - lastEventTime > 3000) {
    lastEventTime = millis();
    stepCounter++;

    String jsonMsg = "";

    switch(stepCounter % 8) {
      case 0:
        jsonMsg = "{\"type\":\"structure\",\"structure\":\"stack\"}";
        break;
      case 1:
        jsonMsg = "{\"type\":\"push\",\"id\":\"X" + String(stepCounter) + "\"}";
        break;
      case 2:
        jsonMsg = "{\"type\":\"push\",\"id\":\"Y" + String(stepCounter) + "\"}";
        break;
      case 3:
        jsonMsg = "{\"type\":\"pop\"}";
        break;
      case 4:
        jsonMsg = "{\"type\":\"structure\",\"structure\":\"queue\"}";
        break;
      case 5:
        jsonMsg = "{\"type\":\"enqueue\",\"id\":\"Q" + String(stepCounter) + "\"}";
        break;
      case 6:
        jsonMsg = "{\"type\":\"structure\",\"structure\":\"list\"}";
        break;
      case 7:
        jsonMsg = "{\"type\":\"insert\",\"id\":\"NODE_" + String(stepCounter) + "\",\"after\":null}";
        break;
    }

    if (jsonMsg.length() > 0) {
      Serial.println("[TX -> Server] " + jsonMsg);
      webSocket.sendTXT(jsonMsg);
    }
  }
}
