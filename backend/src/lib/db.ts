// Lapisan database memakai node:sqlite bawaan Node 26 (tanpa dependency).
// File DB dibuat otomatis saat pertama kali diakses; skema + seed + migrasi
// idempoten mengikuti docs/REDESIGN.md §3 (aman untuk DB lama CraftAI & DB kosong).

import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { generateLocalDraft, normalizeBrief } from './ai';
import { findPackage, PACKAGES } from './packages';
import type { AIDraft, Draft, DraftBrief, Order, OrderLog, OrderStatus, PackageOption, PaymentStatus, Template } from '../types';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  base_price INTEGER NOT NULL,
  preview_gradient TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  template_id TEXT NOT NULL REFERENCES templates(id),
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  total_price INTEGER NOT NULL,
  contact_name TEXT NOT NULL,
  contact_whatsapp TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_key TEXT,
  quota INTEGER NOT NULL DEFAULT 1,
  live_website_url TEXT,
  download_zip_url TEXT,
  dev_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_drafts (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  template_id TEXT NOT NULL,
  input_prompt_data TEXT NOT NULL,
  ai_generated_content TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_logs (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  status_from TEXT,
  status_to TEXT NOT NULL,
  developer_note TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_drafts_order ON ai_drafts(order_id);
CREATE INDEX IF NOT EXISTS idx_logs_order ON order_logs(order_id);
`;

// Nama kolom urut sesuai tabel agar pemetaan row -> object bisa eksplisit.
const TEMPLATE_COLUMNS = ['id', 'name', 'category', 'description', 'emoji', 'base_price', 'preview_gradient', 'is_active'];
const ORDER_COLUMNS = [
  'id', 'order_number', 'template_id', 'status', 'payment_status', 'total_price',
  'contact_name', 'contact_whatsapp', 'contact_email', 'package_name', 'package_key', 'quota',
  'live_website_url', 'download_zip_url', 'dev_note', 'created_at', 'updated_at',
];
const DRAFT_COLUMNS = ['id', 'order_id', 'template_id', 'input_prompt_data', 'ai_generated_content', 'generated_at'];
const LOG_COLUMNS = ['id', 'order_id', 'status_from', 'status_to', 'developer_note', 'timestamp'];

type Row = Record<string, unknown>;

function pick<T>(row: Row | undefined, columns: readonly string[], parse: (row: Row) => T): T | null {
  if (!row) return null;
  const out: Row = {};
  for (const column of columns) out[column] = row[column];
  return parse(out);
}

const mapTemplate = (row: Row): Template => ({
  id: String(row.id),
  name: String(row.name),
  category: String(row.category),
  description: String(row.description),
  emoji: String(row.emoji),
  base_price: Number(row.base_price),
  preview_gradient: String(row.preview_gradient),
  is_active: Number(row.is_active),
});

const mapOrder = (row: Row): Order => ({
  id: String(row.id),
  order_number: String(row.order_number),
  template_id: String(row.template_id),
  status: row.status as OrderStatus,
  payment_status: row.payment_status as PaymentStatus,
  total_price: Number(row.total_price),
  contact_name: String(row.contact_name),
  contact_whatsapp: String(row.contact_whatsapp),
  contact_email: String(row.contact_email),
  package_name: String(row.package_name),
  package_key: row.package_key === null || row.package_key === undefined ? null : String(row.package_key),
  quota: Number(row.quota ?? 1),
  live_website_url: row.live_website_url === null ? null : String(row.live_website_url),
  download_zip_url: row.download_zip_url === null ? null : String(row.download_zip_url),
  dev_note: row.dev_note === null ? null : String(row.dev_note),
  created_at: String(row.created_at),
  updated_at: String(row.updated_at),
});

const parseJson = <T>(raw: unknown, fallback: T): T => {
  if (typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const mapDraft = (row: Row): AIDraft => ({
  id: String(row.id),
  order_id: row.order_id === null ? null : String(row.order_id),
  template_id: String(row.template_id),
  input_prompt_data: parseJson<DraftBrief>(row.input_prompt_data, normalizeBrief(null)),
  ai_generated_content: parseJson<Draft>(row.ai_generated_content, {} as Draft),
  generated_at: String(row.generated_at),
});

const mapLog = (row: Row): OrderLog => ({
  id: String(row.id),
  order_id: String(row.order_id),
  status_from: row.status_from === null ? null : String(row.status_from),
  status_to: String(row.status_to),
  developer_note: row.developer_note === null ? null : String(row.developer_note),
  timestamp: String(row.timestamp),
});

const nowIso = (): string => new Date().toISOString();

// ---------------------------------------------------------------------------
// Seed poster per segmen (docs/REDESIGN.md §3) — base_price 50.000 semua.
// ID template dipertahankan dari seed CraftAI supaya FK order lama
// (termasuk UK-ORD-8812) tidak menggantung setelah migrasi.
// ---------------------------------------------------------------------------

const SEED_TEMPLATES: Template[] = [
  {
    id: 'artisan-cafe',
    name: 'Poster Promo Kuliner',
    category: 'kuliner',
    description: 'Poster promo kedai kopi, rumah makan, dan jajanan — menonjolkan menu andalan, jam buka, dan tombol pesan WhatsApp.',
    emoji: '☕',
    base_price: 50000,
    preview_gradient: 'linear-gradient(to top right, rgba(139,92,246,0.4), rgba(109,40,217,0.4))',
    is_active: 1,
  },
  {
    id: 'creative-portfolio',
    name: 'Poster Kreator & Portofolio',
    category: 'kreator',
    description: 'Poster pengumuman jasa dan karya kreator digital — cocok untuk promosi layanan, open slot, dan pameran portofolio.',
    emoji: '💼',
    base_price: 50000,
    preview_gradient: 'linear-gradient(to top right, rgba(59,75,216,0.4), rgba(39,53,168,0.4))',
    is_active: 1,
  },
  {
    id: 'dtc-store',
    name: 'Poster Toko Online',
    category: 'toko',
    description: 'Poster diskon dan peluncuran produk toko online — menonjolkan produk unggulan, pengiriman, dan konfirmasi order kilat.',
    emoji: '🛍️',
    base_price: 50000,
    preview_gradient: 'linear-gradient(to top right, rgba(245,158,11,0.4), rgba(180,83,9,0.4))',
    is_active: 1,
  },
];

const SEED_ORDER_NUMBER = 'UK-ORD-8812';
const DEMO_PACKAGE_KEY = 'hemat';

// Brief demo dipakai ulang oleh generator lokal, jadi isi draft demo selalu
// konsisten dengan brief yang tersimpan di DB.
const SEED_BRIEF: DraftBrief = {
  templateId: 'artisan-cafe',
  brandName: 'Kopi Senja Utama',
  tagline: 'Rasa Otentik Kopi Nusantara di Jantung Kota',
  description:
    'Kami menyajikan biji kopi single origin roast medium-dark dengan suasana nyaman untuk nugas dan santai. Buka tiap hari 08.00 - 23.00.',
  themeColor: 'violet',
  ctaText: 'Pesan Meja Sekarang',
  toneOfVoice: 'santai',
};

type Db = InstanceType<typeof DatabaseSync>;

let handle: Db | null = null;

function openDb(): Db {
  if (handle) return handle;
  // Path dihitung dari cwd supaya tetap benar di dev, build, dan `next start`.
  // Di Render, DB_DIR menunjuk disk persistent (/var/data) agar data selamat redeploy.
  const dataDir = process.env.DB_DIR ?? path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'app.db');
  mkdirSync(dataDir, { recursive: true });
  const db: Db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA_SQL);
  // Migrasi idempoten untuk database lama CraftAI (kolom baru + isi seed baru).
  migrate(db);
  handle = db;
  return db;
}

// ---------------------------------------------------------------------------
// Migrasi idempoten
// ---------------------------------------------------------------------------

/** Tambah kolom baru tanpa menyentuh data lama; aman dijalankan berulang kali. */
function ensureColumn(db: Db, table: 'orders', column: string, ddl: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Row[];
  if (columns.some((col) => col.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}

function migrate(db: Db): void {
  // §3: package_key ('satuan'|'hemat') & quota (1|3) dibuat via ALTER TABLE.
  ensureColumn(db, 'orders', 'package_key', 'package_key TEXT');
  ensureColumn(db, 'orders', 'quota', 'quota INTEGER NOT NULL DEFAULT 1');

  if (countOf(db, 'templates') === 0) insertSeedTemplates(db);
  else upsertSeedTemplates(db);

  migrateLegacyOrders(db);
  migrateLegacyDrafts(db);
  ensureDemoOrder(db);
}

function countOf(db: Db, table: 'templates' | 'orders'): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as Row | undefined;
  return Number(row?.n ?? 0);
}

function insertSeedTemplates(db: Db): void {
  const insertTemplate = db.prepare(
    `INSERT INTO templates (${TEMPLATE_COLUMNS.join(', ')}) VALUES (${TEMPLATE_COLUMNS.map(() => '?').join(', ')})`,
  );
  for (const template of SEED_TEMPLATES) {
    insertTemplate.run(
      template.id, template.name, template.category, template.description, template.emoji,
      template.base_price, template.preview_gradient, template.is_active,
    );
  }
}

/** DB lama berisi seed CraftAI (250/300/350rb) → ditimpa jadi seed poster. */
function upsertSeedTemplates(db: Db): void {
  const update = db.prepare(
    'UPDATE templates SET name = ?, category = ?, description = ?, emoji = ?, base_price = ?, preview_gradient = ?, is_active = ? WHERE id = ?',
  );
  const insert = db.prepare(
    `INSERT INTO templates (${TEMPLATE_COLUMNS.join(', ')}) VALUES (${TEMPLATE_COLUMNS.map(() => '?').join(', ')})`,
  );
  for (const template of SEED_TEMPLATES) {
    const changed = update.run(
      template.name, template.category, template.description, template.emoji,
      template.base_price, template.preview_gradient, template.is_active, template.id,
    );
    if (Number(changed.changes ?? 0) === 0) {
      insert.run(
        template.id, template.name, template.category, template.description, template.emoji,
        template.base_price, template.preview_gradient, template.is_active,
      );
    }
  }
}

/**
 * Order lama (package CraftAI Basic/Pro/Premium) dipetakan ke paket §2
 * berdasarkan harga yang pernah dibayar: ≤150rb → satuan, selain itu → hemat.
 * `total_price` tidak diubah (itu riwayat pembayaran), hanya label + kuota,
 * supaya UI bisa selalu menemukan ETA & garansi dari GET /api/packages.
 */
function migrateLegacyOrders(db: Db): void {
  const rows = db.prepare('SELECT id, package_name, package_key, quota, total_price FROM orders').all() as Row[];
  const update = db.prepare(
    'UPDATE orders SET package_name = ?, package_key = ?, quota = ? WHERE id = ?',
  );
  const fill = db.prepare('UPDATE orders SET package_key = ?, quota = ? WHERE id = ?');
  for (const row of rows) {
    const name = String(row.package_name ?? '');
    const known = PACKAGES.find((pkg) => pkg.name === name);
    if (known) {
      if (row.package_key === null || row.package_key === undefined || Number(row.quota ?? 0) !== known.quota) {
        fill.run(known.key, known.quota, String(row.id));
      }
      continue;
    }
    const key = Number(row.total_price) <= 150000 ? 'satuan' : 'hemat';
    const pkg = findPackage(key);
    if (!pkg) continue;
    update.run(pkg.name, pkg.key, pkg.quota, String(row.id));
  }
}

/**
 * Draft lama memakai skema website (`heroSection`/`features`/`faq`). Skema §4
 * menggantikannya, jadi isi draft di-regenerate dari brief tersimpan agar
 * halaman customer/admin tidak pernah menerima bentuk data yang sudah dihapus.
 */
function migrateLegacyDrafts(db: Db): void {
  const rows = db.prepare('SELECT id, input_prompt_data FROM ai_drafts').all() as Row[];
  const update = db.prepare('UPDATE ai_drafts SET ai_generated_content = ? WHERE id = ?');
  for (const row of rows) {
    let content: unknown;
    try {
      content = JSON.parse(String(row.input_prompt_data));
    } catch {
      content = null;
    }
    const brief = normalizeBrief(content);
    const raw = db.prepare('SELECT ai_generated_content FROM ai_drafts WHERE id = ?').get(String(row.id)) as Row | undefined;
    const current = parseJson<Record<string, unknown>>(raw?.ai_generated_content, {});
    if (current && typeof current.poster === 'object' && Array.isArray(current.points)) continue;
    const regenerated = generateLocalDraft(brief);
    update.run(JSON.stringify(regenerated), String(row.id));
  }
}

/** Order demo UK-ORD-8812: dibuat bila belum ada, diselaraskan bila sudah ada. */
function ensureDemoOrder(db: Db): void {
  const existing = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(SEED_ORDER_NUMBER) as Row | undefined;
  const pkg = findPackage(DEMO_PACKAGE_KEY)!;
  const timestamp = nowIso();

  if (!existing) {
    seedDemoOrder(db, pkg, timestamp);
    return;
  }

  // Selaraskan paket & pastikan draft demo memakai skema poster (§3/§4).
  db.prepare('UPDATE orders SET package_name = ?, package_key = ?, quota = ?, total_price = ?, template_id = ? WHERE id = ?')
    .run(pkg.name, pkg.key, pkg.quota, pkg.price, SEED_BRIEF.templateId, String(existing.id));

  const drafts = db.prepare('SELECT id, ai_generated_content FROM ai_drafts WHERE order_id = ?')
    .all(String(existing.id)) as Row[];
  const hasPosterDraft = drafts.some((row) => {
    const content = parseJson<Record<string, unknown>>(row.ai_generated_content, {});
    return Boolean(content.poster) && Array.isArray(content.points);
  });
  if (!hasPosterDraft) {
    // Draft lama demo dibuang: skema website sudah tidak ada di kontrak baru.
    db.prepare('DELETE FROM ai_drafts WHERE order_id = ?').run(String(existing.id));
    db.prepare(
      'INSERT INTO ai_drafts (id, order_id, template_id, input_prompt_data, ai_generated_content, generated_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(randomUUID(), String(existing.id), SEED_BRIEF.templateId, JSON.stringify(SEED_BRIEF), JSON.stringify(generateLocalDraft(SEED_BRIEF)), timestamp);
    db.prepare('INSERT INTO order_logs (id, order_id, status_from, status_to, developer_note, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), String(existing.id), 'in_progress', 'in_progress', '[BRIEF TAMBAHAN] Draft demo dimuat ulang dengan skema poster terbaru.', timestamp);
  }

  // Order demo baru dibuat dari seed (bukan dari request), jadi dijamin punya log.
  const logCount = db.prepare('SELECT COUNT(*) AS n FROM order_logs WHERE order_id = ?').get(String(existing.id)) as Row;
  if (Number(logCount.n ?? 0) === 0) {
    db.prepare('INSERT INTO order_logs (id, order_id, status_from, status_to, developer_note, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), String(existing.id), 'draft', 'paid', 'Pembayaran mock diterima, order masuk antrean developer.', timestamp);
    db.prepare('INSERT INTO order_logs (id, order_id, status_from, status_to, developer_note, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), String(existing.id), 'paid', 'in_progress', 'Developer mulai mengerjakan poster.', timestamp);
  }
}

function seedDemoOrder(db: Db, pkg: PackageOption, timestamp: string): void {
  // Draft demo dirender oleh generator lokal supaya contoh tidak membusuk
  // kalau isi generator berubah.
  const draftContent = generateLocalDraft(SEED_BRIEF);
  const draftId = randomUUID();
  const orderId = randomUUID();

  // Satu transaksi: order lahir duluan supaya FK ai_drafts.order_id tidak
  // menunjuk baris yang belum ada, dan seed gagal separuh tidak meninggalkan
  // order tanpa draft (guard countOf di openDb akan melewatkan seed permanen).
  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO orders (${ORDER_COLUMNS.join(', ')}) VALUES (${ORDER_COLUMNS.map(() => '?').join(', ')})`,
    ).run(
      orderId, SEED_ORDER_NUMBER, SEED_BRIEF.templateId, 'in_progress', 'paid', pkg.price,
      'Rangga Pratama', '081234567890', 'rangga@example.com', pkg.name, pkg.key, pkg.quota,
      null, null,
      'Struktur konten poster sudah final, tinggal poles warna dan optimasi gambar.',
      timestamp, timestamp,
    );

    db.prepare(
      'INSERT INTO ai_drafts (id, order_id, template_id, input_prompt_data, ai_generated_content, generated_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(draftId, orderId, SEED_BRIEF.templateId, JSON.stringify(SEED_BRIEF), JSON.stringify(draftContent), timestamp);

    db.prepare(
      'INSERT INTO order_logs (id, order_id, status_from, status_to, developer_note, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(randomUUID(), orderId, 'draft', 'paid', 'Pembayaran mock diterima, order masuk antrean developer.', timestamp);
    db.prepare(
      'INSERT INTO order_logs (id, order_id, status_from, status_to, developer_note, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(randomUUID(), orderId, 'paid', 'in_progress', 'Developer mulai mengerjakan poster.', timestamp);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Query publik
// ---------------------------------------------------------------------------

export function getDb(): Db {
  return openDb();
}

export function listTemplates(): Template[] {
  const rows = getDb().prepare('SELECT * FROM templates WHERE is_active = 1 ORDER BY base_price ASC').all() as Row[];
  return rows.map((row) => pick<Template>(row, TEMPLATE_COLUMNS, mapTemplate)!).filter(Boolean);
}

export function getTemplate(id: string): Template | null {
  const row = getDb().prepare('SELECT * FROM templates WHERE id = ?').get(id) as Row | undefined;
  return pick<Template>(row, TEMPLATE_COLUMNS, mapTemplate);
}

export function insertDraft(templateId: string, brief: DraftBrief, content: Draft): AIDraft {
  const draft: AIDraft = {
    id: randomUUID(),
    order_id: null,
    template_id: templateId,
    input_prompt_data: brief,
    ai_generated_content: content,
    generated_at: nowIso(),
  };
  getDb()
    .prepare('INSERT INTO ai_drafts (id, order_id, template_id, input_prompt_data, ai_generated_content, generated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(draft.id, null, templateId, JSON.stringify(brief), JSON.stringify(content), draft.generated_at);
  return draft;
}

export function getDraft(id: string): AIDraft | null {
  const row = getDb().prepare('SELECT * FROM ai_drafts WHERE id = ?').get(id) as Row | undefined;
  return pick<AIDraft>(row, DRAFT_COLUMNS, mapDraft);
}

export function getDraftByOrderId(orderId: string): AIDraft | null {
  const row = getDb()
    .prepare('SELECT * FROM ai_drafts WHERE order_id = ? ORDER BY generated_at DESC LIMIT 1')
    .get(orderId) as Row | undefined;
  return pick<AIDraft>(row, DRAFT_COLUMNS, mapDraft);
}

/** Semua draft milik satu order — penting untuk kuota Paket Hemat (§5). */
export function listDraftsByOrderId(orderId: string): AIDraft[] {
  const rows = getDb()
    .prepare('SELECT * FROM ai_drafts WHERE order_id = ? ORDER BY generated_at ASC, rowid ASC')
    .all(orderId) as Row[];
  return rows.map((row) => pick<AIDraft>(row, DRAFT_COLUMNS, mapDraft)!).filter(Boolean);
}

export function countDrafts(orderId: string): number {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM ai_drafts WHERE order_id = ?').get(orderId) as Row | undefined;
  return Number(row?.n ?? 0);
}

/** `remaining` = quota - jumlah draft (§3); tanpa kolom counter tambahan. */
export function remainingQuota(order: Order): number {
  return Math.max(0, order.quota - countDrafts(order.id));
}

/**
 * Tempel draft ke order; hanya bila draft belum terpasang di order mana pun.
 * Return `false` bila draft sudah dipakai order lain (audit §12) — checkout
 * kedua tidak boleh menghapus draft dari order pertama.
 */
export function attachDraftToOrder(draftId: string, orderId: string): boolean {
  const result = getDb()
    .prepare('UPDATE ai_drafts SET order_id = ? WHERE id = ? AND order_id IS NULL')
    .run(orderId, draftId);
  return Number(result.changes ?? 0) > 0;
}

function nextOrderNumber(db: Db): string {
  // Kolom memakai UNIQUE, jadi tabrakan dicegah oleh DB; loop mencari angka
  // kosong di rentang 1000-9999 agar format selalu UK-ORD-4digit.
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = `UK-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const clash = db.prepare('SELECT 1 FROM orders WHERE order_number = ?').get(candidate);
    if (!clash) return candidate;
  }
  const row = db.prepare('SELECT COUNT(*) AS n FROM orders').get() as Row;
  return `UK-ORD-${String(1000 + Number(row.n)).slice(-4).padStart(4, '0')}`;
}

/**
 * Cari nomor order yang belum terpakai, dengan retry saat DB menolak karena
 * UNIQUE. Tanpa retry, dua order yang lahir di milidetik yang sama membuat
 * salah satunya gagal dengan 500.
 */
function nextOrderNumberSafe(db: Db): string {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = nextOrderNumber(db);
    const clash = db.prepare('SELECT 1 FROM orders WHERE order_number = ?').get(candidate);
    if (!clash) return candidate;
  }
  // Jalan terakhir: sufiks 4 digit dari waktu — format UK-ORD-XXXX tetap utuh
  // (audit §12: `Date.now().slice(-6)` menghasilkan 6 digit).
  return `UK-ORD-${String(Date.now() % 10000).padStart(4, '0')}`;
}

export interface CreateOrderInput {
  draftId: string;
  templateId: string;
  packageKey: string;
  contactName: string;
  contactWhatsapp: string;
  contactEmail: string;
}

export function createOrder(input: CreateOrderInput): { order: Order; draft: AIDraft | null; logs: OrderLog[] } {
  const db = getDb();
  // Paket adalah satu-satunya sumber harga & kuota (§2); service sudah
  // memvalidasi key, di sini tetap ada guard agar harga tidak pernah 0 diam-diam.
  const pkg = findPackage(input.packageKey) ?? PACKAGES[0];
  const orderNumber = nextOrderNumberSafe(db);
  const timestamp = nowIso();
  const order: Order = {
    id: randomUUID(),
    order_number: orderNumber,
    template_id: input.templateId,
    status: 'paid',
    payment_status: 'paid',
    total_price: pkg.price,
    contact_name: input.contactName,
    contact_whatsapp: input.contactWhatsapp,
    contact_email: input.contactEmail,
    package_name: pkg.name,
    package_key: pkg.key,
    quota: pkg.quota,
    live_website_url: null,
    download_zip_url: null,
    dev_note: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  db.prepare(`INSERT INTO orders (${ORDER_COLUMNS.join(', ')}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    order.id, order.order_number, order.template_id, order.status, order.payment_status, order.total_price,
    order.contact_name, order.contact_whatsapp, order.contact_email, order.package_name, order.package_key, order.quota,
    order.live_website_url, order.download_zip_url, order.dev_note, order.created_at, order.updated_at,
  );
  attachDraftToOrder(input.draftId, order.id);
  insertLog(order.id, 'draft', 'paid', 'Pembayaran mock (simulasi) diterima otomatis oleh sistem.');

  return { order, draft: getDraft(input.draftId), logs: listLogs(order.id) };
}

export function insertLog(orderId: string, statusFrom: string | null, statusTo: string, developerNote: string | null): OrderLog {
  const log: OrderLog = {
    id: randomUUID(),
    order_id: orderId,
    status_from: statusFrom,
    status_to: statusTo,
    developer_note: developerNote,
    timestamp: nowIso(),
  };
  getDb()
    .prepare('INSERT INTO order_logs (id, order_id, status_from, status_to, developer_note, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
    .run(log.id, log.order_id, log.status_from, log.status_to, log.developer_note, log.timestamp);
  return log;
}

export function getOrder(id: string): Order | null {
  const row = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as Row | undefined;
  return pick<Order>(row, ORDER_COLUMNS, mapOrder);
}

export function getOrderByNumber(number: string): Order | null {
  const row = getDb().prepare('SELECT * FROM orders WHERE order_number = ?').get(number.trim().toUpperCase()) as Row | undefined;
  return pick<Order>(row, ORDER_COLUMNS, mapOrder);
}

export function listOrders(): Order[] {
  const rows = getDb().prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as Row[];
  return rows.map((row) => pick<Order>(row, ORDER_COLUMNS, mapOrder)!).filter(Boolean);
}

export function listLogs(orderId: string): OrderLog[] {
  const rows = getDb().prepare('SELECT * FROM order_logs WHERE order_id = ? ORDER BY timestamp ASC, rowid ASC').all(orderId) as Row[];
  return rows.map((row) => pick<OrderLog>(row, LOG_COLUMNS, mapLog)!).filter(Boolean);
}

/** Sentuh `updated_at` tanpa mengubah status — dipakai brief/revisi (§5). */
export function touchOrder(id: string): Order | null {
  getDb().prepare('UPDATE orders SET updated_at = ? WHERE id = ?').run(nowIso(), id);
  return getOrder(id);
}

export function updateOrder(id: string, patch: { status?: OrderStatus; devNote?: string }): Order | null {
  const order = getOrder(id);
  if (!order) return null;
  const status = patch.status ?? order.status;
  const devNote = patch.devNote ?? order.dev_note;
  const timestamp = nowIso();
  getDb()
    .prepare('UPDATE orders SET status = ?, dev_note = ?, updated_at = ? WHERE id = ?')
    .run(status, devNote, timestamp, id);
  if (status !== order.status) insertLog(id, order.status, status, patch.devNote ?? null);
  else if (patch.devNote !== undefined) insertLog(id, status, status, patch.devNote);
  return getOrder(id);
}

export function updateDelivery(
  id: string,
  input: { liveWebsiteUrl: string; downloadZipUrl: string; devNote: string },
): Order | null {
  const order = getOrder(id);
  if (!order) return null;
  const timestamp = nowIso();
  getDb()
    .prepare('UPDATE orders SET live_website_url = ?, download_zip_url = ?, dev_note = ?, updated_at = ? WHERE id = ?')
    .run(input.liveWebsiteUrl, input.downloadZipUrl, input.devNote, timestamp, id);
  insertLog(id, order.status, order.status, 'Delivery dikirim: live URL & poster diunggah.');
  return getOrder(id);
}