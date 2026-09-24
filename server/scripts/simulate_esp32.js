/**
 * ESP32 Hardware Simulator for TDS Kit Visualizer
 * Connects as a WebSocket client to ws://localhost:5000 and sends realistic JSON events
 */
const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'ws://localhost:5000';
console.log(`[ESP32 Simulator] Connecting to ${WS_URL}...`);

const ws = new WebSocket(WS_URL);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const eventsSequence = [
  // 1. Initial Stack demonstration
  { type: 'structure', structure: 'stack' },
  { type: 'push', id: '10' },
  { type: 'push', id: '20' },
  { type: 'push', id: '30' },
  { type: 'pop' },
  { type: 'push', id: '40' },
  { type: 'push', id: '50' },
  { type: 'pop' },

  // 2. Switch to Queue demonstration
  { type: 'structure', structure: 'queue' },
  { type: 'snapshot', structure: 'queue', items: [{ id: 'Q1' }, { id: 'Q2' }] },
  { type: 'enqueue', id: 'Q3' },
  { type: 'enqueue', id: 'Q4' },
  { type: 'dequeue' },
  { type: 'enqueue', id: 'Q5' },
  { type: 'dequeue' },

  // 3. Switch to Linked List demonstration
  { type: 'structure', structure: 'list' },
  { type: 'snapshot', structure: 'list', items: [{ id: 'HEAD' }, { id: 'NODE_1' }] },
  { type: 'insert', id: 'NODE_2', after: 'NODE_1' },
  { type: 'insert', id: 'INTER', after: 'HEAD' },
  { type: 'remove', id: 'NODE_1' },
  { type: 'insert', id: 'TAIL_NODE', after: 'NODE_2' }
];

ws.on('open', async () => {
  console.log('[ESP32 Simulator] Connected to server successfully!');
  console.log('[ESP32 Simulator] Beginning automated event transmission loop...');

  let index = 0;
  while (ws.readyState === WebSocket.OPEN) {
    const event = eventsSequence[index % eventsSequence.length];
    const payload = JSON.stringify(event);
    
    console.log(`[ESP32 Simulator TX] -> ${payload}`);
    ws.send(payload);

    index++;
    // Wait 2.2 seconds between events for pleasant visualization
    await delay(2200);
  }
});

ws.on('message', (msg) => {
  try {
    const data = JSON.parse(msg.toString());
    if (data.type === 'connection_ack') {
      console.log('[ESP32 Simulator RX] Received server ACK:', data.message);
    }
  } catch (e) {
    // Ignore other echoes
  }
});

ws.on('error', (err) => {
  console.error('[ESP32 Simulator Error]:', err.message);
});

ws.on('close', () => {
  console.log('[ESP32 Simulator] Disconnected from server.');
  process.exit(0);
});
