"""E2E alur customer + admin Aether Creative — FRONTEND-ONLY (tanpa backend).

Kontrak: docs/FRONTEND-ONLY.md. Backend dan database sudah dihapus; semua
data pesanan ada di localStorage['aether-orders'] via orders-store.ts, jadi
suite ini menjalankan server Next.js lokal SAJA (tanpa fixture backend):

    cd frontend && PORT=3720 npx next dev -p 3720
    BASE_URL=http://localhost:3720 pytest tests/test_e2e.py

Skenario minimum:
  (a) beranda menampilkan katalog 3 kartu poster + 2 kartu paket;
  (b) alur customizer membuat pesanan -> nomor berpola UK-ORD-\\d{4};
  (c) /orders?number=UK-ORD-8812 auto-lookup menampilkan pesanan demo;
  (d) /admin/login password admin123 -> masuk kanban, pesanan demo tampil;
  (e) ubah status pesanan dari kanban -> kartu pindah kolom.
"""
import os
import re
import tempfile
import time

import pytest
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:3720").rstrip("/")
SHOT_DIR = os.environ.get("SHOT_DIR", os.path.join(tempfile.gettempdir(), "aether-shots"))
os.makedirs(SHOT_DIR, exist_ok=True)

# Nomor pesanan demo yang di-seed orders-store.ensureDemoOrder().
DEMO_NUMBER = "UK-ORD-8812"

# State lintas tes dalam satu modul (dijalankan berurutan oleh pytest).
STATE = {}


def shot(page, name):
    try:
        page.screenshot(path=os.path.join(SHOT_DIR, name), full_page=True)
    except Exception:  # noqa: BLE001 — screenshot tidak boleh menjatuhkan tes
        pass


def poll_until(fn, timeout_s=12.0, interval=0.5):
    """Panggil fn() sampai True (atau nilai terakhir saat waktu habis)."""
    deadline = time.time() + timeout_s
    last = None
    while time.time() < deadline:
        last = fn()
        if last is True:
            return True
        time.sleep(interval)
    return last


def column_contains(page, label, needle):
    """True/False bila teks `needle` ada di kolom kanban berjudul `label`;
    None bila judul kolom tidak ditemukan (struktur berubah)."""
    return page.evaluate(
        """([label, needle]) => {
            const h2 = [...document.querySelectorAll('h2')].find(
                (h) => (h.textContent || '').trim() === label);
            if (!h2) return null;
            const root = h2.closest('section') || h2.closest('[aria-labelledby]')
                || h2.parentElement;
            if (!root) return null;
            return (root.textContent || '').includes(needle);
        }""",
        [label, needle],
    )


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        yield b
        b.close()


@pytest.fixture()
def page(browser):
    """Konteks baru per tes: localStorage bersih, pesanan demo di-seed ulang."""
    context = browser.new_context(viewport={"width": 1280, "height": 900})
    pg = context.new_page()
    pg.set_default_timeout(45000)
    yield pg
    context.close()


@pytest.fixture(scope="module")
def admin_page(browser):
    """Konteks terpisah untuk tes admin; dipakai bersama login + pindah status."""
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    pg = context.new_page()
    pg.set_default_timeout(45000)
    yield pg
    context.close()


def test_01_home_katalog_3_poster_2_paket(page):
    """(a) Beranda menampilkan 3 kartu poster dan 2 kartu paket."""
    page.goto(f"{BASE}/", wait_until="domcontentloaded")
    grid = page.wait_for_selector("[data-testid='template-grid']", state="attached")
    assert grid is not None, "grid katalog (template-grid) tidak ditemukan"

    cards = page.locator("[data-testid='template-grid'] article")
    count = cards.count() or page.locator("[data-testid='template-grid'] > *").count()
    assert count == 3, f"katalog poster harus 3 kartu, dapat {count}"

    pkg = page.wait_for_selector("[data-testid='package-list']", state="attached")
    assert pkg is not None, "daftar paket (package-list) tidak ditemukan"
    pkg_count = page.locator("[data-testid='package-list'] li").count() or page.locator(
        "[data-testid='package-list'] > *"
    ).count()
    assert pkg_count == 2, f"kartu paket harus 2, dapat {pkg_count}"

    body = page.evaluate("() => document.body.innerText")
    assert "Satuan" in body and "Hemat" in body, f"nama paket tidak tampak: {body[:160]}"
    assert "Poster Promo Kuliner" in body, "kartu poster pertama tidak tampak"
    shot(page, "e2e-01-home.png")


def test_02_customizer_membuat_pesanan_uk_ord(page):
    """(b) Alur customizer membuat pesanan -> nomor berpola UK-ORD-\\d{4}."""
    page.goto(f"{BASE}/customizer/artisan-cafe", wait_until="domcontentloaded")
    page.wait_for_selector("#brief-brand", state="visible")

    page.fill("#brief-brand", "Warung Uji Playwright")
    page.fill("#brief-tagline", "Rasa rumahan, harga kantong mahasiswa")
    page.fill("#brief-desc", "Warung uji untuk suite E2E — buka setiap hari sampai jam 22.00.")
    cta = page.locator("#brief-cta")
    if cta.count():
        cta.fill("Pesan via WhatsApp")
    for sel in ("#brief-color", "#brief-tone"):
        loc = page.locator(sel)
        if loc.count():
            try:
                loc.select_option(index=1)
            except Exception:  # noqa: BLE001 — opsi bisa berbeda
                pass

    page.fill("#contact-name", "Pak Uji")
    page.fill("#contact-wa", "08111222333")
    mail = page.locator("#contact-email")
    if mail.count():
        mail.fill("uji@example.com")
    shot(page, "e2e-02-customizer-terisi.png")

    submit = page.locator("button:has-text('Kirim Pesanan via WhatsApp')").first
    assert submit.count() > 0, "tombol 'Kirim Pesanan via WhatsApp' tidak ditemukan"
    assert submit.is_enabled(), "tombol kirim masih disabled setelah brief diisi"
    submit.click()

    created = page.wait_for_selector("[data-testid='order-created']", state="visible")
    assert created is not None, "konfirmasi pesanan (order-created) tidak muncul"
    text = created.inner_text()
    match = re.search(r"UK-ORD-\d{4}", text)
    assert match, f"nomor pesanan tidak berpola UK-ORD-XXXX: {text[:200]}"
    STATE["order_number"] = match.group(0)

    wa_links = page.locator("[data-testid='order-created'] a[href*='wa.me']")
    assert wa_links.count() > 0, "tidak ada link wa.me di konfirmasi pesanan"
    shot(page, "e2e-03-pesanan-tercatat.png")


def test_03_orders_auto_lookup_pesanan_demo(page):
    """(c) /orders?number=UK-ORD-8812 auto-lookup menampilkan pesanan demo."""
    page.goto(f"{BASE}/orders?number={DEMO_NUMBER}", wait_until="domcontentloaded")
    result = page.wait_for_selector("[data-testid='track-result']", state="visible")
    assert result is not None, "hasil lacak (track-result) tidak tampil setelah auto-lookup"
    text = result.inner_text()
    assert DEMO_NUMBER in text, f"nomor demo {DEMO_NUMBER} tidak tampak: {text[:200]}"
    assert "UK-ORD-8812" in page.url, f"URL tidak menyimpan nomor: {page.url}"
    shot(page, "e2e-04-lacak-demo.png")


def test_04_admin_login_masuk_kanban(admin_page):
    """(d) Login admin123 di /admin/login -> kanban dengan pesanan demo.

    Redirect gate /admin tanpa cookie diuji terpisah di test_features
    (test_07); tes ini fokus pada alur login + kanban sesuai skenario (d).
    """
    # Seed pesanan demo di konteks admin ini lewat halaman lacak (store kosong).
    admin_page.goto(f"{BASE}/orders?number={DEMO_NUMBER}", wait_until="domcontentloaded")
    admin_page.wait_for_selector("[data-testid='track-result']", state="visible")

    admin_page.goto(f"{BASE}/admin/login", wait_until="domcontentloaded")
    pwd = admin_page.locator("input[type='password']").first
    assert pwd.count() > 0, "field password login admin tidak ada"

    # Password salah -> ditolak, tetap di halaman login dengan pesan error.
    pwd.fill("pasti-salah")
    admin_page.locator("form button[type='submit']").first.click()
    admin_page.wait_for_timeout(1200)
    assert "/admin/login" in admin_page.url, "password salah ternyata diterima"
    assert admin_page.locator("[role='alert']").count() > 0, (
        "password salah diterima tanpa pesan error"
    )

    # Password benar (default NEXT_PUBLIC_ADMIN_PASSWORD) -> masuk kanban.
    pwd.fill("admin123")
    admin_page.locator("form button[type='submit']").first.click()
    admin_page.wait_for_url(re.compile(r"/admin/?$"), timeout=45000)
    admin_page.wait_for_selector("h2:text-is('Backlog')", state="visible", timeout=45000)

    for label in ("Backlog", "In Progress", "Need Review", "Completed"):
        found = admin_page.locator(f"h2:text-is('{label}')").count()
        assert found > 0, f"kolom kanban '{label}' tidak ditemukan"
    assert admin_page.get_by_text(DEMO_NUMBER).count() > 0, (
        f"pesanan demo {DEMO_NUMBER} tidak tampil di kanban"
    )
    shot(admin_page, "e2e-05-kanban-admin.png")


def test_05_admin_pindah_status_kartu_pindah_kolom(admin_page):
    """(e) Ubah status dari kanban -> kartu pindah kolom."""
    number = DEMO_NUMBER  # demo berstatus completed -> kolom Completed
    assert column_contains(admin_page, "Completed", number), (
        f"pra-syarat gagal: {number} tidak ada di kolom Completed"
    )

    # Kartu = leluhur terdekat yang memuat <select> pemindah status.
    card = admin_page.locator(f"text={number}").first.locator(
        "xpath=ancestor::*[.//select][1]"
    )
    select = card.locator("select").first
    if select.count():
        try:
            select.select_option(label="In Progress")
        except Exception:  # noqa: BLE001 — label default pun menuju In Progress
            pass
    move_btn = card.locator(
        "button[aria-label*='Pindahkan'], button:has-text('Pindah')"
    ).first
    assert move_btn.count() > 0, "tombol pindah status tidak ditemukan di kartu"
    move_btn.click()

    def moved():
        into = column_contains(admin_page, "In Progress", number)
        out = column_contains(admin_page, "Completed", number)
        return into is True and out is False

    ok = poll_until(moved, timeout_s=15)
    assert ok is True, (
        "kartu tidak pindah kolom: "
        f"In Progress={column_contains(admin_page, 'In Progress', number)} "
        f"Completed={column_contains(admin_page, 'Completed', number)}"
    )
    shot(admin_page, "e2e-06-status-pindah.png")
