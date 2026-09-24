const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      enum: ['snapshot', 'push', 'pop', 'enqueue', 'dequeue', 'insert', 'remove', 'structure']
    },
    id: {
      type: String,
      default: null,
      trim: true
    },
    after: {
      type: String,
      default: null,
      trim: true
    },
    structure: {
      type: String,
      default: 'stack',
      trim: true
    },
    items: {
      type: Array,
      default: undefined
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for fast chronological queries
EventSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Event', EventSchema);
