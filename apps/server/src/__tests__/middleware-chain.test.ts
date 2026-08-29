import { describe, it, expect, vi } from 'vitest';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { authorize } from '../middleware/authorize.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { errorHandler } from '../middleware/errorHandler.middleware.js';
import { AppError } from '../lib/AppError.js';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

describe('Strict Middleware Chain Unit & Integration Tests', () => {
  describe('authenticate Middleware', () => {
    it('throws 401 UNAUTHORIZED when no access_token cookie is present', () => {
      const req: any = { cookies: {} };
      const res: any = {};
      const next = vi.fn();

      expect(() => authenticate(req, res, next)).toThrowError(AppError);
      try {
        authenticate(req, res, next);
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('UNAUTHORIZED');
      }
      expect(next).not.toHaveBeenCalled();
    });

    it('attaches req.user and calls next() when valid JWT cookie is provided', () => {
      const userPayload = {
        id: 'user-123',
        email: 'admin@scb.com',
        name: 'Admin User',
        role: 'ADMIN' as const,
      };

      const token = jwt.sign(userPayload, config.jwt.secret);
      const req: any = { cookies: { access_token: token } };
      const res: any = {};
      const next = vi.fn();

      authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user-123');
      expect(req.user.role).toBe('ADMIN');
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('authorize Middleware', () => {
    it('allows request when user has the required ADMIN role', () => {
      const req: any = {
        user: { id: 'user-1', email: 'admin@scb.com', role: 'ADMIN' },
      };
      const res: any = {};
      const next = vi.fn();

      const middleware = authorize('ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('throws 403 FORBIDDEN when VIEWER attempts to access ADMIN endpoint', () => {
      const req: any = {
        user: { id: 'user-2', email: 'viewer@scb.com', role: 'VIEWER' },
      };
      const res: any = {};
      const next = vi.fn();

      const middleware = authorize('ADMIN');
      expect(() => middleware(req, res, next)).toThrowError(AppError);

      try {
        middleware(req, res, next);
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe('FORBIDDEN');
      }
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validate Middleware', () => {
    const testSchema = z
      .object({
        name: z.string().min(3),
        amount: z.number().positive(),
      })
      .strict();

    it('passes valid request body and calls next()', () => {
      const req: any = {
        body: { name: 'Valid Project', amount: 5000 },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validate(testSchema, 'body');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 422 with structured details when validation fails or unrecognized keys are present', () => {
      const req: any = {
        body: { name: 'AB', amount: -50, extraField: 'invalid' },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validate(testSchema, 'body');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('errorHandler Middleware', () => {
    it('formats AppError with correct status code and structured JSON', () => {
      const error = new AppError(403, 'BASELINE_ATTEMPT', 'Modification blocked');
      const req: any = {};
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BASELINE_ATTEMPT',
          message: 'Modification blocked',
        },
      });
    });
  });
});
