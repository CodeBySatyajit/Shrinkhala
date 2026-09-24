const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tds_kit';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 4000
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${mongoURI}`);
    console.warn(`[MongoDB Warning] Error: ${error.message}`);
    console.warn(`[MongoDB Warning] The WebSocket relay and in-memory cache will continue working without persistence.`);
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[MongoDB] Disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('[MongoDB] Reconnected successfully.');
  });
};

const getDBStatus = () => ({
  connected: isConnected,
  readyState: mongoose.connection.readyState,
  uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tds_kit'
});

module.exports = { connectDB, getDBStatus };
