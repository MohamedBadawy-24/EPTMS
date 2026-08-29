import type { Request, Response, NextFunction } from 'express';

// ─── Async Handler ───────────────────────────────────────────────────────────
// Wraps async route handlers to catch rejected promises and forward them to
// Express's error-handling middleware, avoiding unhandled promise rejections.

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response>;

export function asyncHandler(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
