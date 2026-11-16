import { Router, type Request, type Response, type NextFunction } from 'express';
import { generateDraft } from '../lib/ai';
import { getTemplate, insertDraft } from '../lib/db';
import { asString, bodyObject, sendError, sendOk } from '../lib/http';
import { clientKey, rateLimit } from '../lib/ratelimit';
import { LIMITS, requireCap } from '../lib/security';
import type { DraftBrief, ThemeColorKey } from '../types';
import { validateDraftSchema } from '../lib/validate';

const router = Router();

const THEME_KEYS: ThemeColorKey[] = ['amber', 'indigo', 'emerald', 'rose'];

// POST /api/drafts — generate draft AI (rate limit: 8 request per 5 menit per IP).
router.post('/api/drafts', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  // Pemanggilan AI berbiaya, jadi dibatasi per IP: 8 draft per 5 menit.
  const limit = rateLimit(clientKey(req, 'drafts'), 8, 5 * 60_000);
  if (!limit.ok) {
    sendError(res, `Terlalu banyak permintaan draft. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, 429);
    return;
  }

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

  const brandName = requireCap(asString(body.brandName), LIMITS.brandName, 'Nama brand');
  if (!brandName.value) { sendError(res, 'brandName wajib diisi.', 400); return; }
  if (!brandName.ok) { sendError(res, brandName.error!, 400); return; }

  const tagline = requireCap(asString(body.tagline), LIMITS.tagline, 'Tagline');
  if (!tagline.ok) { sendError(res, tagline.error!, 400); return; }

  const description = requireCap(asString(body.description), LIMITS.description, 'Deskripsi bisnis');
  if (!description.ok) { sendError(res, description.error!, 400); return; }

  const ctaText = requireCap(asString(body.ctaText), LIMITS.ctaText, 'Teks tombol');
  if (!ctaText.ok) { sendError(res, ctaText.error!, 400); return; }

  const toneOfVoice = requireCap(asString(body.toneOfVoice), LIMITS.toneOfVoice, 'Nada penulisan');
  if (!toneOfVoice.ok) { sendError(res, toneOfVoice.error!, 400); return; }

  const template = getTemplate(templateId);
  if (!template) {
    sendError(res, `Template "${templateId}" tidak ditemukan.`, 404);
    return;
  }

  const themeColor = asString(body.themeColor) as ThemeColorKey;
  if (!THEME_KEYS.includes(themeColor)) {
    sendError(res, `themeColor harus salah satu dari: ${THEME_KEYS.join(', ')}.`, 400);
    return;
  }

  const brief: DraftBrief = {
    templateId,
    brandName: brandName.value,
    tagline: tagline.value,
    description: description.value,
    themeColor,
    ctaText: ctaText.value,
    toneOfVoice: toneOfVoice.value,
  };

  let generated;
  try {
    generated = await generateDraft(brief);
  } catch (error) {
    console.error('[api/drafts] generator gagal:', error);
    sendError(res, 'Generator draft gagal dijalankan. Coba lagi sebentar lagi.', 500);
    return;
  }

  // Pengaman terakhir: hanya draft yang lolos skema SPEC yang boleh disimpan.
  const issues = validateDraftSchema(generated.content);
  if (issues.length > 0) {
    console.error('[api/drafts] draft tidak valid:', issues);
    sendError(res, 'Hasil generator tidak sesuai skema draft.', 500);
    return;
  }

  const draft = insertDraft(template.id, brief, generated.content);
  sendOk(res, { draftId: draft.id, content: generated.content, engine: generated.engine });
});

export default router;