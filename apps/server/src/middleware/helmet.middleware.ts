import helmet from 'helmet';

// ─── Helmet Middleware ───────────────────────────────────────────────────────
// Sets security-related HTTP headers.
// Configured for an API-only server (no inline scripts/styles needed).

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true,
});
