# REDESIGN — Aether Creative (kontrak terbaru, WAJIB dibaca semua agent)

Sumber arah desain: slide **"CraftAI Studio.pdf"** (Canva, 6 halaman) yang berisi
redesign ke **Aether Creative** — platform pembuatan **poster** untuk UMKM.
Dokumen ini menggantikan `../docs/SPEC.md` **sejauh bertentangan**; hal teknis
yang tidak diubah di sini (keamanan, rate limit, layout kepemilikan file, error
handling, aksesibilitas) tetap mengikuti SPEC.

TIDAK boleh diubah: `../PLAN.md` dan `../index.html` — keduanya artefak
Milestone 1 (CraftAI Studio) dan tetap dipertahankan apa adanya. Jangan
`git commit`, jangan `rm -rf`.

## 1. Identitas & posisi

| | Lama (CraftAI Studio) | Baru (Aether Creative) |
|---|---|---|
| Produk | kustomisasi **template website** | pembuatan **poster** |
| Tagline | kustomisasi template dengan AI | "Platform pembuatan poster untuk membantu UMKM lebih tepercaya" |
| Nilai jual | cepat, AI + human-in-the-loop | "Cepat, terjangkau, sesuai karakter usaha dan lebih tepercaya" |
| Target | umum | mahasiswa & pelajar Yogyakarta (tugas & usaha sampingan); segmen tambahan: kreator/portofolio digital, toko online; aktif IG/TikTok/WA |
| Harga | 3 paket website 150k/250k/350k | **Satuan Rp50.000/order** · **Paket Hemat Rp100.000 = 3 order + review editor** |
| Alur kerja | brief → draft AI → checkout → dev → live | **Brief merek → Editor validasi → Hasil siap pakai** |

Teks UI tetap bahasa Indonesia, nada profesional (mengikuti nada `index.html`).
Merek ditulis **"Aether Creative"** (bukan "AetherCreative" / "Aether"). Semua
copy, metadata, manifest, footer, dan judul halaman harus konsisten.

## 2. Paket & harga (sumber kebenaran: `GET /api/packages`)

UI TIDAK boleh meng-hardcode harga/estimasi/garansi; semuanya diambil dari endpoint ini.

```
key       name          price   quota  eta              guarantee
satuan    "Satuan"      50000   1      "2–4 jam kerja"   "Revisi 2× dalam 3 hari"
hemat     "Paket Hemat" 100000  3      "1–3 hari kerja"  "Revisi 3× dalam 7 hari, termasuk review editor"
```

- `satuan` — 1 poster, cocok untuk sekali unggah/promo dadakan.
- `hemat` — 3 poster dalam satu order (kuota), dikerjakan berurutan + review editor.
- `eta` dan `guarantee` wajib **tampil sebelum customer membayar** (titik keraguan
  "cemas bayar tanpa hasil jelas" → prioritas aksi "transparansi hasil/garansi &
  estimasi waktu sebelum transaksi").

## 3. Domain model (sqlite `backend/data/app.db`, auto-create + seed idempoten)

Perubahan skema dibanding SPEC — semua migrasi **ALTER TABLE idempoten** dan
harus menangani database lama yang sudah berisi seed CraftAI (3 template
250k/300k/350k + order UK-ORD-8812):

```ts
templates(id, name, category, description, emoji, base_price /* 50000 semua */,
          preview_gradient, is_active)
orders(id, order_number, template_id, status, payment_status, total_price,
       contact_name, contact_whatsapp, contact_email,
       package_name /* tampilan: "Satuan" | "Paket Hemat" */,
       package_key  /* BARU: 'satuan' | 'hemat' */, 
       quota        /* BARU: 1 | 3, default 1 */,
       live_website_url, download_zip_url, dev_note, created_at, updated_at)
ai_drafts(id, order_id, template_id, input_prompt_data, ai_generated_content, generated_at)
order_logs(id, order_number?, order_id, status_from, status_to, developer_note, timestamp)
```

- `remaining` sebuah order = `quota - COUNT(ai_drafts WHERE order_id = orders.id)`.
  Tidak ada kolom counter tambahan.
- **Catatan tambahan/revision** tidak menambah kolom: tulis baris `order_logs`
  dengan `status_from = status_to = status saat ini` dan `developer_note`
  berprefix `"[REVISI] "` atau `"[BRIEF TAMBAHAN] "`.

**Seed baru (ganti seed lama, idempoten):**

| category | name | emoji | gradient |
|---|---|---|---|
| `kuliner` | Poster Promo Kuliner | ☕ | violet |
| `kreator` | Poster Kreator & Portofolio | 💼 | navy |
| `toko` | Poster Toko Online | 🛍️ | amber |

`GET /api/templates` menambah field `recommendedPackage` dari peta statis di
backend: `kuliner → hemat`, `kreator → satuan`, `toko → hemat`
(alasan: kuliner & toko butuh unggahan rutin, kreator pesan sesuai kebutuhan).
Order demo tetap **UK-ORD-8812** (status `in_progress`, paid) + draft + log.

## 4. Skema JSON draft AI (poster — menggantikan skema website lama)

```json
{
  "brand":  { "name": "string", "tagline": "string", "about": "string" },
  "theme":  { "primaryColor": "hex", "accentColor": "hex", "fontPairing": "string" },
  "poster": { "badge": "string", "headline": "string",
              "subheadline": "string", "ctaText": "string" },
  "points": [ { "icon": "string", "title": "string", "description": "string" } ]
}
```

- `points` **tepat 3** (menggantikan `features`); `faq` **dihapus** — pertanyaan
  teknis digantikan transparansi paket (§2) yang berasal dari backend, bukan AI.
- `heroSection` → `poster`. `validateDraftSchema` harus persis: tolak/fallback
  bila salah satu field hilang atau `points.length !== 3`.
- Brief input tidak berubah bentuk: `{templateId, brandName, tagline, description,
  themeColor, ctaText, toneOfVoice}`. **Enum `themeColor` berubah** menjadi
  `violet | navy | amber | emerald` (indigo digantikan violet) dengan pemetaan
  hex (primary → accent): violet `#8b5cf6`→`#6d28d9`, navy `#3b4bd8`→`#2735a8`,
  amber `#f59e0b`→`#b45309`, emerald `#10b981`→`#047857`. Kontras teks di atas
  warna theme harus tetap lolos WCAG AA (pakai `--accent-ink` bila perlu).
- `backend/src/lib/ai.ts`: `GEMINI_API_KEY` ada → `gemini-2.5-flash` + system
  prompt skema poster di atas, parse JSON (toleransi fence), validasi, fallback
  partial ke generator lokal; tanpa key → generator lokal deterministik yang
  benar-benar memakai brief customer (konten poster promosi, bukan lorem).
  Jangan pernah mengarang respons AI di client.
- `backend/src/lib/render.ts` (`GET /api/export/[draftId]`) menghasilkan
  **HTML poster siap pakai** (rasio poster, headline besar, 3 poin, CTA, warna
  theme) — bukan halaman website lagi.

## 5. API contract

Metode & bentuk response yang sudah ada di SPEC tetap berlaku, dengan penyesuaian:

| Method & path | Perubahan |
|---|---|
| `GET /api/templates` | item bertambah `recommendedPackage` |
| **`GET /api/packages`** | **BARU** → `{packages: [{key,name,price,quota,etaGuarantee?...}]}` sesuai §2 |
| `POST /api/drafts` | body brief sama; response `{draftId, content: Draft, engine}` — `content` memakai skema §4 |
| `POST /api/orders` | body `{draftId, templateId, packageKey, contactName, contactWhatsapp, contactEmail}`; `packageKey` wajib salah satu dari §2 → `total_price` & `quota` diambil dari paket, `package_name` diisi nama tampilan. Response tetap `{order, orderNumber}` |
| `GET /api/orders?number=` / `GET /api/orders/[id]` | response menjadi `{order, draft, drafts, logs, remaining}` (`drafts` = semua draft milik order — penting untuk kuota paket hemat) |
| **`POST /api/orders/[id]/briefs`** | **BARU** tambah brief poster dalam kuota. Body `{orderNumber, brief}`. 404 bila nomor salah, **400** bila `remaining <= 0` (pesan jelas: "Kuota paket sudah habis"), 429 sesuai rate limit tulis. Buat `ai_drafts` terhubung + `order_logs` `[BRIEF TAMBAHAN]` |
| **`POST /api/orders/[id]/revision`** | **BARU** minta revisi. Body `{orderNumber, message}`. Validasi panjang via `LIMITS`/`requireCap`, `sanitizeText`. Tulis `order_logs` `[REVISI] ...` (status tidak berubah). Hanya saat status `paid`/`in_progress`/`review` → selain itu 400 |
| `PATCH /api/orders/[id]` | tetap, **wajib** `isAdminAuthenticated()` |
| `PUT /api/orders/[id]/delivery` | tetap, **wajib** `isAdminAuthenticated()` |
| `GET /api/export/[draftId]` | tetap (poster HTML) |

- Endpoint `briefs` & `revision` divalidasi dengan **nomor order** (pola tracking
  yang sama dengan `GET /api/orders?number=`) dan kena rate limit tulis pelanggan
  (boleh memakai bucket baru, mis. 10/menit, yang didefinisikan di satu tempat).
- Semua error `{error: string}` + kode jujur (400/404/429/500).
- Gate admin, verifikasi token (bukan keberadaan cookie), `LIMITS`/`sanitizeText`/
  `requireCap`, normalisasi WA/email, `nextOrderNumberSafe`, header keamanan di
  `next.config.ts`, dan error boundary tetap persis seperti SPEC.

## 6. Halaman customer (Agent-UI-SHOP — `frontend/src/app/**` non-admin + `components/shop/**`)

1. `/` — hero Aether Creative (tagline §1), **alur 3 langkah** `Brief merek →
   Editor validasi → Hasil siap pakai`, katalog **contoh poster per segmen** dengan
   filter kategori `Semua | Kuliner | Kreator | Toko Online` (harus berfungsi),
   tiap kartu menampilkan harga satuan + `recommendedPackage`, section **harga 2
   paket** (data dari `GET /api/packages`, termasuk ETA & garansi), ajakan
   "Kustomisasi dengan AI" → `/customizer/[templateId]`.
2. `/customizer/[templateId]` — dual pane: form brief kiri, **live preview poster
   kanan** yang benar-benar merender draft (badge/headline/subheadline/CTA + 3 poin,
   rasio poster ± 4:5), badge engine `gemini`/`local` (jangan bohongi user),
   loading/error/retry. **Checkout memakai kartu paket dari `GET /api/packages`**
   — ETA + garansi tampil di sini sebelum tombol bayar. Submit `packageKey`.
3. `/orders` — lacak nomor `UK-ORD-XXXX` tanpa login; tampil ringkasan paket,
   sisa kuota (`remaining`), dan status.
4. `/orders/[id]` — stepper 5 tahap (`draft→paid→in_progress→review→completed`)
   dengan **timestamp dari `order_logs`**, blok **estimasi & garansi sesuai
   paket** (transparansi), daftar draft (kuota), **tombol "Minta Revisi"**
   (textarea → `POST .../revision`, tampil sukses + muncul di timeline), tombol
   **"Tambah brief poster"** (hanya bila `remaining > 0` → `POST .../briefs`),
   **notifikasi progres**: halaman polling `GET /api/orders/[id]` tiap ±15 detik
   dan memunculkan toast bila `status`/`updatedAt` berubah (jangan polling agresif —
   endpoint track kena rate limit 20/menit). Tombol Live URL / Unduh Source Code /
   Export Draft tetap seperti SPEC (aktif saat `completed`).
5. Loading/empty/error state tiap halaman, responsive 375px & 1280px, aksesibilitas
   (label `<label htmlFor>`, `aria-*` untuk tombol ikon, kontras WCAG AA).

## 7. Halaman back-office (Agent-UI-ADMIN — `frontend/src/app/admin/**` + `components/admin/**` + `middleware.ts`)

1. `/admin` — Kanban 4 kolom tetap (Backlog, In Progress, Need Review, Completed;
   backlog = `draft`+`paid`), pindah kartu via PATCH, jumlah per kolom, statistik.
   Kartu menampilkan paket + sisa kuota.
2. `/admin/orders/[id]` — brief asli + **payload JSON draft** (rapi), preview poster
   (boleh memakai ulang komponen preview milik shop), **daftar semua draft/brief**
   termasuk brief tambahan, **riwayat `order_logs` lengkap dengan entri `[REVISI]`
   dan `[BRIEF TAMBAHAN]`**, update status + catatan dev, form delivery
   (live URL, zip URL, catatan) → PUT delivery, tombol Export Clean Source Code.
3. Gate: cookie `admin_session` via `POST /api/admin/login`
   (`ADMIN_PASSWORD`, default `admin123`), middleware + cek di `frontend/middleware.ts`,
   halaman `/admin/login`. Cookie invalid dihapus saat redirect.

## 8. Palet & visual

Mengganti palet kertas-oranye CraftAI mengikuti slide Aether (navy + violet di
latar terang). Ubah token di `frontend/src/app/globals.css` (kedua mode):

| token | light | dark |
|---|---|---|
| `--paper` | `#f6f5fb` | `#121220` |
| `--surface` | `#ffffff` | `#1b1b2e` |
| `--ink` | `#16162e` | `#f2f1fb` |
| `--ink-soft` | `#5b5b7d` | `#a6a4c6` |
| `--rule` | `#e3e1f0` | `#2f2f4a` |
| `--accent` | `#7c3aed` | `#a78bfa` |
| `--accent-ink` | `#ffffff` | `#14142b` |
| `--ok`/`--warn`/`--danger` | `#1f6f4a`/`#8a5a00`/`#b3261e` | `#5fd3a0`/`#e8b54b`/`#ff8a7a` |

- Key localStorage tema diganti `aether-theme`, **dengan fallback baca
  `craftai-theme` lama** supaya preferensi user tidak hilang.
- Tipografi tetap Archivo / Instrument Serif / JetBrains Mono (lihat
  `design-system/craftai-studio/DESIGN.md`); efek `--shadow-press` dipertahankan.
- Gambar/aset lama bertema "CraftAI" jangan dipakai di UI baru.

## 9. SEO / metadata

`layout.tsx` metadata, `manifest.ts`, `sitemap.ts`, `robots.ts`, `not-found.tsx`,
judul halaman & `document.title` harus memakai "Aether Creative" + deskripsi
poster untuk UMKM. `NEXT_PUBLIC_SITE_URL` tetap.

## 10. Dokumen & pengujian

- `README.md` diupdate penuh ke Aether Creative (alur, harga, akun demo,
  cara menjalankan tetap dua terminal).
- `docs/SPEC.md` diberi blok di atas: kontrak terbaru ada di `docs/REDESIGN.md`,
  SPEC berlaku sejauh tidak bertentangan; perbaiki inkonsistensi lokasi DB
  (SELALU `backend/data/app.db`, bukan `frontend/data/app.db`).
- `docs/DEPLOY.md` hanya disentuh bila ada kata kunci brand yang menyesatkan.
- `PLAN.md` & `index.html`: **jangan diubah**.
- Uji di `frontend/tests/*.py` disesuaikan dengan kontrak baru (skema draft,
  harga, endpoint baru, teks brand). Perubahan tes harus bisa dipertanggung-
  jawabkan sebagai kontrak berubah — jangan melemahkan assertion supaya "lolos".
- Verifikasi wajib sebelum lapor: `cd frontend && npx tsc --noEmit && npx eslint src && npm run build`,
  backend `npx tsc`, lalu jalankan suite:
  `bash /home/rochwidias/.hermes/cache/scratch/verify-linux.sh all`
  (interpreter Python: `/home/rochwidias/.hermes/cache/scratch/venv-pw/bin/python`).

## 11. Pemilikan file (anti-tabrakan)

```
docs/REDESIGN.md, README.md, docs/SPEC.md, frontend/tests/**  -> parent/agent-dokumen
backend/**                                                     -> Agent-BACKEND
frontend/src/app/** (non-admin), frontend/src/components/shop/**
frontend/src/lib/**, frontend/src/app/globals.css, layout.tsx  -> Agent-UI-SHOP
frontend/src/app/admin/**, frontend/src/components/admin/**
frontend/middleware.ts                                        -> Agent-UI-ADMIN
```

- Agent lain boleh **membaca/mengimpor** file lintas folder (mis. admin memakai
  komponen preview milik shop) tetapi **tidak boleh mengeditnya**.
- `frontend/src/lib/api.ts` hanya boleh diedit Agent-UI-SHOP; agent admin cukup
  memanggil `fetch(API_BASE + path)` atau menambah helper di file miliknya sendiri.

## 12. Perbaikan hasil audit (wajib dikerjakan bersamaan dengan redesign)

Audit kode sebelumnya menemukan bug nyata di bawah ini. Tiap poin punya pemilik;
wajib dibereskan dan **diverifikasi ulang** (bukan hanya ditulis ulang).

**Agent-BACKEND**
- **Rate limit bisa dibypass via `X-Forwarded-For`** (`backend/src/lib/ratelimit.ts`
  `clientKey` memakai entri pertama XFF yang dikendalikan klien). Ganti ke `req.ip`
  (Express sudah menghitungnya sesuai `trust proxy`) — buktikan: 10 percobaan login
  salah dengan XFF unik tiap request tetap kena 429 pada percobaan ke-7.
- **`validateDraftSchema` tidak menerapkan pemotongan `MAX_TEXT`** ke objek yang
  disimpan (hasil `requireString` dibuang di call site). Buat normalisasi yang
  memakai hasil potongan, dan pakai hasilnya saat menyimpan draft.
- **`draftId` bisa dipakai ulang untuk checkout kedua** → order pertama kehilangan
  draft (`db.ts` `attachDraftToOrder` + `services/orders.ts`). Tolak dengan `400`
  bila draft sudah terpasang di order lain.
- **429 wajib mengirim `retryAfterSeconds` (JSON) + header `Retry-After`**
  (SPEC menagih ini, implementasi lama hanya menyelipkan detik di teks error).
- Fallback nomor order `UK-ORD-${Date.now().slice(-6)}` → pastikan 4 digit.
- `sanitizeText` ikut membuang `U+007F` dan `U+0080–U+009F`; terapkan juga pada
  URL delivery (`routes/delivery.ts`) sebelum divalidasi.
- Tambah `GET /api/admin/session` → `200 {ok:true}` bila cookie admin valid,
  `401 {error}` bila tidak (memakai `isAdminAuthenticated()` yang sama). Dipakai
  `frontend/middleware.ts` supaya verifikasi token terjadi di satu tempat.
- Bucket rate limit baru untuk `POST .../briefs` dan `POST .../revision`
  (mis. 10/menit per IP), didefinisikan di satu tempat seperti bucket lain.

**Agent-UI-SHOP**
- Katalog harus punya **state error** yang jujur (`TemplateCatalog.tsx` +
  `lib/catalog.ts` sekarang selalu jatuh ke `FALLBACK_TEMPLATES` tanpa memberi
  tahu user): saat fetch gagal tampilkan pesan + tombol "coba lagi"; fallback hanya
  untuk data awal yang belum pernah termuat.
- `/orders?number=UK-ORD-XXXX` harus langsung melakukan lookup otomatis
  (`OrdersClient.tsx` sekarang hanya mengisi input).
- `frontend/src/lib/api.ts` meng-export `API_BASE_SERVER` (untuk SSR di
  `sitemap.ts` dan `app/customizer/[templateId]/page.tsx` yang sekarang menduplikasi
  `API_BASE` sendiri) — kedua file itu menggunakannya kembali.

**Agent-UI-ADMIN**
- `frontend/middleware.ts` jangan lagi menghitung token dari
  `process.env.ADMIN_PASSWORD` di Vercel (bug: password custom di Render bikin
  `/admin` loop login). Ganti dengan panggil `GET ${BACKEND_ORIGIN}/api/admin/session`
  (`cache: "no-store"`); cookie invalid dihapus saat redirect, `/admin/login`
  selalu diizinkan. `docs/DEPLOY.md` disesuaikan: `ADMIN_PASSWORD` cukup di Render.
- `AdminOrderDetail.tsx` `COLUMN_META[column].label` crash untuk status tak
  dikenal → `columnOfStatus` wajib punya fallback `backlog`.
- Hilangkan hint "password demo `admin123`" di halaman login (menyesatkan di
  produksi); catatan akun demo tetap di README.