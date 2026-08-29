import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// ─── Validate Middleware (Factory) ───────────────────────────────────────────
// Validates req.body, req.query, or req.params against a Zod schema.
// Returns 422 with structured Zod error details on failure.
//
// Usage:
//   validate(createProjectSchema)                    — validates body (default)
//   validate(projectQuerySchema, 'query')            — validates query params
//   validate(idParamSchema, 'params')                — validates URL params

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);

      // Replace the raw input with the parsed (and coerced) values
      // In Express 5, req.query is a getter property, so we use Object.defineProperty
      Object.defineProperty(req, target, {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        _res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: formattedErrors,
          },
        });
        return;
      }

      next(error);
    }
  };
}
