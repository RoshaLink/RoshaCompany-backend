import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Enable trust proxy for accurate client IP resolution behind load balancers and reverse proxies
app.set('trust proxy', 1);

// Hide server fingerprinting
app.disable('x-powered-by');

// Hardened security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    xContentTypeOptions: true,
    frameguard: { action: 'deny' },
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // In development, allow localhost/any dev server
      if (!config.isProduction) return callback(null, true);

      const isExplicitlyAllowed = config.allowedOrigins.includes(origin);
      const isVercelDomain = /^https:\/\/[a-zA-Z0-9-_.]+\.vercel\.app$/.test(origin);
      const isRoshaDomain = /^https:\/\/(?:[a-zA-Z0-9-]+\.)*roshalink\.com$/.test(origin);

      if (isExplicitlyAllowed || isVercelDomain || isRoshaDomain) {
        return callback(null, true);
      }

      const corsError = new Error(`Origin ${origin} not allowed by CORS policy.`);
      corsError.statusCode = 403;
      corsError.isCors = true;
      return callback(corsError);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200,
  })
);

// Request body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// HTTP Request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

// Mount central API router
app.use('/api', apiRouter);

// Catch 404
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
