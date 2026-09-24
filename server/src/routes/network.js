const express = require('express');
const os = require('os');
const http = require('http');
const router = express.Router();
const { 
  startSimulatorStream, 
  stopSimulatorStream, 
  isSimulatorActive, 
  getConnectedDevices 
} = require('../websocket/wsServer');

/**
 * GET /api/network/info
 * Returns local IPv4 addresses and ready-to-use WebSocket connection strings
 */
router.get('/info', (req, res) => {
  const ifaces = os.networkInterfaces();
  const ipv4List = [];

  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ipv4List.push({
          interface: name,
          address: net.address
        });
      }
    }
  }

  const port = process.env.PORT || 5000;
  const primaryIp = ipv4List.length > 0 ? ipv4List[0].address : 'localhost';

  res.json({
    success: true,
    hostname: os.hostname(),
    primaryIp,
    interfaces: ipv4List,
    serverPort: port,
    wsUrlPrimary: `ws://${primaryIp}:${port}`,
    wsUrlLocalhost: `ws://localhost:${port}`,
    connectedDevices: getConnectedDevices(),
    isSimulating: isSimulatorActive()
  });
});

/**
 * POST /api/network/probe
 * Probe an ESP32 IP address (e.g. 192.168.4.1 or local STA IP)
 */
router.post('/probe', async (req, res) => {
  const { ip, port = 80 } = req.body;
  if (!ip) {
    return res.status(400).json({ success: false, error: 'Target IP is required' });
  }

  const startTime = Date.now();
  const url = `http://${ip}:${port}/status`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const probeRes = await fetch(url, { signal: controller.signal }).catch(() => null);
    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;

    if (probeRes) {
      let data = {};
      try {
        data = await probeRes.json();
      } catch (e) {
        data = { message: 'HTTP response received' };
      }
      return res.json({
        success: true,
        reachable: true,
        latencyMs: latency,
        ip,
        data
      });
    }

    // Try basic socket probe if HTTP /status didn't answer
    return res.json({
      success: true,
      reachable: false,
      latencyMs: latency,
      ip,
      message: `No response from ESP32 at ${ip}:${port}`
    });
  } catch (err) {
    return res.json({
      success: false,
      reachable: false,
      error: err.message
    });
  }
});

/**
 * POST /api/network/simulate
 * Start or stop server-side in-process ESP32 simulation
 */
router.post('/simulate', (req, res) => {
  const { action = 'toggle', intervalMs = 2000 } = req.body;

  let active = isSimulatorActive();

  if (action === 'start' || (action === 'toggle' && !active)) {
    startSimulatorStream(intervalMs);
    active = true;
  } else if (action === 'stop' || (action === 'toggle' && active)) {
    stopSimulatorStream();
    active = false;
  }

  res.json({
    success: true,
    isSimulating: active,
    message: active ? 'ESP32 simulation stream started' : 'ESP32 simulation stream stopped'
  });
});

module.exports = router;
