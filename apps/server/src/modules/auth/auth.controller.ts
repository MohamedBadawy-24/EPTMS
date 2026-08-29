import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { config } from '../../config/env.js';

// ─── Cookie Configuration ────────────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
};

// ─── Auth Controller ─────────────────────────────────────────────────────────

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, token } = await authService.login(req.body);

    res.cookie('access_token', token, COOKIE_OPTIONS);

    res.json({
      success: true,
      data: user,
    });
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'strict',
      path: '/',
    });

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.user!.id);

    res.json({
      success: true,
      data: user,
    });
  }),
};
