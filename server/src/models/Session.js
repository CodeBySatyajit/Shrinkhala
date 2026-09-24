const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: () => `Session_${new Date().toISOString().replace(/[:.]/g, '-')}`
    },
    structure: {
      type: String,
      enum: ['stack', 'queue', 'list'],
      default: 'stack'
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active'
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date,
      default: null
    },
    eventCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Session', SessionSchema);
