import type { Request, Response, NextFunction } from 'express';
import { Errors } from '../lib/AppError.js';
import type { Role } from '@scb/shared';

// ─── Authorize Middleware (Factory) ──────────────────────────────────────────
// Returns middleware that checks req.user.role against the required role(s).
// Must be used AFTER the authenticate middleware.
//
// Usage:
//   authorize('ADMIN')          — only admins
//   authorize('ADMIN', 'VIEWER') — either role (effectively "any authenticated user")

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw Errors.unauthorized('Authentication required before authorization');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw Errors.forbidden(
        `Role '${req.user.role}' is not authorized for this action. Required: ${allowedRoles.join(' or ')}.`,
      );
    }

    next();
  };
}
