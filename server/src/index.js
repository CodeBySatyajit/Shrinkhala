require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { connectDB, getDBStatus } = require('./config/db');
const { initWebSocket, getClientCount, getConnectedDevices } = require('./websocket/wsServer');
const eventsRouter = require('./routes/events');
const sessionsRouter = require('./routes/sessions');
const networkRouter = require('./routes/network');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// REST Routes
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/network', networkRouter);

// Health & System status check
app.get('/api/status', (req, res) => {
  const dbStatus = getDBStatus();
  const devices = getConnectedDevices();
  res.json({
    status: 'online',
    appName: 'TDS Kit Visualizer Relay Server',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    websocketClientsConnected: getClientCount(),
    devices,
    mongodb: {
      connected: dbStatus.connected,
      uri: dbStatus.uri
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root welcome
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>TDS Kit Visualizer Server</title></head>
      <body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc;">
        <h1>📡 TDS Kit Visualizer Relay Server</h1>
        <p>Backend is running actively on port <strong>${PORT}</strong>.</p>
        <ul>
          <li><strong>WebSocket URL:</strong> <code>ws://localhost:${PORT}</code></li>
          <li><strong>Network / ESP32 Info:</strong> <a href="/api/network/info" style="color: #38bdf8;">/api/network/info</a></li>
          <li><strong>REST Events API:</strong> <a href="/api/events?limit=20" style="color: #38bdf8;">/api/events?limit=20</a></li>
          <li><strong>Status API:</strong> <a href="/api/status" style="color: #38bdf8;">/api/status</a></li>
        </ul>
      </body>
    </html>
  `);
});

// Create HTTP server and mount WebSocket
const server = http.createServer(app);
initWebSocket(server);

// Start server and connect to MongoDB
server.listen(PORT, async () => {
  console.log('====================================================');
  console.log(`🚀 TDS Kit Visualizer Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP API endpoint:  http://localhost:${PORT}/api/events`);
  console.log('====================================================');

  await connectDB();
});

process.on('SIGINT', () => {
  console.log('\nShutting down server gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
