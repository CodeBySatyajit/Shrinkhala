# 📡 TDS Kit Visualizer

A full-stack **MERN** web application that provides real-time visualization of classical data structures (**Stack, Queue, Linked List**) driven by live events sent from an **ESP32 microcontroller** over WebSockets.

---

## 🌟 Key Features

1. **Hardware-Driven Real-Time Visualization**:
   - **Stack**: Vertical layout with active `TOP ⬆` pointer highlight, smooth push/pop transitions.
   - **Queue**: Horizontal layout with distinct `FRONT (dequeue)` and `BACK / REAR (enqueue)` markers.
   - **Linked List**: Dynamic node chain with `HEAD` pointer, directional arrows (`Data | Next ➜`), and `NULL` terminator.
2. **Node.js + Express WebSocket Relay Server**:
   - The ESP32 connects directly as a WebSocket client (`ws://<SERVER_IP>:5000`) and streams raw JSON events.
   - The server ingests each event, logs it to **MongoDB**, and broadcasts it instantaneously to all connected browser clients.
3. **MongoDB Event Logging & Persistence**:
   - Logs incoming events to the `events` collection (`{ type, id, after, structure, timestamp }`).
   - Supports in-memory caching fallback if MongoDB is temporarily offline, ensuring zero disruption during local testing.
   - REST API `GET /api/events?limit=50` to query past events and filter by structure.
4. **Local Demo Mode**:
   - Client-side interactive controls to push, pop, enqueue, dequeue, insert, and remove elements.
   - Built-in automated scenarios and snapshot testing.
   - Toggle to simulate locally or relay through the live server.
5. **Raw Event Log Stream**:
   - Displays real-time raw JSON packets with syntax tags and auto-scroll (most recent at bottom).
6. **ESP32 Firmware Ready**:
   - Includes Arduino C++ firmware sketch (`firmware/esp32_tds_demo.ino`) and a Node.js simulator (`npm run simulate`).

---

## 🏗️ Project Architecture

```
TDS Kit (Tango)
├── /server                 # Node.js + Express + WebSocket + Mongoose
│   ├── src/
│   │   ├── config/db.js    # MongoDB connection & status
│   │   ├── models/         # Event & Session Mongoose schemas
│   │   ├── routes/         # Express REST APIs (/api/events, /api/sessions)
│   │   ├── websocket/      # WebSocket Server (Relay & Broadcast)
│   │   └── index.js        # Main server entry point
│   ├── scripts/            # ESP32 hardware simulator script
│   └── .env.example        # Environment variable template
├── /client                 # React (Vite) + Tailwind CSS
│   ├── src/
│   │   ├── components/     # Visualizers (Stack, Queue, List), Log Panel, Controls
│   │   ├── hooks/          # useWebSocket, useDataStructure
│   │   ├── App.jsx
│   │   └── main.jsx
├── /firmware               # Arduino C++ sketch for ESP32
│   └── esp32_tds_demo.ino
├── package.json            # Root scripts (run both via concurrently)
└── README.md
```

---

## ⚡ Fixed JSON Event Protocol

The backend and frontend strictly follow the ESP32 hardware JSON event format:

| Event Type | JSON Payload | Description |
| :--- | :--- | :--- |
| **Structure Switch** | `{"type":"structure","structure":"stack"\|"queue"\|"list"}` | Changes active data structure mode |
| **Stack Push** | `{"type":"push","id":"A1"}` | Pushes item `A1` to top of stack |
| **Stack Pop** | `{"type":"pop"}` | Pops item from top of stack |
| **Queue Enqueue** | `{"type":"enqueue","id":"B2"}` | Enqueues item `B2` to rear of queue |
| **Queue Dequeue** | `{"type":"dequeue"}` | Dequeues item from front of queue |
| **List Insert** | `{"type":"insert","id":"C3","after":"B2"}` | Inserts `C3` after `B2` (or `after: null` for HEAD) |
| **List Remove** | `{"type":"remove","id":"C3"}` | Removes node `C3` and links adjacent pointers |
| **Snapshot** | `{"type":"snapshot","structure":"queue","items":[{"id":"A1"},{"id":"B2"}]}` | Overwrites state with given items |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or newer recommended, tested on v22)
- **MongoDB** (optional for local memory testing, or local `mongod` / MongoDB Atlas URI)

### 2. Installation
Open a terminal in the root project folder:

```bash
# Install root, server, and client dependencies in one command
npm run install:all
```

Or install separately:
```bash
# Root
npm install

# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 3. Configure Server Environment
Inspect or copy `server/.env.example` to `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/tds_kit
CLIENT_URL=http://localhost:5173
```
*(Note: If MongoDB is not running locally, the server will output a friendly warning and automatically run with in-memory caching!)*

### 4. Running the Application
From the root directory:
```bash
# Starts both Backend (Port 5000) and Frontend (Port 5173) concurrently
npm run dev
```

- **Frontend Visualizer**: Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Backend Relay & REST API**: [http://localhost:5000](http://localhost:5000)
- **WebSocket Endpoint**: `ws://localhost:5000`

---

## 🧪 Testing Without Physical Hardware

You can verify the entire hardware relay loop using the included **ESP32 Simulator**:

```bash
# In a separate terminal tab:
npm run simulate
```

This simulator connects to `ws://localhost:5000` as a WebSocket client and transmits realistic sequence events, automatically demonstrating Stack, Queue, and Linked List operations in real time!

---

## 🔌 Connecting Real ESP32 Hardware

1. Open `firmware/esp32_tds_demo.ino` in Arduino IDE or PlatformIO.
2. In Arduino IDE, install the **WebSockets** library by *Markus Sattler* via the Library Manager.
3. Edit your Wi-Fi credentials in the sketch:
   ```cpp
   const char* ssid     = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
4. Set the IP address to your computer's local IP (find it using `ipconfig` on Windows or `ifconfig` on macOS/Linux):
   ```cpp
   const char* ws_server_ip = "192.168.1.100"; // Example PC local IP
   const int   ws_server_port = 5000;
   ```
5. Flash the sketch to your ESP32. As soon as it boots and joins your Wi-Fi, it will connect to the relay server and drive the live UI!

---

## 📡 REST API Reference

| Method | Endpoint | Query / Body Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | `?limit=50&structure=stack` | Retrieve recent events from MongoDB |
| `POST` | `/api/events` | `{ "type": "push", "id": "X1" }` | Ingest and broadcast an event via HTTP |
| `DELETE` | `/api/events` | None | Clear logged events |
| `GET` | `/api/status` | None | Check relay uptime and connected WS clients |
| `GET` | `/api/health` | None | Server health ping |
