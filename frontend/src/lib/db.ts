// Lapisan database memakai node:sqlite bawaan Node 26 (tanpa dependency).
// File DB dibuat otomatis saat pertama kali diakses; schema + seed sesuai SPEC.

import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { generateLocalDraft } from './ai';
import type { AIDraft, Draft, DraftBrief, Order, OrderLog, OrderStatus, PaymentStatus, Template } from './types';

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
  'contact_name', 'contact_whatsapp', 'contact_email', 'package_name',
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
  input_prompt_data: parseJson<DraftBrief>(row.input_prompt_data, {} as DraftBrief),
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

const SEED_TEMPLATES: Template[] = [
  {
    id: 'artisan-cafe',
    name: 'Artisan Cafe & Resto',
    category: 'fnb',
    description: 'Cocok untuk kedai kopi, bistro, atau rumah makan modern lengkap dengan menu catalog dan booking meja.',
    emoji: '☕',
    base_price: 250000,
    preview_gradient: 'linear-gradient(to top right, rgba(146,64,14,0.4), rgba(69,26,3,0.4))',
    is_active: 1,
  },
  {
    id: 'creative-portfolio',
    name: 'Modern Creative Portfolio',
    category: 'portfolio',
    description: 'Template showcase karya desainer, fotografer, software engineer, atau konsultan digital.',
    emoji: '💼',
    base_price: 300000,
    preview_gradient: 'linear-gradient(to top right, rgba(30,64,175,0.4), rgba(30,27,75,0.4))',
    is_active: 1,
  },
  {
    id: 'dtc-store',
    name: 'Direct-to-Consumer Store',
    category: 'shop',
    description: 'Landing page produk unggulan dengan integrasi checkout WhatsApp otomatis.',
    emoji: '🛍️',
    base_price: 350000,
    preview_gradient: 'linear-gradient(to top right, rgba(6,78,59,0.4), rgba(19,78,74,0.4))',
    is_active: 1,
  },
];

const SEED_ORDER_NUMBER = 'UK-ORD-8812';

// Brief demo dipakai ulang oleh generator lokal, jadi isi draft demo selalu
// konsisten dengan brief yang tersimpan di DB.
const SEED_BRIEF: DraftBrief = {
  templateId: 'artisan-cafe',
  brandName: 'Kopi Senja Utama',
  tagline: 'Rasa Otentik Kopi Nusantara di Jantung Kota',
  description:
    'Kami menyajikan biji kopi single origin roast medium-dark dengan suasana nyaman untuk nugas dan santai. Buka tiap hari 08.00 - 23.00.',
  themeColor: 'indigo',
  ctaText: 'Pesan Meja Sekarang',
  toneOfVoice: 'santai',
};

type Db = InstanceType<typeof DatabaseSync>;

let handle: Db | null = null;

function openDb(): Db {
  if (handle) return handle;
  // Path dihitung dari cwd frontend/ supaya tetap benar di dev, build, dan
  // `next start` (dev bisa saja dijalankan dari repo root).
  const dataDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'app.db');
  mkdirSync(dataDir, { recursive: true });
  const db: Db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA_SQL);
  // Seed idempoten per tabel: template dan order demo tidak saling bergantung,
  // sehingga seed yang pernah gagal setengah jalan tidak menghilangkan
  // order demo UK-ORD-8812 selamanya.
  if (countOf(db, 'templates') === 0) seedTemplates(db);
  if (countOf(db, 'orders') === 0) seedDemoOrder(db);
  handle = db;
  return db;
}

function countOf(db: Db, table: 'templates' | 'orders'): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as Row | undefined;
  return Number(row?.n ?? 0);
}

function seedTemplates(db: Db): void {
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

function seedDemoOrder(db: Db): void {
  // Draft demo dirender oleh generator lokal supaya contoh tidak membusuk
  // kalau isi generator berubah.
  const draftContent = generateLocalDraft(SEED_BRIEF);
  const draftId = randomUUID();
  const orderId = randomUUID();
  const timestamp = nowIso();

  // Satu transaksi: order lahir duluan supaya FK ai_drafts.order_id tidak
  // menunjuk baris yang belum ada, dan seed gagal separuh tidak meninggalkan
  // order tanpa draft (guard countOf di openDb akan melewatkan seed permanen).
  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO orders (${ORDER_COLUMNS.join(', ')}) VALUES (${ORDER_COLUMNS.map(() => '?').join(', ')})`,
    ).run(
      orderId, SEED_ORDER_NUMBER, SEED_BRIEF.templateId, 'in_progress', 'paid', 250000,
      'Rangga Pratama', '081234567890', 'rangga@example.com', 'Pro',
      null, null,
      'Struktur konten sudah final, tinggal polest CSS dan optimasi gambar.',
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
    ).run(randomUUID(), orderId, 'paid', 'in_progress', 'Developer mulai mengerjakan customisasi template.', timestamp);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

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

export function attachDraftToOrder(draftId: string, orderId: string): void {
  getDb().prepare('UPDATE ai_drafts SET order_id = ? WHERE id = ?').run(orderId, draftId);
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
  return `UK-ORD-${String(1000 + Number(row.n)).slice(-4)}`;
}

export interface CreateOrderInput {
  draftId: string;
  templateId: string;
  packageName: string;
  contactName: string;
  contactWhatsapp: string;
  contactEmail: string;
}

export function createOrder(input: CreateOrderInput): { order: Order; draft: AIDraft | null; logs: OrderLog[] } {
  const db = getDb();
  const orderNumber = nextOrderNumber(db);
  const timestamp = nowIso();
  const order: Order = {
    id: randomUUID(),
    order_number: orderNumber,
    template_id: input.templateId,
    status: 'paid',
    payment_status: 'paid',
    total_price: readPackagePrices()[input.packageName] ?? 0,
    contact_name: input.contactName,
    contact_whatsapp: input.contactWhatsapp,
    contact_email: input.contactEmail,
    package_name: input.packageName,
    live_website_url: null,
    download_zip_url: null,
    dev_note: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  db.prepare(`INSERT INTO orders (${ORDER_COLUMNS.join(', ')}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    order.id, order.order_number, order.template_id, order.status, order.payment_status, order.total_price,
    order.contact_name, order.contact_whatsapp, order.contact_email, order.package_name,
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
  insertLog(id, order.status, order.status, 'Delivery dikirim: live URL & source code diunggah.');
  return getOrder(id);
}

export function readPackagePrices(): Record<string, number> {
  // Harga paket dibaca dari .env bila ada override; default mengikuti PLAN §3.1.
  const parse = (value: string | undefined, fallback: number): number => {
    const digits = (value ?? '').replace(/[^0-9]/g, '');
    return digits ? Number(digits) : fallback;
  };
  return {
    Basic: parse(process.env.PACKAGE_BASIC_PRICE, 150000),
    Pro: parse(process.env.PACKAGE_PRO_PRICE, 250000),
    Premium: parse(process.env.PACKAGE_PREMIUM_PRICE, 350000),
  };
}