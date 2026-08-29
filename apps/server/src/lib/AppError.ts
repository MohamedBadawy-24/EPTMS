// ─── Application Error ───────────────────────────────────────────────────────
// Custom error class for structured, operational error handling.
// All known business errors should use this class.

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);

    // Capture stack trace, excluding the constructor from it
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Common Error Factories ──────────────────────────────────────────────────
export const Errors = {
  notFound: (entity: string, id?: string) =>
    new AppError(404, 'NOT_FOUND', `${entity}${id ? ` with id ${id}` : ''} not found`),

  unauthorized: (message = 'Authentication required') =>
    new AppError(401, 'UNAUTHORIZED', message),

  forbidden: (message = 'Insufficient permissions') =>
    new AppError(403, 'FORBIDDEN', message),

  badRequest: (message: string) =>
    new AppError(400, 'BAD_REQUEST', message),

  conflict: (message: string) =>
    new AppError(409, 'CONFLICT', message),

  validation: (message: string, details?: unknown) => {
    const err = new AppError(422, 'VALIDATION_ERROR', message);
    (err as AppError & { details?: unknown }).details = details;
    return err;
  },

  baselineAttempt: (milestoneId: string) =>
    new AppError(
      403,
      'BASELINE_ATTEMPT',
      `Baseline date cannot be modified for milestone ${milestoneId}. This attempt has been logged.`,
    ),

  rateLimited: () =>
    new AppError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.'),
} as const;
