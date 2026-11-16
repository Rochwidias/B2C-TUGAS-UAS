# CraftAI Studio — Backend

API Express + `node:sqlite` untuk layanan kustomisasi template website
berbantuan AI. Semua endpoint `/api/*` hidup di sini, port **4000**.

Stack: **Express 4 + node:sqlite (built-in Node)**, AI lewat REST Gemini dengan
fallback generator lokal deterministik.

## Menjalankan

```bash
cd backend
npm install
npm start              # produksi, :4000 (butuh npm run build dulu)
npm run dev            # tsx watch, pengembangan
```

Konfigurasi lewat environment (contoh `.env`):

| Var | Isi |
|---|---|
| `PORT` | port API (default 4000) |
| `ADMIN_PASSWORD` | password back-office (default `admin123`) |
| `GEMINI_API_KEY` | opsional; kosong = generator lokal |
| `FRONTEND_ORIGIN` | origin frontend tambahan untuk CORS |
| `PACKAGE_BASIC_PRICE` dst | harga paket (default 150000/250000/350000) |

## Struktur

```
src/
  index.ts             server HTTP: CORS, cookie, security headers, mount routes
  types.ts             kontrak domain (Order, Template, Draft, OrderLog)
  routes/
    templates.ts       GET  /api/templates
    drafts.ts          POST /api/drafts
    orders.ts          POST /api/orders · GET /api/orders?number=
                       GET|PATCH /api/orders/:id
    delivery.ts        PUT  /api/orders/:id/delivery
    admin.ts           POST /api/admin/login · GET /api/admin/orders|stats
    export.ts          GET  /api/export/:draftId (HTML attachment)
  services/
    orders.ts          logika checkout & lacak order
    stats.ts           agregat statistik admin
  lib/                 db, ai, render, validate, security, ratelimit, http
  middleware/          adminAuth (verifikasi token sesi)
data/app.db            sqlite, auto-create + seed saat pertama diakses
```

## Keamanan

- Gate admin di setiap route tulis (`PATCH /api/orders/:id`,
  `PUT /api/orders/:id/delivery`, `/api/admin/*`) — 401 tanpa sesi valid.
- Rate limit per IP: login 6/15 menit, draft AI 8/5 menit, checkout 5/10 menit,
  lacak order 20/menit, tulis admin 60/menit (429 + sisa detik).
- Batas panjang input terpusat di `src/lib/security.ts`; WhatsApp dinormalkan
  ke `08xx`; nomor order unik dengan retry saat tabrakan.
- Security headers + `X-Powered-By` dihapus; CORS hanya origin frontend.

Kontrak API lengkap: [`../docs/SPEC.md`](../docs/SPEC.md).