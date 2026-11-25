# Kontrak: hapus backend total, semuanya frontend (2026-11-25)

Keputusan pemilik proyek: aplikasi tidak punya backend dan tidak punya database.
Folder `backend/` dan `render.yaml` **dihapus** (riwayat git tetap menyimpannya).
Satu-satunya penyimpanan data adalah **localStorage browser** (`aether-orders`),
per perangkat. Dokumen ini kontrak yang berlaku; bagian API/backend di
`SPEC.md`, `REDESIGN.md`, dan `WHATSAPP-FLOW.md` menjadi historis.

## Keputusan teknis (final, jangan digubah lagi)

1. **Nomor order tunggal: `UK-ORD-XXXX`** (4 digit, unik di penyimpanan lokal).
   Format `ATH-YYYYMMDD-XXXX` dihapus — dulu menyebabkan order baru tidak bisa
   dilacak karena form `/orders` memvalidasi `/^UK-ORD-\d{4}$/`. Pesanan demo
   tetap **UK-ORD-8812**.
2. **Store lokal tunggal**: `frontend/src/lib/orders-store.ts` (sudah ditulis
   parent, JANGAN ditulis ulang) — satu-satunya yang menyentuh
   `localStorage['aether-orders']`. Shop dan admin sama-sama membaca store ini,
   jadi order yang dibuat customer muncul langsung di kanban admin (browser sama).
3. **Tanpa fetch API**: semua `fetch('/api/...')` dihapus. Katalog = `CATALOG_TEMPLATES`
   (statis, isi seed lama), paket = `PACKAGES` (statis), kontak WA =
   `NEXT_PUBLIC_WHATSAPP_NUMBER` (default placeholder `6281234567890`).
   `frontend/src/lib/api.ts` dihapus parent setelah semua import-nya lenyap.
4. **Admin lokal**: login membandingkan password dengan env
   `NEXT_PUBLIC_ADMIN_PASSWORD` (default `admin123`), lalu set cookie
   `admin_session` via `document.cookie` (max-age 7 hari). Middleware hanya
   memeriksa keberadaan cookie. Ini gate tingkat demo — password ikut bundle
   client; catat jujur di README.
5. **Konten poster**: editor admin menyimpan ke `order.drafts` (`engine: 'manual'`)
   lewat store. Skema konten tetap REDESIGN §4 (`brand/theme/poster/points[3]`).
   Brief asli customer disimpan di `order.brief`.
6. `next.config.ts`: rewrite `/api/*` dihapus; redirect `/katalog` → `/` dan
   header keamanan **tetap**.

## Kontrak store `frontend/src/lib/orders-store.ts`

```ts
export const ORDER_STORE_KEY, RECENT_EVENT ('craftai:recent-changed'),
  LAST_ORDER_KEY ('craftai-last-order'), LAST_ORDER_EVENT, ORDER_NUMBER_PATTERN
export interface StoredDraft extends OrderDraft { engine?: string }
export interface StoredOrder extends Order {
  brief?: OrderBriefPayload | null; logs: OrderLog[]; drafts: StoredDraft[];
}
listOrders(): StoredOrder[]
getOrderById(id): StoredOrder | null
getOrderByNumber(number): StoredOrder | null
remainingOf(order): number            // max((quota ?? 1) - drafts.length, 0)
createOrder(input): StoredOrder       // nomor UK-ORD-XXXX unik, status draft
mutateOrder(id, fn): StoredOrder | null   // persist + event + updated_at
setStatus(id, to, note?): StoredOrder | null      // tulis order_logs
addRevisionNote(id, message): StoredOrder | null  // log '[REVISI] '
addBriefPoster(id, brief): {ok:true; order} | {ok:false; reason:'not_found'|'quota'}
savePoster(id, content: Draft): StoredOrder | null // draft engine 'manual' + log
setDelivery(id, patch): StoredOrder | null
toResponse(order, templateName?): OrderResponse   // bentuk {order,draft,drafts,logs,remaining}
ensureDemoOrder(): void               // seed UK-ORD-8812 lengkap (draft+logs)
```

## Pembagian kerja (jangan tabrakan)

| Agent | Milik eksklusif |
|---|---|
| UI-SHOP | `frontend/src/lib/**` (kecuali orders-store.ts), `frontend/src/app/**` non-admin, `frontend/src/components/shop/**`, `frontend/next.config.ts` |
| UI-ADMIN | `frontend/middleware.ts`, `frontend/src/app/admin/**`, `frontend/src/components/admin/**` |
| DOCS-TEST | `README.md`, `docs/**` (kecuali FRONTEND-ONLY.md), `frontend/tests/**`, `.gitignore` |
| parent | `frontend/src/lib/orders-store.ts`, hapus `backend/` + `render.yaml` + `lib/api.ts`, commit & push, verifikasi akhir |

Aturan: **tidak ada `git commit`/`git push` dari subagent**. Agent lain boleh
membaca/mengimpor file milik agent lain, tidak boleh mengedit. `lib/api.ts`
jangan dihapus subagent — cukup buang semua import-nya.

## Verifikasi wajib sebelum selesai

- frontend: `npx tsc --noEmit` 0 error (error di folder milik agent lain
  dilaporkan apa adanya, bukan diperbaiki), `npx eslint src` 0 error pada file
  milik sendiri.
- DOCS-TEST: suite `pytest frontend/tests/test_e2e.py frontend/tests/test_features.py`
  lolos dengan server milik sendiri (backend sudah tidak ada).
- parent: build penuh + smoke Playwright + commit.
