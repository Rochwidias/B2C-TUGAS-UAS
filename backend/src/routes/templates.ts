import type { Request, Response } from 'express';
import { Router } from 'express';
import { listTemplates } from '../lib/db';
import { recommendedPackageFor } from '../lib/packages';
import { sendOk } from '../lib/http';

const router = Router();

// GET /api/templates — katalog publik (tanpa gate); tiap item bertambah
// `recommendedPackage` dari peta statis backend (docs/REDESIGN.md §3).
router.get('/api/templates', (_req: Request, res: Response): void => {
  const templates = listTemplates().map((template) => ({
    ...template,
    recommendedPackage: recommendedPackageFor(template.category),
  }));
  sendOk(res, { templates });
});

export default router;