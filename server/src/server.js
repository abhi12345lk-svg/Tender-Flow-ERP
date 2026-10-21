import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase, maskMongoUri } from './config/database.js';
import { createApp } from './app.js';
import { seedDatabase } from './utils/seed.js';

const startServer = async () => {
  try {
    console.log(`[TenderFlow ERP] Starting Server in ${config.env} mode...`);

    // Connect to MongoDB
    const connection = await connectDatabase();

    // Auto-seed initial admin and demo data if connected
    if (connection) {
      try {
        await seedDatabase();
      } catch (seedErr) {
        console.warn('[Seed] Notice: Could not complete automatic seeding:', seedErr.message);
      }
    }

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`[TenderFlow ERP Server] Listening on port ${config.port}`);
      console.log(`[TenderFlow ERP Server] API Root: http://localhost:${config.port}/api/v1`);
      console.log(`[TenderFlow ERP Server] Health Endpoint: http://localhost:${config.port}/api/health`);
      console.log(`[TenderFlow ERP Server] Allowed Client Origins: ${config.clientUrls.join(', ')}`);
    });

    // Graceful Shutdown Handlers
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Closing server gracefully...`);
      server.close(async () => {
        console.log('[Server] HTTP connections closed.');
        await disconnectDatabase();
        console.log('[Database] MongoDB connection closed.');
        process.exit(0);
      });

      // Force exit after 10s if hanging
      setTimeout(() => {
        console.error('[Server] Forcing shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    return { app, server };
  } catch (err) {
    console.error('[Fatal Error] Failed to launch TenderFlow ERP Server:', err);
    process.exit(1);
  }
};

startServer();
// Server entrypoint ready
