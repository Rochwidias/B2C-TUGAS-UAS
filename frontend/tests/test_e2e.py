"""E2E alur customer + admin CraftAI Studio lewat Playwright.

    cd frontend && npm run build && npm start &
    pip install playwright && playwright install chromium
    python3 tests/test_e2e.py   # screenshot -> folder ini (override: SHOT_DIR)
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
WS = os.environ.get("SHOT_DIR", os.path.dirname(os.path.abspath(__file__)))
results = []


def check(label, cond):
    results.append((label, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'}  {label}")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    # --- 1. Home ---
    page.goto(f"{BASE}/", wait_until="networkidle")
    check("home: judul CraftAI Studio", "CraftAI" in page.title())
    grid = page.locator("[data-testid='template-grid'] [class*='rounded-2xl']")
    check("home: katalog render 3 kartu", grid.count() >= 3)
    page.screenshot(path=f"{WS}/e2e-01-home.png", full_page=False)

    # --- 2. Filter kategori (bug prototype lama) ---
    before = page.locator("[data-testid='template-grid'] > *").count()
    btn = page.get_by_role("button", name="Portofolio & Agensi")
    check("home: tombol filter ada", btn.count() > 0)
    if btn.count():
        btn.first.click()
        page.wait_for_timeout(400)
        after = page.locator("[data-testid='template-grid'] > *").count()
        check(f"home: filter bekerja ({before} -> {after} kartu)", after < before and after >= 1)
        page.screenshot(path=f"{WS}/e2e-02-filter.png")
        page.get_by_role("button", name="Semua").first.click()
        page.wait_for_timeout(300)

    # --- 3. Customizer: generate draft ---
    page.get_by_role("link", name="Kustomisasi dengan AI").first.click()
    page.wait_for_url("**/customizer/**", timeout=30000)
    page.wait_for_load_state("networkidle")
    check("customizer: halaman terbuka", "/customizer/" in page.url)

    draft_bodies = []
    page.on("request", lambda req: draft_bodies.append(req.post_data)
            if "/api/drafts" in req.url and req.method == "POST" else None)
    page.fill("#brief-brand", "Nasi Goreng Pak Kumis")
    page.fill("#brief-tagline", "Nasi Goreng Jawa Legendaris Sejak 1985")
    page.fill("#brief-desc", "Buka malam, spesial kampung pedas mantap.")
    page.select_option("#brief-color", "rose")
    page.fill("#brief-cta", "Pesan via WhatsApp")
    gen = page.get_by_role("button", name="Generate Modifikasi AI")
    check("customizer: tombol generate ada", gen.count() > 0)
    gen.first.click()
    page.wait_for_selector("[data-testid='draft-preview']", timeout=45000)
    check("customizer: preview draft ter-render", page.locator("[data-testid='draft-preview']").count() > 0)
    check("customizer: headline memakai tagline brief",
          "Legendaris" in page.locator("[data-testid='draft-preview']").inner_text())
    sent_brand = ""
    if draft_bodies:
        import json as _json
        sent_brand = _json.loads(draft_bodies[-1]).get("brandName", "")
    check(f"customizer: brandName terkirim bersih ({sent_brand!r})",
          sent_brand == "Nasi Goreng Pak Kumis")
    check("customizer: badge engine jujur",
          page.locator("text=local").count() + page.locator("text=gemini").count() > 0)
    page.screenshot(path=f"{WS}/e2e-03-customizer.png", full_page=True)

    # --- 4. Checkout ---
    check("customizer: form kontak ada",
          page.locator("#contact-name").count() > 0 and page.locator("#contact-email").count() > 0)
    page.fill("#contact-name", "Pak Kumis")
    page.fill("#contact-wa", "08111222333")
    page.fill("#contact-email", "kumis@example.com")
    submit = page.get_by_role("button", name="Kirim ke Tim Developer untuk Dikerjakan")
    check("customizer: tombol kirim aktif setelah generate", submit.count() > 0 and submit.first.is_enabled())
    submit.first.click()
    page.wait_for_url("**/orders/**", timeout=30000)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)
    order_url = page.url
    check("checkout: redirect ke /orders/<id>", "/orders/" in order_url)
    check("order detail: stepper 5 tahap ada", page.locator("text=Dikerjakan").count() > 0 and page.locator("text=Selesai").count() > 0)
    check("order detail: nomor order tercetak", "UK-ORD-" in page.content())
    page.screenshot(path=f"{WS}/e2e-04-order-detail.png", full_page=True)

    # --- 5. Tracking nomor ---
    page.goto(f"{BASE}/orders", wait_until="networkidle")
    page.screenshot(path=f"{WS}/e2e-05-tracking.png")
    num_input = page.locator("input[type='text']").first
    num_input.fill("UK-ORD-8812")
    page.get_by_role("button", name="Lacak").first.click() if page.get_by_role("button", name="Lacak").count() else page.locator("form button").first.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    check("tracking: menemukan order demo UK-ORD-8812", "8812" in page.content() or "/orders/" in page.url)
    page.screenshot(path=f"{WS}/e2e-06-tracking-result.png", full_page=True)

    # --- 6. Admin login ---
    page.goto(f"{BASE}/admin/login", wait_until="networkidle")
    page.screenshot(path=f"{WS}/e2e-07-admin-login.png")
    # gate: akses /admin tanpa cookie harus dialihkan
    page.goto(f"{BASE}/admin", wait_until="networkidle")
    check("admin gate: tanpa cookie -> /admin/login", "/admin/login" in page.url)
    pwd = page.locator("input[type='password']").first
    pwd.fill("salah")
    page.locator("form button[type='submit']").first.click()
    page.wait_for_timeout(1000)
    check("admin: password salah ditolak", "/admin/login" in page.url)
    pwd.fill("admin123")
    page.locator("form button[type='submit']").first.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    check("admin: login benar -> kanban", "/admin" in page.url and "/login" not in page.url)
    page.screenshot(path=f"{WS}/e2e-08-kanban.png", full_page=True)
    check("kanban: kolom Backlog ada", page.locator("text=Backlog").count() > 0)
    check("kanban: order demo UK-ORD-8812 tampil", page.locator("text=8812").count() > 0)

    # --- 7. Detail order admin + delivery ---
    card = page.locator("a[href*='/admin/orders/']").first
    if card.count():
        card.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(800)
        check("admin detail: payload JSON tampil", page.locator("text=features").count() > 0 or page.locator("pre").count() > 0)
        page.screenshot(path=f"{WS}/e2e-09-admin-order.png", full_page=True)

    # --- 8. responsive 375px ---
    page.set_viewport_size({"width": 375, "height": 800})
    page.goto(f"{BASE}/", wait_until="networkidle")
    sw = page.evaluate("document.documentElement.scrollWidth")
    check(f"responsive 375px: tidak overflow (scrollWidth={sw})", sw <= 395)
    page.screenshot(path=f"{WS}/e2e-10-mobile-home.png", full_page=True)

    check(f"tanpa pageerror JS ({len(errors)} error)", len(errors) == 0)
    if errors:
        for e in errors[:5]:
            print("  pageerror:", e)

    browser.close()

print("\n=== HASIL E2E ===")
failed = sum(1 for _, ok in results if not ok)
print(f"{len(results) - failed}/{len(results)} lolos")
sys.exit(1 if failed else 0)