import type { Request, Response } from 'express';
import { procurementService } from './procurement.service.js';
import { asyncHandler } from '../../lib/asyncHandler.js';

// ─── Procurement Controller ──────────────────────────────────────────────────

export const procurementController = {
  getByProject: asyncHandler(async (req: Request, res: Response) => {
    const items = await procurementService.getByProject(req.params.projectId as string);

    res.json({ success: true, data: items });
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await procurementService.getAll(req.query as any);

    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await procurementService.getById(req.params.id as string);

    res.json({ success: true, data: item });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await procurementService.create(
      { ...req.body, projectId: req.params.projectId as string },
      req.user!.id,
    );

    res.status(201).json({ success: true, data: item });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await procurementService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
    );

    res.json({ success: true, data: item });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await procurementService.delete(req.params.id as string, req.user!.id);

    res.status(204).send();
  }),
};
