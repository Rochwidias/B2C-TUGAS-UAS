// Helper response JSON untuk SEMUA route API: error selalu {error} + status jujur,
// bukan halaman HTML error default Next.js.

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export function jsonOk(payload: Record<string, unknown>, status = 200): Response {
  return Response.json(payload, { status });
}

/** Baca body JSON; body rusak / bukan JSON -> null (dipetakan route ke 400). */
export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');