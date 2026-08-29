import type { Request, Response } from 'express';
import { dashboardService } from './dashboard.service.js';
import { asyncHandler } from '../../lib/asyncHandler.js';

// ─── Dashboard Controller ────────────────────────────────────────────────────

export const dashboardController = {
  getSummary: asyncHandler(async (_req: Request, res: Response) => {
    const summary = await dashboardService.getSummary();

    res.json({ success: true, data: summary });
  }),

  getCharts: asyncHandler(async (_req: Request, res: Response) => {
    const charts = await dashboardService.getChartData();

    res.json({ success: true, data: charts });
  }),
};
