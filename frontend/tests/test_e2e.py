"""E2E alur customer + admin Aether Creative (WhatsApp, TANPA AI) via Playwright.

    cd frontend && npm run build && npm start &
    python3 tests/test_e2e.py   # screenshot -> folder ini (override: SHOT_DIR)

Disesuaikan dengan kontrak docs/WHATSAPP-FLOW.md:
  - tidak ada lagi tombol "Generate" / badge engine / POST /api/drafts;
  - customizer: isi brief + kontak -> "Kirim Pesanan via WhatsApp" ->
    POST /api/orders -> nomor order + tombol "Buka WhatsApp" (wa.me) dan
    "Cek Status Pesanan".
Selector dicari dengan daftar cadangan dan setiap langkah dibungkus aman:
elemen yang hilang tercatat sebagai FAIL (bukan crash yang membuang sisa uji).
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:3000")
WS = os.environ.get("SHOT_DIR", os.path.dirname(os.path.abspath(__file__)))
results = []


def check(label, cond, detail=""):
    results.append((label, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'}  {label}" + (f"  [{detail}]" if detail and not cond else ""))


def step(label, fn):
    """Jalankan satu langkah; exception tercatat sebagai FAIL, bukan crash."""
    try:
        fn()
    except Exception as exc:  # noqa: BLE001 — laporkan, jangan hentikan suite
        check(label, False, f"{type(exc).__name__}: {exc}")


def first(page, selectors):
    """Selector pertama yang ada (boleh kosong -> None)."""
    for sel in selectors:
        loc = page.locator(sel)
        try:
            if loc.count() > 0:
                return loc.first
        except Exception:  # noqa: BLE001
            continue
    return None


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    # --- 1. Home ---
    def home():
        page.goto(f"{BASE}/", wait_until="networkidle")
        check("home: judul memakai 'Aether Creative'", "Aether" in page.title(), page.title())
        grid = page.locator("[data-testid='template-grid'] article")
        check("home: katalog render 3 kartu", grid.count() >= 3, f"jumlah={grid.count()}")
        page.screenshot(path=f"{WS}/e2e-01-home.png", full_page=False)
    step("home dimuat", home)

    # --- 2. Filter kategori (kontrak: Semua | Kuliner | Kreator | Toko Online) ---
    def filter_kategori():
        before = page.locator("[data-testid='template-grid'] > *").count()
        btn = first(page, ["button:has-text('Kuliner')", "button:has-text('Kreator')",
                           "button:has-text('Portofolio & Agensi')"])
        check("home: tombol filter kategori ada", btn is not None)
        if btn is None:
            return
        btn.click()
        page.wait_for_timeout(400)
        after = page.locator("[data-testid='template-grid'] > *").count()
        check(f"home: filter bekerja ({before} -> {after} kartu)",
              0 < after < before, f"{before}->{after}")
        page.screenshot(path=f"{WS}/e2e-02-filter.png")
        semua = first(page, ["button:has-text('Semua')"])
        if semua is not None:
            semua.click()
            page.wait_for_timeout(300)
    step("filter kategori", filter_kategori)

    # --- 3. Customizer: isi brief, kirim pesanan (tanpa Generate AI) ---
    order_bodies = []
    page.on("request", lambda req: order_bodies.append(req.post_data)
            if "/api/orders" in req.url and req.method == "POST" else None)

    def customizer():
        page.locator("[data-testid='template-grid'] a[href^='/customizer/']").first.click()
        page.wait_for_url("**/customizer/**", timeout=30000)
        page.wait_for_load_state("networkidle")
        check("customizer: halaman terbuka", "/customizer/" in page.url, page.url)

        filled = []
        for sel in ("#brief-brand", "#brief-merek", "#brief-merek-lokasi",
                    "form textarea", "form input[type='text']"):
            loc = first(page, [sel])
            if loc is not None:
                loc.fill("Nasi Goreng Pak Kumis")
                filled.append(sel)
                break
        check("customizer: field brief bisa diisi", bool(filled), f"selector={filled}")
        for sel in ("#brief-tagline", "#brief-desc", "#brief-segmen"):
            loc = first(page, [sel])
            if loc is not None:
                loc.fill("Buka malam, spesial kampung pedas mantap.")
                break
        warna = first(page, ["#brief-color", "select"])
        if warna is not None:
            try:
                warna.select_option("rose")
            except Exception:  # noqa: BLE001 — opsi bisa berbeda
                pass
        cta = first(page, ["#brief-cta"])
        if cta is not None:
            cta.fill("Pesan via WhatsApp")
        page.screenshot(path=f"{WS}/e2e-03-customizer.png", full_page=True)

        check("customizer: form kontak ada",
              first(page, ["#contact-name"]) is not None and first(page, ["#contact-email"]) is not None)
        nama = first(page, ["#contact-name"])
        wa = first(page, ["#contact-wa"])
        mail = first(page, ["#contact-email"])
        if nama: nama.fill("Pak Kumis")
        if wa: wa.fill("08111222333")
        if mail: mail.fill("kumis@example.com")

        # Tombol checkout baru; label lama juga dicoba agar tidak crash bila
        # UI belum berganti.
        submit = first(page, ["button:has-text('Kirim Pesanan via WhatsApp')",
                              "button:has-text('WhatsApp')",
                              "button:has-text('Kirim ke Tim Developer')"])
        check("customizer: tombol kirim pesanan ada", submit is not None)
        if submit is None:
            return
        check("customizer: tombol kirim aktif", submit.is_enabled())
        submit.click()
        page.wait_for_timeout(2500)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1500)

        # Kontrak: respons berisi nomor order + link wa.me (bukan redirect
        # langsung ke /orders/[id] seperti alur lama).
        content = page.content()
        check("pesanan tercatat: nomor UK-ORD tampil", "UK-ORD-" in content, page.url)
        wa_links = page.locator("a[href*='wa.me']")
        check("ada link wa.me (Buka WhatsApp)", wa_links.count() > 0,
              f"jumlah={wa_links.count()}")
        page.screenshot(path=f"{WS}/e2e-04-order-wa.png", full_page=True)

        if order_bodies:
            try:
                sent = json.loads(order_bodies[-1])
            except Exception:  # noqa: BLE001
                sent = {}
            brief_sent = sent.get("brief") if isinstance(sent.get("brief"), dict) else sent
            brief_sent = brief_sent if isinstance(brief_sent, dict) else {}
            check("POST /api/orders memakai brief baru (merekLokasi) & tanpa draftId",
                  "merekLokasi" in brief_sent and "draftId" not in sent,
                  f"keys={list(sent)} brief={list(brief_sent) if isinstance(brief_sent, dict) else brief_sent}")
        else:
            check("POST /api/orders terdeteksi", False, "tidak ada request tercatat")

        # Tombol status -> halaman lacak.
        cek = first(page, ["button:has-text('Cek Status Pesanan')",
                           "a:has-text('Cek Status Pesanan')",
                           "a:has-text('Cek Status')"])
        if cek is not None:
            cek.click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(800)
            check("cek status -> halaman lacak pesanan", "/orders" in page.url, page.url)
            check("halaman status memuat nomor order", "UK-ORD-" in page.content())
            page.screenshot(path=f"{WS}/e2e-05-order-status.png", full_page=True)
    step("alur customizer -> pesanan WhatsApp", customizer)

    # --- 5. Tracking nomor ---
    def tracking():
        page.goto(f"{BASE}/orders", wait_until="networkidle")
        page.screenshot(path=f"{WS}/e2e-06-tracking.png")
        num_input = page.locator("input[type='text']").first
        num_input.fill("UK-ORD-8812")
        lacak = page.get_by_role("button", name="Lacak")
        (lacak.first if lacak.count() else page.locator("form button").first).click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        check("tracking: menemukan order demo UK-ORD-8812",
              "8812" in page.content() or "/orders/" in page.url, page.url)
        # Tombol WhatsApp di halaman status (kontrak: jalur utama chat WA).
        check("tracking: tombol/link Chat via WhatsApp tersedia",
              page.locator("a[href*='wa.me']").count() > 0)
        page.screenshot(path=f"{WS}/e2e-07-tracking-result.png", full_page=True)
    step("lacak nomor order", tracking)

    # --- 6. Admin login ---
    def admin_login():
        page.goto(f"{BASE}/admin/login", wait_until="networkidle")
        page.screenshot(path=f"{WS}/e2e-08-admin-login.png")
        page.goto(f"{BASE}/admin", wait_until="networkidle")
        check("admin gate: tanpa cookie -> /admin/login", "/admin/login" in page.url, page.url)
        pwd = page.locator("input[type='password']").first
        pwd.fill("salah")
        page.locator("form button[type='submit']").first.click()
        page.wait_for_timeout(1000)
        check("admin: password salah ditolak", "/admin/login" in page.url, page.url)
        pwd.fill("admin123")
        page.locator("form button[type='submit']").first.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1500)
        check("admin: login benar -> kanban", "/admin" in page.url and "/login" not in page.url,
              page.url)
        page.screenshot(path=f"{WS}/e2e-09-kanban.png", full_page=True)
        check("kanban: kolom Backlog ada", page.locator("text=Backlog").count() > 0)
        check("kanban: order demo UK-ORD-8812 tampil", page.locator("text=8812").count() > 0)
    step("login back-office", admin_login)

    # --- 7. Detail order admin (brief + editor konten poster) ---
    def admin_detail():
        card = page.locator("a[href*='/admin/orders/']").first
        if card.count() == 0:
            check("admin detail: kartu order tersedia", False)
            return
        card.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(800)
        body = page.evaluate("() => document.body.innerText")
        check("admin detail: brief customer tampil",
              "brief" in body.lower() or "merek" in body.lower(), body[:160])
        check("admin detail: editor konten poster / payload tampil",
              page.locator("pre").count() > 0 or "headline" in body.lower(), body[:160])
        check("admin detail: tombol Chat ke Customer (wa.me)",
              page.locator("a[href*='wa.me']").count() > 0)
        page.screenshot(path=f"{WS}/e2e-10-admin-order.png", full_page=True)
    step("detail order admin", admin_detail)

    # --- 8. responsive 375px ---
    def responsive():
        page.set_viewport_size({"width": 375, "height": 800})
        page.goto(f"{BASE}/", wait_until="networkidle")
        sw = page.evaluate("document.documentElement.scrollWidth")
        check(f"responsive 375px: tidak overflow (scrollWidth={sw})", sw <= 395)
        page.screenshot(path=f"{WS}/e2e-11-mobile-home.png", full_page=True)
    step("responsive 375px", responsive)

    check(f"tanpa pageerror JS ({len(errors)} error)", len(errors) == 0, str(errors[:3]))
    if errors:
        for e in errors[:5]:
            print("  pageerror:", e)

    browser.close()

print("\n=== HASIL E2E ===")
failed = sum(1 for _, ok in results if not ok)
print(f"{len(results) - failed}/{len(results)} lolos")
sys.exit(1 if failed else 0)