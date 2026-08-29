import cors from 'cors';
import { config } from '../config/env.js';

// ─── CORS Middleware ─────────────────────────────────────────────────────────
// Restricts cross-origin requests to the configured frontend origin.
// credentials: true enables httpOnly cookie transmission.

export const corsMiddleware = cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // Pre-flight cache: 24 hours
});
