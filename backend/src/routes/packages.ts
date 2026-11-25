// GET /api/packages — SATU-SATUNYA sumber harga, kuota, ETA, dan garansi
// (docs/REDESIGN.md §2). UI tidak boleh meng-hardcode angka ini.

import type { Request, Response } from 'express';
import { Router } from 'express';
import { PACKAGES } from '../lib/packages';
import { sendOk } from '../lib/http';

const router = Router();

router.get('/api/packages', (_req: Request, res: Response): void => {
  sendOk(res, { packages: PACKAGES });
});

export default router;