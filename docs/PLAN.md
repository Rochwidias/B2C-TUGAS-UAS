# PosterAI — Rencana Implementasi (B2C Marketplace Poster AI)

**Goal:** Membangun website B2C Next.js untuk menjual poster hasil AI yang di-finishing manusia: katalog → detail → cart → checkout → riwayat pesanan, plus custom order dan admin panel.

**Architecture:** Next.js App Router dengan Server Components untuk baca data dan Server Actions untuk semua mutasi. Data di SQLite lewat Prisma. Auth sendiri (cookie JWT httpOnly, password bcrypt) — tanpa dependency beta. Cart disimpan di `localStorage` (client), tapi harga & stok **selalu dihitung ulang di server** saat checkout.

**Tech Stack:** Next.js 15 (App Router, TypeScript), React 19, Tailwind CSS v4, shadcn/ui, Prisma 6 + SQLite, `jose` (JWT), `bcryptjs`, `zod` (validasi), Vitest (unit test).

**Spec:** dokumen ini (belum ada spec terpisah).

## Global Constraints

- Bahasa UI: **Indonesia**. Nama variabel/fungsi/tabel: **Inggris**.
- Mata uang: **IDR integer** (tanpa desimal). Semua uang disimpan sebagai `Int` rupiah.
- Password: minimal 8 karakter, di-hash `bcryptjs` cost 10. Tidak pernah dikirim balik ke client.
- Semua input user divalidasi dengan `zod` di sisi server action — client validation hanya bonus.
- Harga yang dikirim client **diabaikan**; server selalu ambil `Variant.price` dari DB.
- Route `/admin/*` hanya untuk `role === "ADMIN"`. Route `/account/*` wajib login.
- Gambar: file statis di `public/posters/`, upload admin ke `public/uploads/` (dev only, tanpa storage cloud).
- Setiap task diakhiri `npm run build` bersih + commit.
- Tidak ada payment gateway sungguhan. Checkout = status pesanan dibuat `PAID` langsung (simulasi).

## Review Focus

Hal-hal yang tidak akan ditangkap test "happy path" tapi paling mungkin bikin demo gagal:

1. **User mengubah harga/qty di devtools** → order tetap memakai harga DB, bukan harga kiriman client.
2. **Checkout saat stok 0 atau qty > stok** → tombol/order ditolak dengan pesan jelas, stok tidak jadi minus.
3. **User biasa buka `/admin` lewat URL langsung** → tamu diarahkan ke `/login`, user yang sudah login tapi bukan admin mendapat 404; bukan 500 dan tidak ada data yang bocor.
4. **Cart berisi poster yang sudah dihapus/di-nonaktifkan admin** → checkout menyaring item itu dan memberi tahu user, bukan crash.
5. **Dua tab checkout bersamaan / dobel klik tombol bayar** → tidak membuat 2 order dengan stok terpotong dua kali (pakai transaksi Prisma + idempotency lewat `orderNumber` unik).

---

## Struktur File yang Dituju

```
poster-marketplace/
├── app/
│   ├── layout.tsx, page.tsx                  # shell + homepage
│   ├── (shop)/
│   │   ├── products/page.tsx                 # katalog + searchParams filter
│   │   ├── products/[slug]/page.tsx          # detail + pilih varian
│   │   ├── cart/page.tsx                     # halaman keranjang penuh
│   │   ├── checkout/page.tsx
│   │   ├── checkout/success/[orderNumber]/page.tsx
│   │   ├── account/orders/page.tsx
│   │   ├── account/orders/[orderNumber]/page.tsx
│   │   ├── custom-order/page.tsx
│   │   ├── login/page.tsx, register/page.tsx
│   ├── admin/
│   │   ├── layout.tsx                        # guard requireAdmin()
│   │   ├── page.tsx                          # ringkasan penjualan
│   │   ├── products/{page,new/page,[id]/edit/page}.tsx
│   │   ├── orders/{page,[id]/page}.tsx
│   │   └── custom-orders/page.tsx
├── actions/
│   ├── auth.ts        # register, login, logout
│   ├── checkout.ts    # createOrder
│   ├── products.ts    # admin CRUD
│   ├── orders.ts      # admin update status
│   └── custom-orders.ts
├── components/
│   ├── ui/            # shadcn
│   ├── site-header.tsx, site-footer.tsx
│   ├── poster-card.tsx, variant-picker.tsx
│   ├── cart-provider.tsx, cart-drawer.tsx
├── lib/
│   ├── prisma.ts, auth.ts, session.ts
│   ├── pricing.ts, format.ts, slug.ts, constants.ts
│   └── validation.ts  # semua skema zod
├── prisma/schema.prisma, prisma/seed.ts
├── public/posters/*.jpg
└── tests/*.test.ts
```

**Pembagian kerja kelompok (3–4 orang):** Auth+DB (Task 1–3), Storefront: shell, katalog, cart, detail (Task 4–7), Checkout+Akun (Task 8–9), Admin+Custom Order (Task 10–12). Task 0 dikerjakan bersama.

---

### Task 0: Scaffold project

**Files:** `poster-marketplace/{package.json, next.config.ts, tsconfig.json, postcss.config.mjs, vitest.config.ts, .env, .env.example, .gitignore}`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm test` tersedia; alias import `@/*` → root project.

- [ ] **Step 1:** Di root, jalankan `npx create-next-app@latest poster-marketplace --ts --tailwind --app --eslint --src-dir=false --import-alias="@/*" --no-turbopack --yes`
- [ ] **Step 2:** Masuk folder, `npx shadcn@latest init -d` lalu tambah komponen dasar: `npx shadcn@latest add button card input label select textarea badge table dialog sonner`
- [ ] **Step 3:** Install deps: `npm i prisma @prisma/client jose bcryptjs zod` + `npm i -D vitest @vitejs/plugin-react tsx @types/bcryptjs`
- [ ] **Step 4:** Buat `vitest.config.ts` (environment `node`, include `tests/**/*.test.ts`) dan script `"test": "vitest run"`.
- [ ] **Step 5:** `.env` → `DATABASE_URL="file:./dev.db"`, `AUTH_SECRET="<openssl rand -base64 32>"`. Salin ke `.env.example` dengan `AUTH_SECRET="ganti-dengan-random"`.
- [ ] **Step 6:** Verifikasi: `npm run dev` menampilkan halaman default, `npm test` exit 0 (no test files → pakai `--passWithNoTests`).
- [ ] **Step 7:** Commit `chore: scaffold next.js project`.

---

### Task 1: Skema data + seed

**Files:** Create `prisma/schema.prisma`, `prisma/seed.ts`, `lib/prisma.ts`, `lib/constants.ts`; Modify `package.json` (script `db:seed`)

**Interfaces:**
- Produces: `prisma` (singleton `PrismaClient`), `SIZES`, `FRAMES`, `CATEGORIES`, `ORDER_STATUSES`, `CUSTOM_STATUSES` sebagai const array, dan tipe Prisma ter-generate.

```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         String   @default("USER")   // USER | ADMIN
  createdAt    DateTime @default(now())
  orders       Order[]
  customOrders CustomOrder[]
}

model Poster {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  description String
  aiPrompt    String?
  humanNote   String?            // bagian "dimodifikasi manusia"
  category    String
  imageUrl    String
  gallery     String    @default("[]")  // JSON array string
  basePrice   Int
  featured    Boolean   @default(false)
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  variants    Variant[]
  orderItems  OrderItem[]
}

model Variant {
  id       String @id @default(cuid())
  posterId String
  poster   Poster @relation(fields: [posterId], references: [id], onDelete: Cascade)
  size     String  // A4 | A3 | A2
  frame    String  // none | black | white
  price    Int
  stock    Int     @default(0)
  @@unique([posterId, size, frame])
}

model Order {
  id          String   @id @default(cuid())
  orderNumber String   @unique
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  status      String   @default("PAID")   // PENDING|PAID|PROCESSING|SHIPPED|COMPLETED|CANCELLED
  subtotal    Int
  shippingCost Int
  total       Int
  shipName    String
  shipPhone   String
  shipAddress String
  shipCity    String
  shipPostal  String
  shipNote    String?
  createdAt   DateTime @default(now())
  items       OrderItem[]
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  posterId  String
  poster    Poster  @relation(fields: [posterId], references: [id])
  title     String          // snapshot
  imageUrl  String          // snapshot
  size      String
  frame     String
  unitPrice Int
  quantity  Int
}

model CustomOrder {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  title       String
  brief       String
  style       String
  size        String
  referenceUrl String?
  budget      Int?
  status      String   @default("REQUESTED") // REQUESTED|QUOTED|IN_PROGRESS|REVIEW|COMPLETED|REJECTED
  quotedPrice Int?
  adminNote   String?
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 1:** Tulis schema di atas, `npx prisma migrate dev --name init`.
- [ ] **Step 2:** `lib/prisma.ts` → singleton dengan pola `globalThis` (hindari koneksi ganda saat hot reload).
- [ ] **Step 3:** `lib/constants.ts` → `export const SIZES = [{ id: "A4", label: "A4 — 21×30 cm", multiplier: 1 }, { id: "A3", label: "A3 — 30×42 cm", multiplier: 1.6 }, { id: "A2", label: "A2 — 42×59 cm", multiplier: 2.4 }] as const;` plus `FRAMES = [{ id: "none", label: "Tanpa Bingkai", extra: 0 }, { id: "black", label: "Bingkai Hitam", extra: 45000 }, { id: "white", label: "Bingkai Putih", extra: 45000 }]` dan `CATEGORIES = ["cyberpunk","minimalis","retro","alam","abstrak","tipografi"]`.
- [ ] **Step 4:** `prisma/seed.ts`: 1 admin (`admin@posterai.id` / `admin12345`), 1 demo user (`demo@posterai.id` / `demo12345`), 12 poster terisi (judul, deskripsi, `aiPrompt`, `humanNote` — jelaskan proses manusia merapikan warna/detail), masing-masing 9 varian (3 size × 3 frame) dengan harga `basePrice × multiplier + frame.extra` dan stok acak 5–30.
- [ ] **Step 5:** Tambah `"prisma": { "seed": "tsx prisma/seed.ts" }` dan script `db:seed`. Jalankan `npx prisma db seed`.
- [ ] **Step 6:** Verifikasi dengan `npx prisma studio`: tabel Poster = 12, Variant = 108, User = 2.

---

### Task 2: Logika harga & format (pure functions)

**Files:** Create `lib/pricing.ts`, `lib/format.ts`, `lib/slug.ts`, `tests/pricing.test.ts`

**Interfaces:**
- Produces:
  - `formatIDR(n: number): string` → `"Rp 125.000"`
  - `slugify(input: string): string`
  - `calcShipping(subtotal: number): number` → gratis di atas Rp 250.000, selain itu Rp 20.000
  - `calcTotals(items: { unitPrice: number; quantity: number }[]): { subtotal: number; shippingCost: number; total: number }`
  - `orderNumber(date = new Date()): string` → `"PS-20261029-4F2A"` (prefix PS, tanggal, 4 hex acak)

- [ ] **Step 1: Tulis test yang gagal**

```ts
// tests/pricing.test.ts
expect(formatIDR(125000)).toBe("Rp 125.000");
expect(calcShipping(249999)).toBe(20000);
expect(calcShipping(250000)).toBe(0);
expect(calcTotals([{ unitPrice: 100000, quantity: 2 }])).toEqual({ subtotal: 200000, shippingCost: 20000, total: 220000 });
expect(calcTotals([])).toEqual({ subtotal: 0, shippingCost: 0, total: 0 });
expect(orderNumber(new Date("2026-10-29"))).toMatch(/^PS-20261029-[0-9A-F]{4}$/);
expect(slugify("Cyberpunk Sunset ✦ A3")).toBe("cyberpunk-sunset-a3");
```

- [ ] **Step 2:** `npx vitest run tests/pricing.test.ts` → gagal (modul belum ada).
- [ ] **Step 3:** Implementasikan keempat fungsi. `formatIDR` pakai `new Intl.NumberFormat("id-ID")` lalu prefix `"Rp "`.
- [ ] **Step 4:** `npx vitest run` → PASS.
- [ ] **Step 5:** Commit `feat: pricing and formatting helpers`.

---

### Task 3: Auth (register, login, logout, session)

**Files:** Create `lib/auth.ts`, `lib/session.ts`, `lib/validation.ts`, `actions/auth.ts`, `app/(shop)/login/page.tsx`, `app/(shop)/register/page.tsx`, `tests/auth.test.ts`

**Interfaces:**
- Produces:
  - `hashPassword(pw: string): Promise<string>`, `verifyPassword(pw: string, hash: string): Promise<boolean>`
  - `getSession(): Promise<SessionUser | null>` di mana `SessionUser = { id: string; name: string; email: string; role: "USER" | "ADMIN" }`
  - `requireUser(): Promise<SessionUser>` → `redirect("/login")` bila kosong
  - `requireAdmin(): Promise<SessionUser>` → `redirect("/login")` bila belum login, `notFound()` bila role bukan ADMIN
  - `createSession(user: SessionUser): Promise<void>`, `destroySession(): Promise<void>`
  - Server actions: `registerAction(prevState, formData)`, `loginAction(prevState, formData)`, `logoutAction()`, semuanya `{ error?: string }`
- Konsumsi: `prisma`, `slugify` tidak dipakai di sini.

- [ ] **Step 1:** Test: `hashPassword` menghasilkan string berbeda tiap panggilan, `verifyPassword` true untuk password benar & false untuk salah.
- [ ] **Step 2:** Implementasi `lib/auth.ts` (bcryptjs cost 10).
- [ ] **Step 3:** `lib/session.ts` — `jose` `SignJWT` HS256, payload `{ sub, name, email, role }`, exp 7 hari, cookie `session` (`httpOnly`, `sameSite: "lax"`, `secure` di production, `path: "/"`). `getSession()` verifikasi + ambil ulang user dari DB (bukan percaya role di token).
- [ ] **Step 4:** `lib/validation.ts` → `registerSchema` (name min 2, email, password min 8, confirmPassword harus sama) dan `loginSchema`.
- [ ] **Step 5:** `actions/auth.ts` — register menolak email duplikat dengan pesan "Email sudah terdaftar"; login salah → "Email atau password salah" (jangan bedakan keduanya).
- [ ] **Step 6:** Halaman login & register: form `useActionState`, tampilkan error, link silang. Setelah login sukses → `redirect("/")` (admin → `/admin`).
- [ ] **Step 7:** `npx vitest run` PASS + verifikasi manual: register → logout → login.
- [ ] **Step 8:** Commit `feat: cookie-based authentication`.

---

### Task 4: App shell, header, homepage, PosterCard

**Files:** Create `components/site-header.tsx`, `components/site-footer.tsx`, `components/poster-card.tsx`, `app/layout.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: `getSession()`, `formatIDR`.
- Produces: `PosterCard({ poster: { slug, title, imageUrl, basePrice, category } })` — dipakai katalog, homepage, dan admin preview.

- [ ] **Step 1:** `layout.tsx` — font Inter, `<SiteHeader/>`, `<main>`, `<SiteFooter/>`, `<Toaster/>`. (Provider cart ditambahkan di Task 6.)
- [ ] **Step 2:** `site-header.tsx` — logo "PosterAI", nav: Katalog / Custom Order / (Pesanan Saya kalau login) / Keranjang / tombol Admin bila role ADMIN / Login-Register atau Logout. Badge jumlah keranjang dan tombol Logout disambungkan ke `useCart()` (Task 6) dan `logoutAction` (Task 3); untuk sementara render tombol keranjang tanpa badge.
- [ ] **Step 3:** `poster-card.tsx` — gambar rasio 3:4 (`next/image`, `object-cover`), badge kategori, judul, harga mulai dari varian termurah (`"Mulai Rp ..."`), hover zoom halus.
- [ ] **Step 4:** Homepage: hero (headline + CTA ke `/products`), strip "Bagaimana kami bekerja" 3 langkah (AI generate → kurasi & finishing manusia → cetak & kirim), grid 4 poster `featured`, section CTA custom order.
- [ ] **Step 5:** Verifikasi: `npm run build` bersih; homepage tampil tanpa error.
- [ ] **Step 6:** Commit `feat: app shell and homepage`.

---

### Task 5: Katalog dengan filter, pencarian, sorting

**Files:** Create `app/(shop)/products/page.tsx`, `components/product-filters.tsx`

**Interfaces:**
- Consumes: `prisma`, `CATEGORIES`, `PosterCard`.
- Produces: halaman `/products?q=&category=&sort=&page=`. `sort` ∈ `terbaru | termurah | termahal`.

- [ ] **Step 1:** Server Component membaca `searchParams` (`Promise<...>` di Next 15), query `prisma.poster.findMany` dengan `where: { active: true, ...(category && { category }), ...(q && { OR: [{title:{contains:q}}, {description:{contains:q}}] }) }`, `include: { variants: { select: { price: true } } }`.
- [ ] **Step 2:** Sorting dihitung dari `min(variants.price)` — karena sorting per-varian tidak bisa langsung di Prisma, ambil semua lalu sort di memori (data kecil) dan paginate 9 per halaman.
- [ ] **Step 3:** `product-filters.tsx` — client component, tombol kategori + input search + select sort, menulis ke URL via `useRouter` + `useSearchParams` (debounce 300ms untuk search).
- [ ] **Step 4:** Empty state: "Tidak ada poster yang cocok. Coba kata kunci lain." + tombol reset filter.
- [ ] **Step 5:** Verifikasi manual: filter `cyberpunk` + sort `termurah` → urutan benar; halaman 2 pagination jalan.
- [ ] **Step 6:** Commit `feat: product catalog with filters`.

---

### Task 6: Cart (context + halaman)

**Files:** Create `lib/cart.ts`, `components/cart-provider.tsx`, `components/cart-drawer.tsx`, `app/(shop)/cart/page.tsx`, `tests/cart.test.ts`; Modify `app/layout.tsx`, `components/site-header.tsx`

**Files:** Create `lib/cart.ts`, `components/cart-provider.tsx`, `components/cart-drawer.tsx`, `app/(shop)/cart/page.tsx`, `tests/cart.test.ts`

**Interfaces:**
- Produces:
  - `type CartItem = { variantId: string; posterId: string; slug: string; title: string; imageUrl: string; size: string; frame: string; unitPrice: number; quantity: number; stock: number }`
  - `cartReducer(state: CartItem[], action: CartAction): CartItem[]` dengan action `add | remove | setQty | clear`
  - `useCart(): { items, addItem, removeItem, setQty, clear, count }`
  - Persist key `localStorage["posterai-cart"]`, versi key `v1`.

- [ ] **Step 1:** Test reducer: `add` pada `variantId` sama menambah quantity (bukan baris baru); `setQty` di-clamp antara 1 dan `stock`; `setQty(0)` menghapus baris; `remove` menghapus.
- [ ] **Step 2:** Implement `cartReducer` di `lib/cart.ts` (pure, tanpa React).
- [ ] **Step 3:** `cart-provider.tsx` — `useReducer` + hydrate dari localStorage di `useEffect`, simpan tiap perubahan. Tangani JSON rusak dengan fallback `[]`.
- [ ] **Step 4:** Bungkus `app/layout.tsx` dengan `<CartProvider>` dan sambungkan badge jumlah di `site-header.tsx`.
- [ ] **Step 5:** `cart/page.tsx` — daftar item (gambar, varian, qty stepper, subtotal per baris), ringkasan kanan (`calcTotals`), tombol "Lanjut ke Checkout"; kosong → CTA ke katalog.
- [ ] **Step 6:** `cart-drawer.tsx` — Sheet shadcn berisi ringkasan + tombol lihat keranjang. Dipakai header.
- [ ] **Step 7:** `npx vitest run` PASS; verifikasi badge header ikut berubah.
- [ ] **Step 8:** Commit `feat: client-side cart`.

---

### Task 7: Detail produk + pemilih varian

**Files:** Create `app/(shop)/products/[slug]/page.tsx`, `components/variant-picker.tsx`, `components/add-to-cart-button.tsx`

**Interfaces:**
- Consumes: `prisma`, `formatIDR`, `SIZES`, `FRAMES`, `SIZES[i].multiplier`, `FRAMES[i].extra`, `useCart()` dari Task 6.
- Produces: `VariantPicker({ poster, variants })` yang mengelola pilihan size+frame dan mengembalikan `variant` terpilih; `AddToCartButton` menerima `{ variant: { id, price, stock, size, frame }, poster: { id, slug, title, imageUrl } , qty: number }`.

- [ ] **Step 1:** Halaman: `notFound()` bila poster tidak ada atau `active === false`.
- [ ] **Step 2:** Layout 2 kolom: kiri gambar besar + thumbnail `gallery`; kanan judul, kategori, harga varian terpilih, stok, pilihan size (disable kombinasi stok 0), pilihan frame, stepper qty (max = stok), tombol "Tambah ke Keranjang".
- [ ] **Step 3:** Bagian "Di balik poster ini": tampilkan `aiPrompt` dalam blok monospace dan `humanNote` sebagai paragraf — ini pembeda konsep tugas.
- [ ] **Step 4:** Verifikasi: pilih A2 + bingkai → harga naik sesuai multiplier + extra; qty tidak bisa lewat stok.
- [ ] **Step 5:** Commit `feat: product detail with variant selection`.

---

### Task 8: Checkout + pembuatan order (inti keamanan harga)

**Files:** Create `app/(shop)/checkout/page.tsx`, `app/(shop)/checkout/success/[orderNumber]/page.tsx`, `actions/checkout.ts`, `lib/validation.ts` (tambah `checkoutSchema`), `tests/checkout.test.ts`

**Interfaces:**
- Consumes: `prisma`, `calcTotals`, `formatIDR`, `getSession`.
- Produces: `createOrder(input: CheckoutInput): Promise<{ ok: true; orderNumber: string } | { ok: false; error: string }>` dengan

```ts
type CheckoutInput = {
  items: { variantId: string; quantity: number }[];   // TANPA harga
  shipName: string; shipPhone: string; shipAddress: string;
  shipCity: string; shipPostal: string; shipNote?: string;
};
```

- [ ] **Step 1:** Buat helper `tests/helpers/db.ts` (DB test terpisah `file:./test.db`, `prisma db push` di `beforeAll`, `resetDb()` pembersih tabel) — dipakai ulang di Task 12. Test: (a) harga order = harga DB walaupun client mengirim harga lain; (b) qty melebihi stok → `{ ok: false }` dan stok tidak berubah; (c) varian yang sudah tidak ada → `{ ok: false, error: "..." }`; (d) order sukses mengurangi stok tepat sebesar qty.
- [ ] **Step 2:** `npx vitest run tests/checkout.test.ts` → gagal.
- [ ] **Step 3:** Implement `createOrder` di dalam `prisma.$transaction`: ambil semua varian via `findMany({ where: { id: { in } }, include: { poster: true } })`, tolak bila ada yang hilang/`poster.active === false`, cek stok, hitung `unitPrice` dari DB, `calcTotals`, buat `orderNumber` unik, `order.create` dengan `items.create` snapshot, lalu `variant.update` decrement stok. `userId` diisi bila ada session (guest boleh checkout).
- [ ] **Step 4:** `checkout/page.tsx` — form alamat (zod), ringkasan pesanan dari cart client, tombol "Bayar (Simulasi)" memakai `useTransition` untuk cegah dobel klik; sukses → `clear()` cart + `router.push("/checkout/success/<orderNumber>")`.
- [ ] **Step 5:** Halaman sukses: nomor pesanan, ringkasan, instruksi "simulasi pembayaran berhasil", link ke riwayat pesanan.
- [ ] **Step 6:** Test PASS + verifikasi manual: stok di Prisma Studio turun setelah checkout.
- [ ] **Step 7:** Commit `feat: checkout with server-side price validation`.

---

### Task 9: Akun — riwayat & detail pesanan

**Files:** Create `app/(shop)/account/orders/page.tsx`, `app/(shop)/account/orders/[orderNumber]/page.tsx`

**Interfaces:** Consumes `requireUser()`, `prisma`, `formatIDR`, `ORDER_STATUSES`.

- [ ] **Step 1:** Daftar pesanan milik user (`where: { userId: session.id }`), urut terbaru, badge status berwarna, total, tanggal.
- [ ] **Step 2:** Detail pesanan: `findFirst({ where: { orderNumber, userId: session.id } })` → `notFound()` bila bukan miliknya. Tampilkan item, alamat, rincian biaya, timeline status.
- [ ] **Step 3:** Guest yang checkout tanpa login tidak punya riwayat — halaman sukses tetap menampilkan link "Simpan nomor pesanan Anda".
- [ ] **Step 4:** Verifikasi: user A tidak bisa membuka order user B lewat URL.
- [ ] **Step 5:** Commit `feat: customer order history`.

---

### Task 10: Custom order (user + admin)

**Files:** Create `app/(shop)/custom-order/page.tsx`, `actions/custom-orders.ts`, `app/admin/custom-orders/page.tsx`, `components/custom-order-status-form.tsx`

**Interfaces:**
- Produces: `createCustomOrderAction(prevState, formData)`, `updateCustomOrderAction(id, { status, quotedPrice, adminNote })`.
- Consumes: `requireUser()`, `requireAdmin()`, `CUSTOM_STATUSES`.

- [ ] **Step 1:** Form: judul, brief (min 20 karakter), style (select dari `CATEGORIES`), size, URL referensi (opsional, harus URL valid), budget (opsional, angka).
- [ ] **Step 2:** Server action validasi zod + `userId` dari session; sukses → toast + reset form. Di halaman yang sama tampilkan daftar request milik user beserta status & harga penawaran.
- [ ] **Step 3:** Halaman admin: tabel semua request (user, judul, style, budget, status, tanggal), dialog untuk ubah status + isi `quotedPrice` + `adminNote`.
- [ ] **Step 4:** Verifikasi: submit request → muncul di admin → admin set `QUOTED` + harga → user melihat harga barunya.
- [ ] **Step 5:** Commit `feat: custom poster order flow`.

---

### Task 11: Admin — CRUD produk + upload gambar

**Files:** Create `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/products/page.tsx`, `app/admin/products/new/page.tsx`, `app/admin/products/[id]/edit/page.tsx`, `actions/products.ts`, `components/poster-form.tsx`

**Interfaces:**
- Produces: `createPosterAction`, `updatePosterAction`, `deletePosterAction` (soft delete: `active = false`), `uploadImageAction(formData): Promise<{ url: string }>`.
- Consumes: `requireAdmin()`, `slugify`, `SIZES`, `FRAMES`, `CATEGORIES`.

- [ ] **Step 1:** `app/admin/layout.tsx` — `await requireAdmin()` di top level, sidebar nav (Dashboard, Produk, Pesanan, Custom Order).
- [ ] **Step 2:** `poster-form.tsx` dipakai new & edit: judul, deskripsi, `aiPrompt`, `humanNote`, kategori, harga dasar, `featured`, upload gambar (preview), dan grid 9 varian (size × frame) berisi input harga + stok.
- [ ] **Step 3:** `actions/products.ts` — slug otomatis dari judul, tambah suffix `-2`, `-3` bila bentrok; simpan varian lewat `create`/`upsert` berdasarkan `@@unique([posterId, size, frame])`; revalidate path `/products`, `/admin/products`, `/products/[slug]`.
- [ ] **Step 4:** `uploadImageAction` — validasi tipe (`image/jpeg|png|webp`) dan ukuran ≤ 2MB, tulis ke `public/uploads/<cuid>.<ext>` via `fs/promises`.
- [ ] **Step 5:** Tabel produk: thumbnail, judul, kategori, harga mulai, total stok, toggle aktif, tombol Edit/Hapus (dialog konfirmasi).
- [ ] **Step 6:** `app/admin/page.tsx` — 4 kartu ringkasan: total pesanan, pendapatan (`sum total` status bukan CANCELLED), produk aktif, custom order menunggu.
- [ ] **Step 7:** Verifikasi: buat poster baru → muncul di katalog; hapus → hilang dari katalog tapi riwayat order lama tetap utuh.
- [ ] **Step 8:** Commit `feat: admin product management`.

---

### Task 12: Admin — manajemen pesanan

**Files:** Create `app/admin/orders/page.tsx`, `app/admin/orders/[id]/page.tsx`, `actions/orders.ts`, `components/order-status-select.tsx`, `tests/cancel-order.test.ts`

**Interfaces:** Produces `updateOrderStatusAction(orderId, status)`; Consumes `requireAdmin()`, `ORDER_STATUSES`, helper `tests/helpers/db.ts` dari Task 8.

- [ ] **Step 1:** Tabel pesanan: nomor, tanggal, nama pembeli, jumlah item, total, status; filter status via `searchParams`.
- [ ] **Step 2:** Detail: data pengiriman, item, rincian biaya, select status (client component → server action + `revalidatePath`).
- [ ] **Step 3:** Bila status diubah ke `CANCELLED`, kembalikan stok tiap item di dalam transaksi (jangan dua kali bila sudah cancelled).
- [ ] **Step 4:** Test di `tests/cancel-order.test.ts`: memanggil `updateOrderStatusAction(orderId, "CANCELLED")` dua kali membuat stok kembali bertambah tepat satu kali.
- [ ] **Step 5:** Commit `feat: admin order management`.

---

### Task 13: Polish, seed gambar, README & demo script

**Files:** Modify `README.md`, `.env.example`; Create `docs/DEMO.md`

- [ ] **Step 1:** Siapkan 12 gambar poster rasio 3:4 di `public/posters/` (boleh placeholder gradient + judul, atau gambar AI milik sendiri) dan pastikan path di seed cocok.
- [ ] **Step 2:** `README.md` — deskripsi konsep bisnis, stack, cara install (`npm i` → `.env` → `npx prisma migrate dev` → `npx prisma db seed` → `npm run dev`), akun demo, struktur folder, screenshot.
- [ ] **Step 3:** `docs/DEMO.md` — urutan demo 5 menit untuk presentasi: login admin → tambah produk → logout → belanja sebagai user → checkout → cek riwayat → login admin ubah status → kirim custom order.
- [ ] **Step 4:** Jalankan `npm run build` + `npm test` terakhir, pastikan keduanya hijau.
- [ ] **Step 5:** Commit `docs: readme and demo guide`.

---

## Definition of Done

- `npm run build` dan `npm test` hijau.
- Alur penuh jalan: katalog → detail → cart → checkout → stok berkurang → riwayat pesanan.
- Admin bisa CRUD produk, ubah status pesanan (stok kembali saat cancel), dan mengelola custom order.
- User biasa tidak bisa mengakses `/admin` maupun pesanan user lain.
- Harga dihitung ulang server: mengubah harga di localStorage tidak mengubah total order.
