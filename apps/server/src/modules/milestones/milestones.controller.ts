import type { Request, Response } from 'express';
import { milestoneService } from './milestones.service.js';
import { asyncHandler } from '../../lib/asyncHandler.js';

// ─── Milestones Controller ───────────────────────────────────────────────────

export const milestoneController = {
  getByProject: asyncHandler(async (req: Request, res: Response) => {
    const milestones = await milestoneService.getByProject(req.params.projectId as string);

    res.json({ success: true, data: milestones });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const milestone = await milestoneService.getById(req.params.id as string);

    res.json({ success: true, data: milestone });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const milestone = await milestoneService.create(
      { ...req.body, projectId: req.params.projectId as string },
      req.user!.id,
    );

    res.status(201).json({ success: true, data: milestone });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const milestone = await milestoneService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
    );

    res.json({ success: true, data: milestone });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await milestoneService.delete(req.params.id as string, req.user!.id);

    res.status(204).send();
  }),
};
