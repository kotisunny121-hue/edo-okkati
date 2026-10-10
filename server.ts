import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './server/config/db.js';
import { seedDatabase } from './server/seed.js';

import authRouter from './server/routes/auth.js';
import resourceRouter from './server/routes/resources.js';
import requestRouter from './server/routes/requests.js';
import orgRouter from './server/routes/organizations.js';
import volunteerRouter from './server/routes/volunteers.js';
import notificationRouter from './server/routes/notifications.js';
import adminRouter from './server/routes/admin.js';
import superAdminRouter from './server/routes/superAdmin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow Leaflet tiles and CDN resources
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many login or registration attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint (Liveness & Readiness)
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount versioned REST API routes
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/resources', resourceRouter);
app.use('/api/v1/requests', requestRouter);
app.use('/api/v1/organizations', orgRouter);
app.use('/api/v1/volunteers', volunteerRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/super-admin', superAdminRouter);

// Centralized error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: isProd ? 'Internal server error' : err.message,
  });
});

async function startServer() {
  try {
    // 1. Connect to Database (Atlas or embedded MongoMemoryServer)
    await connectDB();

    // 2. Seed initial realistic emergency data and multi-role accounts
    await seedDatabase();

    // 3. Setup Frontend Serving (Vite middleware in dev, dist in production)
    if (!isProd) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }

    // 4. Listen on PORT 3000
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(` Emergency Resource Sharing System Server Active`);
      console.log(` Port: ${PORT} | Mode: ${isProd ? 'Production' : 'Development'}`);
      console.log(` API Base: http://0.0.0.0:${PORT}/api/v1`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
