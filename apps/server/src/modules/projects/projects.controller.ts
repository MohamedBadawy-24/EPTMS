import type { Request, Response } from 'express';
import { projectService } from './projects.service.js';
import { asyncHandler } from '../../lib/asyncHandler.js';

// ─── Projects Controller ─────────────────────────────────────────────────────

export const projectController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await projectService.getAll(req.query as any);

    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.getById(req.params.id as string);

    res.json({ success: true, data: project });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.create(req.body, req.user!.id);

    res.status(201).json({ success: true, data: project });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
    );

    res.json({ success: true, data: project });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await projectService.delete(req.params.id as string, req.user!.id);

    res.status(204).send();
  }),

  // ─── Stoppages Controller Actions ──────────────────────────────────────────

  getStoppages: asyncHandler(async (req: Request, res: Response) => {
    const stoppages = await projectService.getStoppages(req.params.id as string);

    res.json({ success: true, data: stoppages });
  }),

  createStoppage: asyncHandler(async (req: Request, res: Response) => {
    const stoppage = await projectService.createStoppage(
      req.params.id as string,
      req.body,
      req.user!.id,
    );

    res.status(201).json({ success: true, data: stoppage });
  }),

  updateStoppage: asyncHandler(async (req: Request, res: Response) => {
    const stoppage = await projectService.updateStoppage(
      req.params.id as string,
      req.params.stoppageId as string,
      req.body,
      req.user!.id,
    );

    res.json({ success: true, data: stoppage });
  }),

  deleteStoppage: asyncHandler(async (req: Request, res: Response) => {
    await projectService.deleteStoppage(
      req.params.id as string,
      req.params.stoppageId as string,
      req.user!.id,
    );

    res.status(204).send();
  }),
};
