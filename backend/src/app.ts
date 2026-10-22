import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // allows modern frontend dev and media streaming
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: (_origin, callback) => {
      // Reflect origin for credentialed requests across domains
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'Pragma'
    ],
    exposedHeaders: ['Set-Cookie', 'Authorization'],
    maxAge: 86400
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // generous rate limit
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

// Health check endpoints
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'healthy',
    app: 'CozyNest API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);
app.get('/', healthHandler);

// Mount primary API routers: both /api/v1 and root / for resilience
app.use('/api/v1', apiRouter);
app.use('/', apiRouter);

// Central error handler
app.use(errorHandler);

export default app;
