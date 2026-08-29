import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { Errors } from '../lib/AppError.js';
import type { Role } from '@scb/shared';

// ─── Extend Express Request with user context ────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: Role;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  iat: number;
  exp: number;
}

// ─── Authenticate Middleware ─────────────────────────────────────────────────
// Reads JWT from the httpOnly cookie "access_token", verifies it,
// and attaches the decoded user payload to req.user.

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.access_token;

  if (!token) {
    throw Errors.unauthorized('No authentication token provided');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw Errors.unauthorized('Authentication token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw Errors.unauthorized('Invalid authentication token');
    }
    throw error;
  }
}
