# Kontrak: Ubah alur ke WhatsApp + buang AI (2026-11-25)

Keputusan pemilik proyek:

1. **AI dibuang total.** Tidak ada generator draft (Gemini maupun generator
   lokal). Konten poster disusun **editor manusia** lewat back-office.
2. **Pesan & serah terima poster lewat WhatsApp.** Tombol checkout web diganti
   jadi pesanan yang tercatat di web + link `wa.me` terisi; serah terima /
   konfirmasi / revisi berjalan di chat WhatsApp.
3. Eksekusi: 3 subagent paralel (backend, UI, dokumen+test), parent mengerjakan
   commit & push.

## Kontrak API (semua pihak wajib mengikuti ini)

### Dihapus
- `POST /api/drafts` beserta seluruh engine: `backend/src/lib/ai.ts`,
  GeminiClient, `src/lib/draft.ts`, rate-limit bucket `drafts`.
- Tipe `AIEngine` / field `engine` di respons draft, badge `EngineBadge`
  (`gemini`/`local`) di `frontend/src/components/shop/*`.
- Endpoint `GET /api/admin/session` dipertahankan (dipakai middleware).

### Baru
- `GET /api/contact` → `{ whatsappNumber, whatsappUrl, whatsappSupportUrl }`
  dari env `WHATSAPP_NUMBER` (default placeholder `6281234567890`, wajib
  didokumentasikan di README + DEPLOY sebagai variabel yang harus diganti).
  `whatsappUrl` = `https://wa.me/<number>`; `whatsappSupportUrl` =
  `https://wa.me/<number>?text=<pesan serah terima umum>`.
- `POST /api/orders` (tanpa `draftId`) → body:
  `{ templateId, packageKey, brief: {merekLokasi, segmenTarget, suasanaMerek, aksiUtama, nadaRekaman}, contact: {name, whatsapp, email?} }`
  → respons `{ data: { order: {...}, whatsappUrl: string } }` di mana
  `whatsappUrl` sudah terisi pesan berisi **nomor order, nama paket, ETA,
  dan brief**. Order dibuat status `draft`, `ai_draft_id = NULL`.
  Rate limit: bucket `customerWrite`.
- `PUT /api/admin/orders/:id/poster` (admin-only, wajib pakai `requireAdmin`)
  → body `{ content: PosterDraft }`, `engine` kolom diisi `'manual'`
  (check constraint yang sudah ada: `manual|gemini|local`), plus
  `revisi` tidak disentuh. Memicu audit-log `poster.edited`.
  Setelah simpan, status order bisa dinaikkan lewat endpoint status yang
  sudah ada.

### Dipertahankan apa adanya
- `POST /api/orders/:id/briefs`, `POST /api/orders/:id/revision`,
  `GET /api/packages`, lookup, admin CRUD, export HTML, throttle polling 15 dtk,
  batas teks 240/140/60/40 (kini jadi input editor manusia, tetap divalidasi).

## Alur baru (shop)
1. `/customizer/[templateId]` — isikan brief + kontak (form yang sudah ada,
   tanpa tombol "Generate").
2. Klik **"Kirim Pesanan via WhatsApp"** → `POST /api/orders` → tampil nomor
   order + dua tombol: **"Buka WhatsApp"** (wa.me terisi, dari respons) dan
   **"Cek Status Pesanan"** (ke `/orders?number=...`).
3. `/orders` — lookup otomatis + polling + tombol **"Chat via WhatsApp"**
   (dari `GET /api/contact`) di tiap tahap; revisi tetap di web, link WA ikut
   tampil sebagai jalur utama.

## Alur baru (admin)
- `AdminOrderDetail` mendapat **Editor Konten Poster**: form field yang sama
  dengan dulu (badge, headline, subheadline, CTA, 3 poin, warna, contrast)
  disimpan via `PUT /api/admin/orders/:id/poster`, lalu preview memakai
  komponen preview poster yang ada. Tombol "Chat ke Customer" (wa.me ke
  `contact_whatsapp` order) di header detail.
- Kanban/status/delivery tidak berubah perilakunya.

## Pembagian kerja (jangan tabrakan)
| Subagent | Milik eksklusif |
|---|---|
| backend | `backend/**` |
| UI | `frontend/src/**`, `frontend/middleware.ts` |
| dokumen+test | `docs/**`, `README.md`, `frontend/tests/**` |
| parent | commit & push |

Aturan paralel: **tidak ada `git commit`/`git push`** dari subagent; hanya
subagent dokumen yang boleh menjalankan server (port 4000 backend / 4000
frontend sesuai `.env.test`), dua subagent lain cukup typecheck/lint/build.
Tidak mengubah file di luar kolomnya. Bila kontrak terasa mustahil, catat di
hasil akhir, jangan menyimpang diam-diam.

## Verifikasi wajib sebelum selesai
- backend: `npx tsc --noEmit` (atau `npm run build`) 0 error.
- frontend: `npx tsc --noEmit` 0 error, `npx eslint src` 0 error,
  `npm run build` sukses.
- dokumen+test: `python3 -m pytest frontend/tests/test_api.py
  frontend/tests/test_security.py` (pakai server sendiri) — atau laporkan
  alasan gagal apa adanya.