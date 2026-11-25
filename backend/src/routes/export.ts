import { Router, type Request, type Response, type NextFunction } from 'express';
import { getDraft, getDraftByOrderId, getTemplate } from '../lib/db';
import { sendError } from '../lib/http';
import { renderDraftToHtml } from '../lib/render';

const router = Router();

// GET /api/export/:draftId — HTML poster siap pakai sebagai attachment (§4).
router.get('/api/export/:draftId', (req: Request, res: Response, _next: NextFunction): void => {
  const { draftId } = req.params;
  // Id di URL bisa merujuk draft bebas ataupun id order; keduanya diterima
  // agar tombol export di halaman customer maupun admin selalu tembus.
  const draft = getDraft(draftId) ?? getDraftByOrderId(draftId);
  if (!draft) { sendError(res, 'Draft tidak ditemukan.', 404); return; }

  // Konten draft sudah di-escape oleh renderer sebelum masuk HTML.
  const html = renderDraftToHtml(draft.ai_generated_content, getTemplate(draft.template_id));
  const slug = (draft.ai_generated_content.brand.name || 'poster')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'poster';
  const filename = `${slug}-poster-${draftId.slice(0, 8)}.html`;

  res
    .status(200)
    .set('Content-Type', 'text/html; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="${filename}"`)
    .set('Cache-Control', 'no-store')
    .send(html);
});

export default router;