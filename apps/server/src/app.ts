import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import {
  corsMiddleware,
  helmetMiddleware,
  rateLimiterMiddleware,
  errorHandler,
} from './middleware/index.js';

// ─── Domain Routes ───────────────────────────────────────────────────────────
import { authRoutes } from './modules/auth/auth.routes.js';
import { projectRoutes } from './modules/projects/projects.routes.js';
import {
  milestoneProjectRoutes,
  milestoneDirectRoutes,
} from './modules/milestones/milestones.routes.js';
import {
  procurementProjectRoutes,
  procurementDirectRoutes,
} from './modules/procurement/procurement.routes.js';
import { contractorRoutes } from './modules/contractors/contractors.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';

// ─── Express Application Assembly ───────────────────────────────────────────
// Middleware chain (strict order per spec):
//   cors → helmet → rateLimiter → (cookieParser/compression) → routes
//   Per-route: authenticate → authorize('ADMIN') → validate(schema) → controller

const app = express();

// ─── Step 1: Global Middleware (Strict Order) ────────────────────────────────
app.use(corsMiddleware);       // 1. CORS
app.use(helmetMiddleware);     // 2. Helmet (security headers)
app.use(rateLimiterMiddleware); // 3. Rate limiter
app.use(compression());        // Response compression
app.use(express.json({ limit: '1mb' })); // Body parser
app.use(cookieParser());       // Cookie parser (for JWT httpOnly cookies)

// ─── Step 2: Health Check (unauthenticated) ──────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// ─── Step 3: Domain Routes ───────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/projects/:projectId/milestones', milestoneProjectRoutes);
app.use('/api/v1/milestones', milestoneDirectRoutes);
app.use('/api/v1/projects/:projectId/procurement', procurementProjectRoutes);
app.use('/api/v1/procurement', procurementDirectRoutes);
app.use('/api/v1/contractors', contractorRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/audit', auditRoutes);

// ─── Step 4: 404 Handler ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
  });
});

// ─── Step 5: Global Error Handler (MUST be last) ─────────────────────────────
app.use(errorHandler);

export { app };
