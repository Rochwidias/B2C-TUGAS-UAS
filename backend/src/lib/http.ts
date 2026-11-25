// Helper response JSON untuk SEMUA route API: error selalu {error} + status jujur,
// bentuknya identik dengan route handler Next.js lama.

import type { Response as ExpressResponse } from 'express';

/** Body sudah diparse `express.json()`; body rusak / bukan object -> null. */
export function bodyObject(body: unknown): Record<string, unknown> | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

/** Kirim `{error}` dengan status tertentu (dipakai semua route). */
export function sendError(res: ExpressResponse, message: string, status: number): void {
  res.status(status).json({ error: message });
}

/** Kirim payload JSON dengan status (default 200). */
export function sendOk(
  res: ExpressResponse,
  // `object` (bukan Record) supaya spread interface — mis. orderDetail — tetap diterima.
  payload: object,
  status = 200,
): void {
  res.status(status).json(payload);
}

export const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');