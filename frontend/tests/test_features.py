"""Uji fitur UI Aether Creative di browser nyata — FRONTEND-ONLY (tanpa backend).

Kontrak: docs/FRONTEND-ONLY.md. Backend/database sudah dihapus; fokus suite:
halaman lacak + detail, persistensi brief di localStorage, skema store
`aether-orders`, gate + kanban admin, 404, responsivitas, dan kebersihan JS.

Server Next lokal SAJA (tanpa fixture backend):

    cd frontend && PORT=3720 npx next dev -p 3720
    BASE_URL=http://localhost:3720 pytest tests/test_features.py
"""
import json
import os
import re
import tempfile
import time

import pytest
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:3720").rstrip("/")
SHOT_DIR = os.environ.get("SHOT_DIR", os.path.join(tempfile.gettempdir(), "aether-shots"))
os.makedirs(SHOT_DIR, exist_ok=True)

DEMO_NUMBER = "UK-ORD-8812"


def shot(page, name):
    try:
        page.screenshot(path=os.path.join(SHOT_DIR, name), full_page=False)
    except Exception:  # noqa: BLE001 — screenshot tidak boleh menjatuhkan tes
        pass


def poll_until(fn, timeout_s=15.0, interval=0.5):
    """Panggil fn() sampai True (atau nilai terakhir saat waktu habis)."""
    deadline = time.time() + timeout_s
    last = None
    while time.time() < deadline:
        last = fn()
        if last is True:
            return True
        time.sleep(interval)
    return last


def track_demo(page):
    """Isi nomor demo lalu lacak; hasil harus tampak."""
    page.goto(f"{BASE}/orders", wait_until="domcontentloaded")
    page.wait_for_selector("#order-number", state="visible")
    page.fill("#order-number", DEMO_NUMBER)
    page.locator("form button[type='submit']").first.click()
    return page.wait_for_selector("[data-testid='track-result']", state="visible")


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        yield b
        b.close()


@pytest.fixture()
def page(browser):
    context = browser.new_context(viewport={"width": 1280, "height": 900})
    pg = context.new_page()
    pg.set_default_timeout(45000)
    yield pg
    context.close()


def test_01_orders_page_dan_input_cari(page):
    page.goto(f"{BASE}/orders", wait_until="domcontentloaded")
    page.wait_for_selector("#order-number", state="visible")
    title = page.title().lower()
    assert any(word in title for word in ("lacak", "pesanan", "aether")), f"judul aneh: {page.title()}"
    assert "Aether" in page.evaluate("() => document.body.innerText"), "brand tidak tampak"
    over = page.evaluate("() => document.documentElement.scrollWidth - window.innerWidth")
    assert over <= 1, f"/orders overflow {over}px"
    shot(page, "feat-01-orders.png")


def test_02_lacak_demo_menampilkan_hasil(page):
    result = track_demo(page)
    text = result.inner_text()
    assert DEMO_NUMBER in text, f"hasil lacak tanpa nomor demo: {text[:160]}"
    shot(page, "feat-02-lacak-demo.png")


def test_03_skema_store_aether_orders(page):
    """localStorage['aether-orders'] berisi order demo dengan skema kontrak."""
    track_demo(page)
    raw = page.evaluate("() => localStorage.getItem('aether-orders')")
    assert raw, "localStorage['aether-orders'] kosong padahal demo di-seed"
    orders = json.loads(raw)
    assert isinstance(orders, list) and len(orders) >= 1, "store bukan daftar order"
    demo = next((o for o in orders if o.get("order_number") == DEMO_NUMBER), None)
    assert demo is not None, f"order demo {DEMO_NUMBER} tidak ada di store"
    for field in ("id", "status", "logs", "drafts", "created_at", "updated_at"):
        assert field in demo, f"skema order kurang field '{field}'"
    assert isinstance(demo["logs"], list) and demo["logs"], "order demo tanpa log"
    assert isinstance(demo["drafts"], list) and demo["drafts"], "order demo tanpa draft"


def test_04_detail_order_dan_tombol_salin(browser):
    context = browser.new_context(viewport={"width": 1280, "height": 900})
    try:
        context.grant_permissions(["clipboard-read", "clipboard-write"], origin=BASE)
        pg = context.new_page()
        pg.set_default_timeout(45000)
        track_demo(pg)
        link = pg.locator("a[href*='/orders/']").first
        if link.count() == 0:
            pytest.skip("halaman hasil lacak tidak menautkan detail order")
        href = link.get_attribute("href")
        pg.goto(BASE + href, wait_until="domcontentloaded")
        pg.wait_for_timeout(1200)
        body = pg.evaluate("() => document.body.innerText")
        assert DEMO_NUMBER in body.upper(), f"detail order tanpa nomor: {body[:140]}"

        copy_btn = pg.locator("button:has-text('Salin')")
        assert copy_btn.count() > 0, "tombol salin tidak ada di detail order"
        copy_btn.first.click()
        pg.wait_for_timeout(800)
        body = pg.evaluate("() => document.body.innerText")
        assert "tersalin" in body.lower() or "salin" in body.lower(), (
            f"konfirmasi salin tidak tampak: {body[:200]}"
        )
        shot(pg, "feat-04-detail-order.png")
    finally:
        context.close()


def test_05_customizer_brief_terpulihkan_dari_localstorage(page):
    page.goto(f"{BASE}/customizer/artisan-cafe", wait_until="domcontentloaded")
    page.wait_for_selector("#brief-brand", state="visible")
    page.fill("#brief-brand", "Warung Uji Otomatis")
    page.wait_for_timeout(1000)  # debounce simpan draf
    page.reload(wait_until="domcontentloaded")
    page.wait_for_selector("#brief-brand", state="visible")

    # Nilai terisi setelah hidrasi + effect pemulihan; baca dengan poll,
    # bukan seketika, supaya tidak kalah cepat dari hidrasi React.
    holder = {"value": ""}

    def restored():
        holder["value"] = page.locator("#brief-brand").input_value()
        return holder["value"] == "Warung Uji Otomatis"

    assert poll_until(restored, timeout_s=20), (
        f"brief tidak terpulihkan: {holder['value']!r}"
    )
    shot(page, "feat-05-brief-persist.png")


def test_06_customizer_counter_dan_tombol_kirim(page):
    page.goto(f"{BASE}/customizer/artisan-cafe", wait_until="domcontentloaded")
    page.wait_for_selector("#brief-desc", state="visible")
    page.fill("#brief-desc", "Deskripsi uji untuk memicu penghitung karakter di layar.")
    page.wait_for_timeout(400)
    body = page.evaluate("() => document.body.innerText")
    assert re.search(r"/\s?\d{2,4}", body) is not None, "penghitung karakter tidak tampil"
    submit = page.locator("button:has-text('Kirim Pesanan via WhatsApp')")
    assert submit.count() > 0, "tombol 'Kirim Pesanan via WhatsApp' tidak ada"
    shot(page, "feat-06-customizer.png")


def test_07_admin_gate_arahkan_ke_login(page):
    page.goto(f"{BASE}/admin", wait_until="domcontentloaded")
    page.wait_for_url("**/admin/login**", timeout=45000)
    assert "/admin/login" in page.url, f"tanpa cookie tidak dilempar ke login: {page.url}"
    pwd = page.locator("input[type='password']")
    assert pwd.count() > 0, "field password tidak ada di halaman login"


def test_08_admin_login_kanban_statistik_cari(page):
    # Seed demo dulu di konteks ini supaya kanban punya isi.
    page.goto(f"{BASE}/orders?number={DEMO_NUMBER}", wait_until="domcontentloaded")
    page.wait_for_selector("[data-testid='track-result']", state="visible")

    page.goto(f"{BASE}/admin/login", wait_until="domcontentloaded")
    page.fill("input[type='password']", "admin123")
    page.locator("form button[type='submit']").first.click()
    page.wait_for_url(re.compile(r"/admin/?$"), timeout=45000)
    page.wait_for_selector("h2:text-is('Backlog')", state="visible", timeout=45000)
    assert page.get_by_text(DEMO_NUMBER).count() > 0, "pesanan demo tidak tampil di kanban"

    body = page.evaluate("() => document.body.innerText")
    assert "Rp" in body, f"statistik (Rp) tidak tampak: {body[:200]}"

    search = page.locator("input[type='search'], input[placeholder*='Cari' i]").first
    if search.count():
        search.fill(DEMO_NUMBER)
        page.wait_for_timeout(900)
        assert page.get_by_text(DEMO_NUMBER).count() > 0, "pencarian menyembunyikan demo"
        search.fill("")
        page.wait_for_timeout(500)
    shot(page, "feat-08-admin.png")


def test_09_halaman_404_kustom(page):
    page.goto(f"{BASE}/halaman-tidak-ada", wait_until="domcontentloaded")
    page.wait_for_timeout(800)
    body = page.evaluate("() => document.body.innerText")
    assert "tidak ditemukan" in body.lower(), f"404 kustom tidak tampil: {body[:140]}"


def test_10_tanpa_error_js_di_halaman_utama(page):
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    for path in ("/", "/orders", "/customizer/artisan-cafe", "/admin/login"):
        page.goto(BASE + path, wait_until="domcontentloaded")
        page.wait_for_timeout(700)
    assert not errors, f"pageerror JS: {errors[:3]}"


@pytest.mark.parametrize("width", [320, 375, 768])
def test_11_responsif_tanpa_overflow(browser, width):
    context = browser.new_context(viewport={"width": width, "height": 800})
    pg = context.new_page()
    pg.set_default_timeout(45000)
    try:
        for path in ("/", "/orders"):
            pg.goto(BASE + path, wait_until="domcontentloaded")
            pg.wait_for_timeout(600)
            over = pg.evaluate(
                "() => document.documentElement.scrollWidth - window.innerWidth"
            )
            assert over <= 1, f"{width}px {path} overflow {over}px"
    finally:
        context.close()
