import { getDraft, getDraftByOrderId, getTemplate } from '@/lib/db';
import { jsonError } from '@/lib/http';
import { renderDraftToHtml } from '@/lib/render';

type RouteContext = { params: Promise<{ draftId: string }> };

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { draftId } = await context.params;
  // Id di URL bisa merujuk draft bebas ataupun id order; keduanya diterima
  // agar tombol export di halaman customer maupun admin selalu tembus.
  const draft = getDraft(draftId) ?? getDraftByOrderId(draftId);
  if (!draft) return jsonError('Draft tidak ditemukan.', 404);

  const html = renderDraftToHtml(draft.ai_generated_content, getTemplate(draft.template_id));
  const filename = `${(draft.ai_generated_content.brand.name || 'website')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'website'}-${draftId.slice(0, 8)}.html`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}