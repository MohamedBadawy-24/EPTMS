import type { Request, Response } from 'express';
import { auditService } from './audit.service.js';
import { asyncHandler } from '../../lib/asyncHandler.js';

// ─── Audit Controller ────────────────────────────────────────────────────────

export const auditController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await auditService.query(req.query as any);

    res.json({ success: true, ...result });
  }),
};
