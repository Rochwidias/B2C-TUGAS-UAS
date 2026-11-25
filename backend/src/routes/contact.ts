import { Router, type Request, type Response, type NextFunction } from 'express';
import { sendOk } from '../lib/http';
import { contactInfo } from '../lib/whatsapp';

const router = Router();

/**
 * GET /api/contact — nomor WhatsApp toko dari env `WHATSAPP_NUMBER`
 * (default placeholder 6281234567890) beserta dua tautan wa.me:
 * `whatsappUrl` untuk umum dan `whatsappSupportUrl` untuk pesan serah terima.
 */
router.get('/api/contact', (_req: Request, res: Response, _next: NextFunction): void => {
  sendOk(res, contactInfo());
});

export default router;