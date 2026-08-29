import { Router } from 'express';
import { authenticate } from '../../middleware/index.js';
import { dashboardController } from './dashboard.controller.js';

// ─── Dashboard Routes ────────────────────────────────────────────────────────
// All dashboard routes require authentication (any role).

const router = Router();

router.get('/summary', authenticate, dashboardController.getSummary);
router.get('/charts', authenticate, dashboardController.getCharts);

export const dashboardRoutes = router;
