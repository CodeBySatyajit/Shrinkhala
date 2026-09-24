const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const Event = require('../models/Event');
const { getDBStatus } = require('../config/db');

/**
 * GET /api/sessions
 * List recorded sessions
 */
router.get('/', async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    if (!dbStatus.connected) {
      return res.json({ success: true, sessions: [], note: 'MongoDB is offline' });
    }

    const sessions = await Session.find().sort({ startTime: -1 }).limit(20).lean();
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sessions/start
 * Begin a new recorded session
 */
router.post('/start', async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    if (!dbStatus.connected) {
      return res.json({
        success: true,
        session: { _id: `mem_sess_${Date.now()}`, name: req.body.name || 'Local Session', status: 'active' }
      });
    }

    const session = await Session.create({
      name: req.body.name || `Session_${new Date().toISOString().replace(/[:.]/g, '-')}`,
      structure: req.body.structure || 'stack',
      startTime: new Date()
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sessions/:id/end
 * End an active session
 */
router.post('/:id/end', async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    if (!dbStatus.connected) {
      return res.json({ success: true, message: 'Session ended' });
    }

    const eventCount = await Event.countDocuments({ sessionId: req.params.id });
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      {
        endTime: new Date(),
        status: 'completed',
        eventCount
      },
      { new: true }
    );

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
