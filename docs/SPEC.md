# SPEC — CraftAI Studio (kontrak teknis, WAJIB dibaca semua agent)

> **KONTRAK TERBARU (berlaku sekarang):** [`WHATSAPP-FLOW.md`](WHATSAPP-FLOW.md)
> — **AI dibuang total** (tidak ada `POST /api/drafts`, Gemini, generator lokal,
> badge `engine`); konten poster disusun **editor manusia lewat back-office**;
> pesanan & serah terima hasil lewat **WhatsApp (`wa.me`)**. Mana pun yang
> bertentangan dengan WHATSAPP-FLOW, ikuti WHATSAPP-FLOW.
>
> **REDESIGN:** arah produk, identitas, paket harga, skema konten poster, endpoint
> baru, dan halaman sudah diganti ke **Aether Creative** — kontraknya ada di
> [`REDESIGN.md`](REDESIGN.md). Dokumen ini tetap berlaku **sejauh tidak
> bertentangan** dengan REDESIGN.md (terutama hal keamanan, rate limit,
> kepemilikan file, error handling, dan aksesibilitas).

Aplikasi UAS: **B2C Template Customization Service**. Customer pilih contoh poster →
isi brief + kontak → pesanan dicatat di web → editor manusia menyusun konten poster
di back-office → checkout mock → developer/admin eksekusi → deploy → serah terima
hasil (live URL + source code) dikonfirmasi **lewat WhatsApp**.

Sumber kebenaran desain bisnis: `../PLAN.md` (jangan diubah tanpa izin user).
Prototype lama `../index.html` = referensi visual (dark slate + indigo), TIDAK dijalankan.

## Stack (sudah di-scaffold, JANGAN ganti)

- **Dua proyek terpisah**: `backend/` (Express + node:sqlite, semua `/api/*`,
  port 4000) dan `frontend/` (Next.js App Router + TypeScript + Tailwind,
  port 3000). Frontend tidak punya route `/api` dan tidak mengakses DB langsung;
  semua data diambil via `fetch` ke backend.
- DB: **`node:sqlite`** (built-in Node 26, tanpa dependency) di `backend/data/app.db`.
- ~~AI: REST `generativelanguage.googleapis.com`~~ **DIHAPUS** — tidak ada model,
  tidak ada API key, tidak ada generator lokal; konten poster disusun editor
  manusia lewat `PUT /api/admin/orders/:id/poster` (`engine = 'manual'`).
  Jangan mengarang konten di client.
- Tidak ada backend Python / Supabase / Prisma. Tidak ada auth provider eksternal.

## Layout & PEMILIKAN FILE (anti-tabrakan — hanya tulis di folder milikmu)

```
backend/
  src/lib/            -> milik Agent-BACKEND (db, brief, whatsapp, render,
                          validate, security, ratelimit, http)
  src/services/       -> milik Agent-BACKEND (orders, stats)
  src/routes/         -> milik Agent-BACKEND (templates, packages, contact,
                          orders, delivery, admin, export)
  src/types.ts, src/middleware/adminAuth.ts, src/index.ts -> milik Agent-BACKEND
frontend/
  src/app/(shop)/**   -> milik Agent-UI-SHOP   (halaman customer)
  src/components/shop/** -> milik Agent-UI-SHOP
  src/app/admin/**    -> milik Agent-UI-ADMIN  (halaman back-office)
  src/components/admin/** -> milik Agent-UI-ADMIN
  src/app/layout.tsx, globals.css -> milik Agent-UI-SHOP (satu kali, jangan disentuh lagi)
  src/app/page.tsx    -> milik Agent-UI-SHOP (route '/' )
docs/                 -> dokumen (SPEC ini, WHATSAPP-FLOW, REDESIGN, laporan)
README.md             -> dokumen
frontend/tests/       -> uji Python/Playwright (milik dokumen-test)
```

Pemisahan backend ↔ frontend:
- `backend/**` = semua logika server (route `/api/*`, query DB, AI, service,
  gate admin, rate limit). Berjalan terpisah di port 4000.
- `frontend/**` = UI Next.js. Tidak ada route `/api` dan tidak ada akses DB
  langsung; semua data lewat `fetch` ke `${API_BASE}/api/*`
  (`src/lib/api.ts`, default `http://localhost:4000`).

File yang TIDAK boleh dihapus: `PLAN.md`, `index.html` (artefak Milestone 1).
Jangan `git commit` — parent yang commit. Jangan `rm -rf` apa pun.

## Domain model (sqlite `backend/data/app.db`, auto-create saat pertama query)

```ts
type OrderStatus = 'draft' | 'paid' | 'in_progress' | 'review' | 'completed';
type PaymentStatus = 'unpaid' | 'paid';
type Role = 'customer' | 'admin' | 'developer';

templates(id TEXT PK, name, category, description, emoji, base_price INTEGER,
          preview_gradient TEXT, is_active INTEGER)
orders(id TEXT PK, order_number TEXT UNIQUE /* UK-ORD-XXXX */,
       template_id FK, status, payment_status, total_price INTEGER,
       contact_name, contact_whatsapp, contact_email, package_name,
       live_website_url TEXT, download_zip_url TEXT, dev_note TEXT,
       created_at, updated_at)
ai_drafts(id TEXT PK, order_id TEXT NULL, template_id, input_prompt_data JSON,
          ai_generated_content JSON /* kini = konten poster buatan editor */,
          engine TEXT /* 'manual' | nilai lama 'gemini'|'local' */,
          generated_at)
order_logs(id TEXT PK, order_id FK, status_from, status_to, developer_note, timestamp)
```

Seed saat DB kosong: 3 template dari `index.html`
(Artisan Cafe & Resto/fnb/Rp250.000 ☕, Modern Creative Portfolio/portfolio/Rp300.000 💼,
Direct-to-Consumer Store/shop/Rp350.000 🛍️) + 1 order demo `UK-ORD-8812`
(status `in_progress`, paid) beserta draft & log agar dashboard tidak kosong saat demo.

## Skema JSON konten poster (diisi editor manusia — bukan AI)

Bentuk skema diseragamkan dengan [`WHATSAPP-FLOW.md`](WHATSAPP-FLOW.md) —
sebelumnya dikenal sebagai "skema draft AI" di PLAN.md §6:

```json
{
  "brand":   { "name": "string", "tagline": "string", "about": "string" },
  "theme":   { "primaryColor": "hex", "accentColor": "hex", "fontPairing": "string" },
  "poster":  { "badge": "string", "headline": "string",
               "subheadline": "string", "ctaText": "string" },   // dulu heroSection
  "points":  [ { "icon": "string", "title": "string", "description": "string" } ] // tepat 3; dulu features
}
```
- ~~`faq`~~ dihapus; brief input lama (`brandName/tagline/themeColor/...`) diganti
  brief baru `{templateId, brief:{merekLokasi, segmenTarget, suasanaMerek,
  aksiUtama, nadaRekaman}, contact:{name, whatsapp, email?}}`.
- Tidak ada `themeColor` enum, tidak ada `engine`, tidak ada `draftId` di checkout.
- Konten disimpan via `PUT /api/admin/orders/:id/poster` dengan `engine = 'manual'`.
- ~~`backend/src/lib/ai.ts` / `generateDraft`~~ **dihapus total**.

## API contract (dipakai oleh SEMUA UI)

| Method & path | Body / query | Return |
|---|---|---|
| `GET /api/templates` | — | `{templates: Template[]}` |
| `GET /api/packages` | — | `{packages: [{key,name,price,quota,etaGuarantee,...}]}` (satu-satunya sumber harga/ETA/garansi) |
| ~~`POST /api/drafts`~~ | — | **DIHAPUS** (AI dibuang) → 404 |
| `GET /api/contact` | — | `{whatsappNumber, whatsappUrl, whatsappSupportUrl}` dari env `WHATSAPP_NUMBER` |
| `POST /api/orders` | `{templateId, packageKey, brief:{merekLokasi,segmenTarget,suasanaMerek,aksiUtama,nadaRekaman}, contact:{name,whatsapp,email?}}` — **tanpa `draftId`** | `{data:{order, whatsappUrl}}` — buat order `draft`, `ai_draft_id = NULL`, log tersimpan; `whatsappUrl` = `wa.me` berisi nomor order + paket + ETA + brief |
| `PUT /api/admin/orders/[id]/poster` | `{content: PosterDraft}` (admin-only) | `{order, draft}` — `engine = 'manual'`, audit-log `poster.edited` |
| `GET /api/orders?number=UK-ORD-XXXX` | — | `{order, draft, logs}` atau 404 |
| `GET /api/orders/[id]` | — | `{order, draft, logs}` |
| `GET /api/admin/orders` | — | `{columns: {backlog, in_progress, review, completed}: Order[]}` (backlog = `draft`+`paid`) |
| `GET /api/admin/stats` | — | `{counts, revenue, delivered, averageCompletionHours, totalLogs, recentOrders}` — agregat untuk baris statistik dashboard |
| `PATCH /api/orders/[id]` | `{status?, devNote?}` | `{order}` + tulis `order_logs` |
| `PUT /api/orders/[id]/delivery` | `{liveWebsiteUrl, downloadZipUrl, devNote}` | `{order}` |
| `GET /api/export/[draftId]` | — | standalone HTML siap deploy (Content-Disposition attachment), berisi konten draft + warna theme |

Semua error: `{error: string}` + status code jujur (400/404/500). Jangan kembalikan HTML error Next default di JSON route.

### Keamanan & kualitas (WAJIB, ditambahkan setelah audit)

- **Gate admin di setiap route tulis.** `PATCH /api/orders/[id]` dan
  `PUT /api/orders/[id]/delivery` memeriksa `isAdminAuthenticated()`; tanpa ini
  siapa pun yang tahu UUID order bisa mengubah status produksi.
- **Middleware memverifikasi token, bukan keberadaan cookie.** Cookie
  `admin_session=apa-saja` harus ditolak, dan cookie invalid dihapus saat redirect.
- **Rate limit per IP** (`backend/src/lib/ratelimit.ts`, jendela geser di memori):
  login admin 6/15 menit, checkout/tulis pelanggan `customerWrite` 10/menit
  (dipakai `POST /api/orders` + `POST /api/orders/:id/briefs`), checkout/bayar
  5/10 menit, lacak order 20/menit, tulis admin 60/menit. Bucket `drafts`
  (8/5 menit) **ikut dihapus** bersama `POST /api/drafts`.
  Lewat batas → 429 + `retryAfterSeconds`.
- **Batas panjang & sanitasi** (`backend/src/lib/security.ts`). `LIMITS` adalah satu-satunya sumber
  angka; `sanitizeText` membuang karakter kontrol; `requireCap` menolak (bukan memotong)
  input customer agar tidak ada teks yang hilang diam-diam. `validateDraftSchema`
  memotong medan konten poster di `MAX_TEXT` (sekarang input editor manusia).
- **Validasi WhatsApp & email.** Nomor dinormalkan ke format `08xx` sebelum disimpan.
- **Nomor order unik.** `nextOrderNumberSafe` mengulang saat tabrakan UNIQUE, tidak
  melempar 500.
- **Header keamanan** dipasang global di `next.config.ts` (`nosniff`, `SAMEORIGIN`,
  `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`) dan
  `poweredByHeader: false`. CSP belum dipasang karena script tema pre-paint inline
  butuh nonce.
- **Error boundary berlapis.** `app/error.tsx` (rute), `app/global-error.tsx` (root),
  `app/admin/error.tsx` (back-office), plus `app/not-found.tsx`.
- **Route handler memakai runtime Node default.** `export const runtime` dan
  `export const dynamic` TIDAK boleh dipasang: `next.config` memakai
  `cacheComponents`, yang melarang route segment config tersebut.

## Halaman (rute, bukan file — sesuaikan folder milik)

**Agent-UI-SHOP**
1. `/` — hero, cara kerja 3 langkah, katalog dengan **filter kategori yang
   berfungsi** (di prototype lama tombol filter tidak punya handler — ini bug
   yang harus diperbaiki), tombol kustomisasi → `/customizer/[templateId]`,
   tombol kontak WhatsApp dari `GET /api/contact`.
2. `/customizer/[templateId]` — dual pane: form **brief + kontak** kiri (tanpa
   tombol Generate, tanpa badge engine), **live preview poster kanan** yang
   merender konten yang ada, kartu paket dari `GET /api/packages` (harga, ETA,
   garansi) → `POST /api/orders` (tanpa `draftId`) → tampil nomor order +
   tombol **Buka WhatsApp** (wa.me) + **Cek Status Pesanan**.
3. `/orders` — lacak pesanan dengan input nomor `UK-ORD-XXXX` (tanpa login),
   ada tombol **Chat via WhatsApp** (URL dari `GET /api/contact`).
4. `/orders/[id]` — stepper 5 tahap (`draft→paid→in_progress→review→completed`),
   catatan dev, tombol Akses Live URL + Unduh Source Code (aktif hanya bila sudah `completed`),
   tombol Export Draft.
5. Loading/empty/error state di setiap halaman. Responsive (uji 375px & 1280px).

**Agent-UI-ADMIN**
1. `/admin` — **Kanban board** 4 kolom (Backlog, In Progress, Need Review, Completed),
   pindah kartu via PATCH `/api/orders/[id]` (dropdown atau drag — drag opsional),
   jumlah order per kolom.
2. `/admin/orders/[id]` — brief asli customer + **Editor Konten Poster**
   (disimpan via `PUT /api/admin/orders/[id]/poster`, `engine = 'manual'`),
   preview hasil, tombol **Chat ke Customer** (wa.me ke nomor order),
   tombol **Export Clean Source Code** (GET /api/export/[draftId]),
   update status + catatan dev, form delivery (live URL, zip URL, catatan) → PUT delivery,
   riwayat `order_logs`.
3. Gate sederhana: cookie `admin_session` di-set via POST `/api/admin/login`
   (password dari env `ADMIN_PASSWORD`, default `admin123`), middleware/route check di
   `/admin/**`. Halaman login di `/admin/login`.

## Kualitas (wajib)

- `npm run build` harus **lolos** di `frontend/` (type check + lint). Perbaiki errornya.
- Komentar kode: hanya yang menjelaskan *kenapa*; jangan komentar generik.
- Teks UI bahasa Indonesia, nada seperti `index.html` ( profesional, tidak norak ).
- Aksesibilitas: label form nyata (`<label htmlFor>`), focus state terlihat, tombol punya
  `aria-*` bila ikon saja, kontras teks lolos WCAG AA.

## Verifikasi sebelum lapor (wajib, sertakan bukti di laporan)

```bash
cd frontend && npm run build
```
Lalu uji alur dengan Playwright (skill `webapp-testing`, script di workspace) dan
suite Python: `python3 -m pytest frontend/tests/test_api.py frontend/tests/test_security.py`.
Alur: home → filter kategori → customizer (isi brief + kontak) → **Kirim Pesanan
via WhatsApp** (dapat nomor order + link wa.me) → lacak nomor →
admin login → **Editor Konten Poster** → pindah status → delivery →
cek live URL tampil di halaman customer.
Laporkan: file yang dibuat, hasil build, hasil uji (screenshot path), hal yang belum.