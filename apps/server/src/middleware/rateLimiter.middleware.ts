import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

// ─── Rate Limiter Middleware ─────────────────────────────────────────────────
// Limits requests per IP to prevent abuse and brute-force attacks.
// Defaults: 100 requests per 15 minutes.

export const rateLimiterMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: 'draft-7', // RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  },
});
