import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError.js';
import { logger } from '../lib/logger.js';
import { config } from '../config/env.js';

// ─── Global Error Handler ────────────────────────────────────────────────────
// Catches all errors and returns a structured JSON response.
// Must be the LAST middleware registered on the Express app.

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ─── AppError (operational, expected) ────────────────────────────────────
  if (err instanceof AppError) {
    logger.warn(
      { code: err.code, statusCode: err.statusCode },
      err.message,
    );

    const errorDetails = (err as AppError & { details?: unknown }).details;
    const responseBody: Record<string, unknown> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(errorDetails !== undefined ? { details: errorDetails } : {}),
      },
    };

    res.status(err.statusCode).json(responseBody);
    return;
  }

  // ─── PostgreSQL unique constraint violation (23505) ────────────────────
  if ((err as { code?: string }).code === '23505') {
    logger.warn({ code: 'CONFLICT' }, err.message);

    res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'A record with this unique identifier (e.g. project code or email) already exists.',
      },
    });
    return;
  }

  // ─── PostgreSQL foreign key violation (23503) ───────────────────────────
  if ((err as { code?: string }).code === '23503') {
    logger.warn({ code: 'FOREIGN_KEY_VIOLATION' }, err.message);

    res.status(400).json({
      success: false,
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced entity does not exist or is still linked to other records.',
      },
    });
    return;
  }

  // ─── PostgreSQL baseline trigger error ──────────────────────────────────
  if (
    err.message?.includes('BASELINE_IMMUTABLE') ||
    (err as { code?: string }).code === '23514' // integrity_constraint_violation
  ) {
    logger.error({ trigger: 'BASELINE_IMMUTABILITY_TRIGGER' }, err.message);

    res.status(403).json({
      success: false,
      error: {
        code: 'BASELINE_ATTEMPT',
        message: 'Baseline date modification was blocked by the database.',
      },
    });
    return;
  }

  // ─── Unknown / Programmer Error ─────────────────────────────────────────
  logger.error({ err }, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.isProd
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
}
