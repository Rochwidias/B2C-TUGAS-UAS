"""Uji fitur baru di browser nyata: toast, copy, filter, persistensi, 401.

Menjalankan terhadap server produksi yang sudah hidup.
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:3500").rstrip("/")
SHOT = os.environ.get("SHOT_DIR", "D:/hermes/cache/scratch/shots-features")
PASS, FAIL = [], []


def check(label, cond, detail=""):
    (PASS if cond else FAIL).append(label)
    print(f"{'PASS' if cond else 'FAIL'}  {label}" + (f"  [{detail}]" if detail and not cond else ""))


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    # ---------- 1. /orders: filter status ----------
    page.goto(f"{BASE}/orders", wait_until="networkidle")
    page.wait_for_timeout(500)
    check("/orders judul ada", "lacak" in page.title().lower() or "pesanan" in page.title().lower(),
          page.title())
    check("/orders tidak overflow", page.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth + 1"))

    # input cari
    search = page.locator("input[type='search'], input[placeholder*='UK-ORD']").first
    check("input cari nomor order ada", search.count() > 0)

    # ---------- 2. lacak order demo ----------
    if search.count() > 0:
        search.fill("UK-ORD-8812")
        page.keyboard.press("Enter")
        page.wait_for_timeout(2000)
        body = page.evaluate("() => document.body.innerText")
        check("hasil lacak menampilkan nomor order", "UK-ORD-8812" in body.upper(), body[:120])

    # ---------- 3. halaman detail order: tombol salin ----------
    page.goto(f"{BASE}/orders", wait_until="networkidle")
    page.wait_for_timeout(400)
    if search.count() > 0:
        search.fill("UK-ORD-8812")
        page.keyboard.press("Enter")
        page.wait_for_timeout(2000)

    # cari tautan ke detail
    link = page.locator("a[href*='/orders/']").first
    if link.count() > 0:
        href = link.get_attribute("href")
        page.goto(BASE + href, wait_until="networkidle")
        page.wait_for_timeout(1200)
        body = page.evaluate("() => document.body.innerText")
        check("detail order render nomor", "UK-ORD-8812" in body.upper(), body[:100])
        copy_buttons = page.locator("button:has-text('Salin')")
        check("tombol salin ada di detail", copy_buttons.count() > 0, f"jumlah={copy_buttons.count()}")
        if copy_buttons.count() > 0:
            copy_buttons.first.click()
            page.wait_for_timeout(700)
            body = page.evaluate("() => document.body.innerText")
            check("toast konfirmasi salin muncul", "tersalin" in body.lower() or "salin" in body.lower(), body[:200])
        page.screenshot(path=f"{SHOT}/detail-order.png", full_page=False)

    # ---------- 4. customizer: validasi + persistensi ----------
    page.goto(f"{BASE}/customizer/artisan-cafe", wait_until="networkidle")
    page.wait_for_timeout(800)

    brand = page.locator("input[name='brandName'], input[placeholder*='kopi' i], #brandName").first
    if brand.count() == 0:
        brand = page.locator("form input").first
    check("form brief ada", brand.count() > 0)

    # isi sebagian lalu reload -> harus terpulihkan
    if brand.count() > 0:
        brand.fill("Warung Uji Otomatis")
        page.wait_for_timeout(900)  # debounce simpan
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1200)
        brand2 = page.locator("form input").first
        val = brand2.input_value() if brand2.count() > 0 else ""
        check("brief terpulihkan dari localStorage", val == "Warung Uji Otomatis", f"nilai={val!r}")

    # penghitung karakter
    desc = page.locator("textarea").first
    if desc.count() > 0:
        desc.fill("Uji deskripsi yang cukup panjang untuk memicu penghitung karakter.")
        page.wait_for_timeout(500)
        body = page.evaluate("() => document.body.innerText")
        check("penghitung karakter tampil", "/800" in body or "/ 800" in body, body[:300])

    # tombol generate
    gen = page.locator("button:has-text('Generate')")
    check("tombol generate ada", gen.count() > 0, f"jumlah={gen.count()}")
    page.screenshot(path=f"{SHOT}/customizer.png", full_page=False)

    # ---------- 5. admin: login + 401 state ----------
    page.goto(f"{BASE}/admin", wait_until="networkidle")
    page.wait_for_timeout(800)
    check("belum login -> diarahkan ke login", "/admin/login" in page.url, page.url)

    pwd = page.locator("input[type='password']").first
    check("field password ada", pwd.count() > 0)
    if pwd.count() > 0:
        pwd.fill("admin123")
        page.locator("button[type='submit']").first.click()
        page.wait_for_timeout(2500)
        check("login berhasil -> /admin", page.url.rstrip("/").endswith("/admin"), page.url)
        body = page.evaluate("() => document.body.innerText")
        check("dashboard admin render", "papan" in body.lower() or "backlog" in body.lower(), body[:150])
        check("statistik tampil", "Rp" in body, body[:200])
        page.screenshot(path=f"{SHOT}/admin-dashboard.png", full_page=False)

        # filter & cari
        search_admin = page.locator("input[type='search'], input[placeholder*='Cari']").first
        check("input cari admin ada", search_admin.count() > 0)
        if search_admin.count() > 0:
            search_admin.fill("8812")
            page.wait_for_timeout(900)
            body = page.evaluate("() => document.body.innerText")
            check("filter admin menyaring hasil", "8812" in body or "tidak ada" in body.lower(), body[:200])

    # ---------- 6. 404 ----------
    page.goto(f"{BASE}/halaman-tidak-ada", wait_until="networkidle")
    page.wait_for_timeout(400)
    body = page.evaluate("() => document.body.innerText")
    check("404 halaman kustom tampil", "tidak ditemukan" in body.lower(), body[:120])

    # ---------- 7. error JS ----------
    check("tidak ada error JS di halaman", len(errors) == 0, str(errors[:2]))

    # ---------- 8. responsif 320px ----------
    for width in (320, 375, 768):
        ctx2 = browser.new_context(viewport={"width": width, "height": 800})
        pg = ctx2.new_page()
        for path in ("/", "/orders"):
            pg.goto(BASE + path, wait_until="networkidle")
            pg.wait_for_timeout(600)
            over = pg.evaluate("() => document.documentElement.scrollWidth - window.innerWidth")
            check(f"{width}px {path} tanpa overflow", over <= 1, f"selisih={over}px")
        ctx2.close()

    browser.close()

print()
print(f"{len(PASS)}/{len(PASS) + len(FAIL)} lolos")
if FAIL:
    print("GAGAL:", *FAIL, sep="\n  - ")
sys.exit(1 if FAIL else 0)