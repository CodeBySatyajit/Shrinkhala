const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { handleIncomingEvent, getInMemoryEvents } = require('../websocket/wsServer');
const { getDBStatus } = require('../config/db');

/**
 * GET /api/events?limit=50&structure=stack
 * Fetch event history from MongoDB or in-memory fallback
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const filter = {};
    if (req.query.structure) {
      filter.structure = req.query.structure;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const dbStatus = getDBStatus();
    if (dbStatus.connected) {
      const events = await Event.find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return res.json({
        success: true,
        source: 'mongodb',
        count: events.length,
        events
      });
    }

    // Fallback to in-memory events if DB is not connected
    let memEvents = getInMemoryEvents();
    if (req.query.structure) {
      memEvents = memEvents.filter((e) => e.structure === req.query.structure);
    }
    if (req.query.type) {
      memEvents = memEvents.filter((e) => e.type === req.query.type);
    }
    const sliced = memEvents.slice(-limit).reverse();

    return res.json({
      success: true,
      source: 'in-memory-fallback',
      warning: 'MongoDB is currently disconnected; serving from in-memory cache',
      count: sliced.length,
      events: sliced
    });
  } catch (error) {
    console.error('[API] Error fetching events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/events
 * Post a new event via HTTP (acts identically to ESP32 sending via WebSocket)
 */
router.post('/', async (req, res) => {
  try {
    const { type, id, after, structure, items } = req.body;
    if (!type) {
      return res.status(400).json({ success: false, error: "Missing required 'type' field" });
    }

    const processedEvent = await handleIncomingEvent({
      type,
      id,
      after,
      structure,
      items
    });

    res.status(201).json({
      success: true,
      message: 'Event processed and broadcasted',
      event: processedEvent
    });
  } catch (error) {
    console.error('[API] Error creating event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/events
 * Clear all logged events
 */
router.delete('/', async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    let deletedCount = 0;

    if (dbStatus.connected) {
      const result = await Event.deleteMany({});
      deletedCount = result.deletedCount;
    }

    res.json({
      success: true,
      message: 'Events cleared',
      deletedCount
    });
  } catch (error) {
    console.error('[API] Error clearing events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
