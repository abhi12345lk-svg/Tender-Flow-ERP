import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;
let connectionError = null;

// Mask credentials from URI for safe logging
export const maskMongoUri = (uri) => {
  if (!uri) return 'undefined';
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  } catch {
    return '***masked-uri***';
  }
};

/**
 * Connect to MongoDB Atlas or Local MongoDB instance
 */
export const connectDatabase = async () => {
  const uri = config.mongoUri;
  const maskedUri = maskMongoUri(uri);

  try {
    console.log(`[Database] Attempting connection to MongoDB (${maskedUri})...`);

    mongoose.connection.on('connected', () => {
      isConnected = true;
      connectionError = null;
      console.log('[Database] MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      connectionError = err.message;
      console.error('[Database] MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[Database] MongoDB disconnected. Reconnection will be handled automatically.');
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Fail fast if cluster unreachable
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    connectionError = null;
    return mongoose.connection;
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.error(`[Database] Initial MongoDB connection failure: ${err.message}`);
    
    // In production, reject startup if database is unreachable
    if (config.env === 'production') {
      throw new Error(`Production startup aborted: Unable to connect to MongoDB (${err.message})`);
    }
    // In development, log clearly so developer can diagnose Atlas credentials or start local mongod
    console.warn('[Database] Operating with database connection offline or pending in development mode.');
    return null;
  }
};

/**
 * Disconnect database (used for testing and graceful shutdown)
 */
export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
};

/**
 * Health check diagnostics without exposing credentials
 */
export const getDatabaseHealth = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const readyState = mongoose.connection.readyState;
  const isHealthy = readyState === 1;

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    readyState: stateMap[readyState] || 'unknown',
    databaseName: mongoose.connection.name || null,
    host: mongoose.connection.host ? mongoose.connection.host.replace(/:.*@/, '') : null,
    port: mongoose.connection.port || null,
    lastError: connectionError,
    timestamp: new Date().toISOString(),
  };
};
