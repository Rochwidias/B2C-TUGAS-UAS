import type { Express, Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { listTemplates } from '../lib/db';
import { sendOk } from '../lib/http';

const router = Router();

// GET /api/templates — katalog publik (tanpa gate).
router.get('/api/templates', (_req: Request, res: Response): void => {
  sendOk(res, { templates: listTemplates() });
});

export default router;