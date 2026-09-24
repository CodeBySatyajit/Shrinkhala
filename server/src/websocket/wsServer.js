const { WebSocketServer, WebSocket } = require('ws');
const Event = require('../models/Event');
const { getDBStatus } = require('../config/db');

// In-memory state and event history
const inMemoryEvents = [];
const MAX_IN_MEMORY_EVENTS = 100;

let currentStructure = 'stack';
let currentItems = [];

// Track connected clients with metadata
const clients = new Map(); // ws => { ip, isEsp32, connectedAt }

// Server-side simulator state
let simulatorTimer = null;
let simulatorStep = 0;

/**
 * Initialize WebSocket server
 */
const initWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  console.log('[WebSocket] Server initialized and listening for connections');

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress?.replace('::ffff:', '') || '127.0.0.1';
    const isEsp32Query = req.url.includes('client=esp32') || req.headers['user-agent']?.includes('ESP32');

    clients.set(ws, {
      ip: clientIp,
      isEsp32: Boolean(isEsp32Query),
      connectedAt: new Date().toISOString()
    });

    console.log(`[WebSocket] New client connected from ${clientIp} (ESP32: ${isEsp32Query}). Total active: ${clients.size}`);

    const hasEsp32 = Array.from(clients.values()).some((c) => c.isEsp32) || simulatorTimer !== null;

    // Initial handshake
    const initMessage = JSON.stringify({
      type: 'connection_ack',
      message: 'Connected to TDS Kit Relay Server',
      currentStructure,
      currentItems,
      activeClients: clients.size,
      hasEsp32Connected: hasEsp32,
      timestamp: new Date().toISOString()
    });

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(initMessage);
    }

    // Ping-pong heartbeat
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages
    ws.on('message', async (data) => {
      let rawString = '';
      try {
        rawString = data.toString();
        const parsed = JSON.parse(rawString);

        // If client sends event from hardware, mark this socket as ESP32
        const meta = clients.get(ws);
        if (meta && !meta.isEsp32) {
          if (parsed.source === 'ESP32' || parsed.client === 'esp32' || req.url.includes('esp32')) {
            meta.isEsp32 = true;
            broadcastDeviceStatus();
          }
        }

        await handleIncomingEvent(parsed, ws);
      } catch (err) {
        console.error('[WebSocket] Error parsing or processing message:', err.message, 'Raw data:', rawString);
      }
    });

    ws.on('close', (code, reason) => {
      clients.delete(ws);
      console.log(`[WebSocket] Client disconnected (${code}). Total active: ${clients.size}`);
      broadcastDeviceStatus();
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Socket error:', err.message);
      clients.delete(ws);
    });
  });

  // Keep-alive heartbeat interval (every 25 seconds)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 25000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  return wss;
};

/**
 * Broadcast device status update to all connected clients
 */
const broadcastDeviceStatus = () => {
  const devices = getConnectedDevices();
  broadcast(JSON.stringify({
    type: 'devices_update',
    totalClients: devices.totalClients,
    esp32Clients: devices.esp32Count,
    devices: devices.list
  }));
};

/**
 * Process incoming event
 */
const handleIncomingEvent = async (event, sourceSocket = null) => {
  if (!event || !event.type) {
    return null;
  }

  const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();

  if (event.type === 'structure' && event.structure) {
    currentStructure = event.structure;
  } else if (event.structure) {
    currentStructure = event.structure;
  }

  updateCurrentItems(event);

  const normalizedEvent = {
    type: event.type,
    id: event.id !== undefined && event.id !== null ? String(event.id) : null,
    after: event.after !== undefined ? (event.after === null ? null : String(event.after)) : null,
    structure: event.structure || currentStructure,
    timestamp: timestamp
  };

  if (event.items && Array.isArray(event.items)) {
    normalizedEvent.items = event.items;
  }

  // 1. In-memory buffer
  inMemoryEvents.push({
    ...normalizedEvent,
    timestamp: timestamp.toISOString(),
    _id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  });
  if (inMemoryEvents.length > MAX_IN_MEMORY_EVENTS) {
    inMemoryEvents.shift();
  }

  // 2. Persist to MongoDB
  const dbStatus = getDBStatus();
  if (dbStatus.connected) {
    try {
      await Event.create({
        type: normalizedEvent.type,
        id: normalizedEvent.id,
        after: normalizedEvent.after,
        structure: normalizedEvent.structure,
        items: normalizedEvent.items,
        timestamp: timestamp
      });
    } catch (dbErr) {
      console.error('[MongoDB] Failed to log event to database:', dbErr.message);
    }
  }

  // 3. Re-broadcast to all connected clients (except sender if from browser)
  broadcast(JSON.stringify(normalizedEvent), sourceSocket);

  return normalizedEvent;
};

function updateCurrentItems(event) {
  if (event.type === 'snapshot' && Array.isArray(event.items)) {
    currentItems = [...event.items];
    return;
  }

  if (event.type === 'push' || event.type === 'enqueue') {
    if (event.id) {
      currentItems.push({ id: String(event.id) });
    }
  } else if (event.type === 'pop') {
    currentItems.pop();
  } else if (event.type === 'dequeue') {
    currentItems.shift();
  } else if (event.type === 'insert') {
    if (event.id) {
      const newItem = { id: String(event.id) };
      if (event.after === 'tail') {
        currentItems.push(newItem);
      } else if (!event.after || event.after === 'head') {
        currentItems.unshift(newItem);
      } else {
        const idx = currentItems.findIndex((it) => String(it.id) === String(event.after));
        if (idx !== -1) {
          currentItems.splice(idx + 1, 0, newItem);
        } else {
          currentItems.push(newItem);
        }
      }
    }
  } else if (event.type === 'remove') {
    if (event.id) {
      currentItems = currentItems.filter((it) => String(it.id) !== String(event.id));
    }
  }
}

const broadcast = (message, excludeSocket = null) => {
  for (const client of clients.keys()) {
    if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};

/**
 * Built-in server simulator stream
 */
const simulationSteps = [
  { type: 'structure', structure: 'stack' },
  { type: 'push', id: '10' },
  { type: 'push', id: '20' },
  { type: 'push', id: '30' },
  { type: 'pop' },
  { type: 'push', id: '40' },
  { type: 'structure', structure: 'queue' },
  { type: 'snapshot', structure: 'queue', items: [{ id: 'A1' }, { id: 'B2' }] },
  { type: 'enqueue', id: 'C3' },
  { type: 'dequeue' },
  { type: 'enqueue', id: 'D4' },
  { type: 'structure', structure: 'list' },
  { type: 'insert', id: 'N1', after: null },
  { type: 'insert', id: 'N2', after: 'N1' },
  { type: 'insert', id: 'MID', after: 'N1' },
  { type: 'remove', id: 'N1' }
];

const startSimulatorStream = (intervalMs = 2200) => {
  if (simulatorTimer) return;

  simulatorTimer = setInterval(async () => {
    const step = simulationSteps[simulatorStep % simulationSteps.length];
    simulatorStep++;

    await handleIncomingEvent({
      ...step,
      source: 'ESP32 (Simulated)'
    });
  }, intervalMs);

  console.log(`[Simulator] In-process ESP32 simulator started (interval: ${intervalMs}ms)`);
  broadcastDeviceStatus();
};

const stopSimulatorStream = () => {
  if (simulatorTimer) {
    clearInterval(simulatorTimer);
    simulatorTimer = null;
    console.log('[Simulator] In-process ESP32 simulator stopped');
    broadcastDeviceStatus();
  }
};

const isSimulatorActive = () => simulatorTimer !== null;

const getConnectedDevices = () => {
  const list = Array.from(clients.values());
  let esp32Count = list.filter((c) => c.isEsp32).length;
  if (simulatorTimer !== null) {
    esp32Count += 1;
  }
  return {
    totalClients: clients.size + (simulatorTimer !== null ? 1 : 0),
    esp32Count,
    list
  };
};

module.exports = {
  initWebSocket,
  handleIncomingEvent,
  broadcast,
  getInMemoryEvents: () => [...inMemoryEvents],
  resetState: () => { currentItems = []; currentStructure = 'stack'; },
  getClientCount: () => clients.size,
  getConnectedDevices,
  startSimulatorStream,
  stopSimulatorStream,
  isSimulatorActive
};
