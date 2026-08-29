import type { Request, Response } from 'express';
import { contractorService } from './contractors.service.js';
import { asyncHandler } from '../../lib/asyncHandler.js';

// ─── Contractors Controller ──────────────────────────────────────────────────

export const contractorController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await contractorService.getAll(req.query as any);

    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const score = await contractorService.getById(req.params.id as string);

    res.json({ success: true, data: score });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const score = await contractorService.create(req.body, req.user!.id);

    res.status(201).json({ success: true, data: score });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const score = await contractorService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
    );

    res.json({ success: true, data: score });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await contractorService.delete(req.params.id as string, req.user!.id);

    res.status(204).send();
  }),
};
