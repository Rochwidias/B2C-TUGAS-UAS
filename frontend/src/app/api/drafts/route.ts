import { generateDraft } from '@/lib/ai';
import { getTemplate, insertDraft } from '@/lib/db';
import { asString, jsonError, jsonOk, readJsonBody } from '@/lib/http';
import type { DraftBrief, ThemeColorKey } from '@/lib/types';
import { validateDraftSchema } from '@/lib/validate';

const THEME_KEYS: ThemeColorKey[] = ['amber', 'indigo', 'emerald', 'rose'];

export async function POST(request: Request): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return jsonError('Body request bukan JSON yang valid.', 400);

  const templateId = asString(body.templateId);
  const brandName = asString(body.brandName);
  if (!templateId) return jsonError('templateId wajib diisi.', 400);
  if (!brandName) return jsonError('brandName wajib diisi.', 400);

  const template = getTemplate(templateId);
  if (!template) return jsonError(`Template "${templateId}" tidak ditemukan.`, 404);

  const themeColor = asString(body.themeColor) as ThemeColorKey;
  if (!THEME_KEYS.includes(themeColor)) {
    return jsonError(`themeColor harus salah satu dari: ${THEME_KEYS.join(', ')}.`, 400);
  }

  const brief: DraftBrief = {
    templateId,
    brandName,
    tagline: asString(body.tagline),
    description: asString(body.description),
    themeColor,
    ctaText: asString(body.ctaText),
    toneOfVoice: asString(body.toneOfVoice),
  };

  let generated;
  try {
    generated = await generateDraft(brief);
  } catch (error) {
    console.error('[api/drafts] generator gagal:', error);
    return jsonError('Generator draft gagal dijalankan. Coba lagi sebentar lagi.', 500);
  }

  // Pengaman terakhir: hanya draft yang lolos skema SPEC yang boleh disimpan.
  const issues = validateDraftSchema(generated.content);
  if (issues.length > 0) {
    console.error('[api/drafts] draft tidak valid:', issues);
    return jsonError('Hasil generator tidak sesuai skema draft.', 500);
  }

  const draft = insertDraft(template.id, brief, generated.content);
  return jsonOk({ draftId: draft.id, content: generated.content, engine: generated.engine });
}