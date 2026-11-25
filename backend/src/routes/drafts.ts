import { Router, type Request, type Response, type NextFunction } from 'express';
import { generateDraft } from '../lib/ai';
import { getTemplate, insertDraft } from '../lib/db';
import { asString, bodyObject, sendError, sendOk } from '../lib/http';
import { enforceRateLimit } from '../lib/ratelimit';
import { normalizeDraftSchema } from '../lib/validate';
import { parseBrief } from '../services/orders';

const router = Router();

// POST /api/drafts — generate draft poster AI (rate limit: 8 request per 5 menit per IP).
router.post('/api/drafts', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  // Pemanggilan AI berbiaya, jadi dibatasi per IP: 8 draft per 5 menit.
  if (!enforceRateLimit(req, res, 'drafts', 'drafts', 'Terlalu banyak permintaan draft.')) return;

  const body = bodyObject(req.body);
  if (!body) {
    sendError(res, 'Body request bukan JSON yang valid.', 400);
    return;
  }

  const templateId = asString(body.templateId);
  if (!templateId) {
    sendError(res, 'templateId wajib diisi.', 400);
    return;
  }

  // Validasi brief dipakai bersama oleh POST /api/orders/[id]/briefs (§4).
  const parsed = parseBrief(body);
  if (!parsed.ok) {
    sendError(res, parsed.error, 400);
    return;
  }

  const template = getTemplate(templateId);
  if (!template) {
    sendError(res, `Template "${templateId}" tidak ditemukan.`, 404);
    return;
  }

  let generated;
  try {
    generated = await generateDraft({ ...parsed.brief, templateId });
  } catch (error) {
    console.error('[api/drafts] generator gagal:', error);
    sendError(res, 'Generator draft gagal dijalankan. Coba lagi sebentar lagi.', 500);
    return;
  }

  // Pengaman terakhir: hanya draft yang lolos skema §4 yang boleh disimpan,
  // dan yang disimpan adalah objek ternormalisasi sehingga potongan MAX_TEXT
  // benar-benar terpakai (audit §12 A3 — hasil requireString tidak dibuang).
  const normalized = normalizeDraftSchema(generated.content);
  if (normalized.issues.length > 0 || !normalized.draft) {
    console.error('[api/drafts] draft tidak valid:', normalized.issues);
    sendError(res, 'Hasil generator tidak sesuai skema draft.', 500);
    return;
  }

  const draft = insertDraft(template.id, { ...parsed.brief, templateId }, normalized.draft);
  sendOk(res, { draftId: draft.id, content: normalized.draft, engine: generated.engine });
});

export default router;