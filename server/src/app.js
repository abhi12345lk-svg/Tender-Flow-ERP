import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config/env.js';
import { getDatabaseHealth } from './config/database.js';
import apiRoutes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

export const createApp = () => {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for API; frontend managed separately
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration with explicit origins and credential support
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        const isExplicitlyAllowed = config.clientUrls.includes(origin);
        const isVercelDomain = /\.vercel\.app$/i.test(new URL(origin).hostname);
        const isDev = config.env === 'development';

        if (isExplicitlyAllowed || isVercelDomain || isDev) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body Parsing & Cookies
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // Request Logging
  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate Limiting for general API routes
  app.use('/api', apiLimiter);

  // Operational Health Check Endpoint
  app.get('/api/health', (req, res) => {
    const dbHealth = getDatabaseHealth();
    const isHealthy = dbHealth.status === 'healthy';

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'TenderFlow ERP API',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.env,
      database: dbHealth,
    });
  });

  // Mount Versioned Business Routes
  app.use('/api/v1', apiRoutes);

  // 404 Route Handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'NotFound',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist on TenderFlow ERP API.`,
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
