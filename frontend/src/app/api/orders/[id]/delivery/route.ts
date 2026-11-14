import { getOrder, updateDelivery } from '@/lib/db';
import { asString, jsonError, jsonOk, readJsonBody } from '@/lib/http';

type RouteContext = { params: Promise<{ id: string }> };

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) return jsonError('Pesanan tidak ditemukan.', 404);

  const body = await readJsonBody(request);
  if (!body) return jsonError('Body request bukan JSON yang valid.', 400);

  const liveWebsiteUrl = asString(body.liveWebsiteUrl);
  const downloadZipUrl = asString(body.downloadZipUrl);
  const devNote = asString(body.devNote);

  if (!liveWebsiteUrl) return jsonError('liveWebsiteUrl wajib diisi.', 400);
  if (!isValidUrl(liveWebsiteUrl)) return jsonError('liveWebsiteUrl harus berupa URL http/https yang valid.', 400);
  if (!downloadZipUrl) return jsonError('downloadZipUrl wajib diisi.', 400);
  if (!isValidUrl(downloadZipUrl)) return jsonError('downloadZipUrl harus berupa URL http/https yang valid.', 400);
  if (!devNote) return jsonError('devNote wajib diisi.', 400);

  const updated = updateDelivery(id, { liveWebsiteUrl, downloadZipUrl, devNote });
  if (!updated) return jsonError('Delivery gagal disimpan.', 500);
  return jsonOk({ order: updated });
}