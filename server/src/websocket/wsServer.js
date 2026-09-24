const { WebSocketServer, WebSocket } = require('ws');
const Event = require('../models/Event');
const { getDBStatus } = require('../config/db');

// In-memory state and event history (acts as fast cache & fallback if DB is offline)
const inMemoryEvents = [];
const MAX_IN_MEMORY_EVENTS = 100;

let currentStructure = 'stack';
let currentItems = [];

// Track connected clients
const clients = new Set();

/**
 * Initialize WebSocket server attached to HTTP server or standalone
 */
const initWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  console.log('[WebSocket] Server initialized and listening for connections');

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    const url = req.url;
    clients.add(ws);

    console.log(`[WebSocket] New client connected from ${clientIp} (path: ${url}). Total active clients: ${clients.size}`);

    // Send initial handshake state to newly connected client
    const initMessage = JSON.stringify({
      type: 'connection_ack',
      message: 'Connected to TDS Kit Relay Server',
      currentStructure,
      currentItems,
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

    // Handle incoming messages (from ESP32, browser clients, or simulation script)
    ws.on('message', async (data) => {
      let rawString = '';
      try {
        rawString = data.toString();
        const parsed = JSON.parse(rawString);

        await handleIncomingEvent(parsed, ws);
      } catch (err) {
        console.error('[WebSocket] Error parsing or processing message:', err.message, 'Raw data:', rawString);
      }
    });

    ws.on('close', (code, reason) => {
      clients.delete(ws);
      console.log(`[WebSocket] Client disconnected (${code} - ${reason || 'No reason'}). Total active: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Socket error:', err.message);
      clients.delete(ws);
    });
  });

  // Keep-alive heartbeat interval (every 30 seconds)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('[WebSocket] Terminating inactive client connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  return wss;
};

/**
 * Process incoming event from ESP32 or client
 */
const handleIncomingEvent = async (event, sourceSocket = null) => {
  if (!event || !event.type) {
    console.warn('[WebSocket] Received event without type:', event);
    return null;
  }

  const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();

  // Update current structure mode if specified
  if (event.type === 'structure' && event.structure) {
    currentStructure = event.structure;
  } else if (event.structure) {
    currentStructure = event.structure;
  }

  // Update state tracking
  updateCurrentItems(event);

  // Normalize event object matching MongoDB schema
  const normalizedEvent = {
    type: event.type,
    id: event.id !== undefined ? String(event.id) : null,
    after: event.after !== undefined ? (event.after === null ? null : String(event.after)) : null,
    structure: event.structure || currentStructure,
    timestamp: timestamp
  };

  if (event.items && Array.isArray(event.items)) {
    normalizedEvent.items = event.items;
  }

  // 1. Log to in-memory history
  inMemoryEvents.push({
    ...normalizedEvent,
    timestamp: timestamp.toISOString(),
    _id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  });
  if (inMemoryEvents.length > MAX_IN_MEMORY_EVENTS) {
    inMemoryEvents.shift();
  }

  // 2. Persist to MongoDB (if connected)
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

  // 3. Re-broadcast event to all connected clients
  const payloadToBroadcast = JSON.stringify(normalizedEvent);
  broadcast(payloadToBroadcast);

  console.log(`[Relay -> Broadcast] Event '${normalizedEvent.type}' (${normalizedEvent.structure}) id:${normalizedEvent.id || 'N/A'}`);
  return normalizedEvent;
};

/**
 * Update in-memory data structure items according to the event
 */
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
      if (!event.after) {
        // Insert at head
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

/**
 * Broadcast string message to all connected clients
 */
const broadcast = (message) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

/**
 * Retrieve in-memory events
 */
const getInMemoryEvents = () => [...inMemoryEvents];

const resetState = () => {
  currentItems = [];
  currentStructure = 'stack';
};

module.exports = {
  initWebSocket,
  handleIncomingEvent,
  broadcast,
  getInMemoryEvents,
  resetState,
  getClientCount: () => clients.size
};
